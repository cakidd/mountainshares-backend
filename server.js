const express = require('express');

// Dynamic regional fee calculation function
const calculateRegionalFee = (subtotal, cardCountry = 'US', currency = 'USD') => {
    let regionalFee = 0;
    if (cardCountry !== 'US') {
        regionalFee += subtotal * 0.015;
    }
    if (currency !== 'USD') {
        regionalFee += subtotal * 0.01;
    }
    const minBuffer = subtotal * 0.005;
    regionalFee = Math.max(regionalFee, minBuffer);
    return Math.round(regionalFee * 100) / 100;
};

const app = express();
const port = process.env.PORT || 8080;

// Webhook route MUST come before express.json()
app.use("/webhook", express.raw({type: "application/json"}));

// Other middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("."));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Basic route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`Mountain Shares server running on port ${port}`);
});

// Stripe configuration
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

// Create checkout session endpoint
app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: "Stripe not configured" });
  }
  try {
    const { amount } = req.body;
    
    if (!amount || amount < 1 || amount > 10000) {
      return res.status(400).json({ error: 'Invalid amount. Must be between $1 and $10,000' });
    }

    // Calculate fees using your dynamic regional fee system
    const loadingFee = amount * 0.02;
    const subtotal = amount + loadingFee;
    const stripeFeeExact = (subtotal * 0.029) + 0.30;
    const stripeFee = Math.round(stripeFeeExact * 100) / 100;
    const cardCountry = req.body.cardCountry || 'US';
    const currency = req.body.currency || 'USD';
    const regionalFee = Math.round(subtotal * 0.005 * 100) / 100; // Fixed 0.5% buffer
    const total = subtotal + stripeFee + regionalFee;

    // Create Stripe checkout session
    console.log("Debug values:", { amount, total, loadingFee, stripeFee, regionalFee });
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${amount} MountainShares`,
              description: `Digital currency for West Virginia communities`,
            },
            unit_amount: Math.round(Math.round(total * 100) / 100 * 100), // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      automatic_tax: { enabled: false },
      success_url: `https://mountainshares-backend-production.up.railway.app/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://mountainshares-backend-production.up.railway.app/cancel`,
      metadata: {
        tokenAmount: amount.toString(),
        loadingFee: loadingFee.toFixed(2),
        totalPaid: (Math.round(total * 100) / 100).toFixed(2)
      }
    });

    res.json({ url: session.url, id: session.id });
  } catch (error) {
    console.log("=== STRIPE ERROR DEBUG ===");
    console.log("Error message:", error.message);
    console.log("Error type:", error.type);
    console.log("Error code:", error.code);
    console.log("Full error:", JSON.stringify(error, null, 2));
    console.log("=========================");
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Add endpoint to get payment breakdown after Stripe session creation
app.get('/api/payment-breakdown/:session_id', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.session_id);
    const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
    
    res.json({
      amount_subtotal: session.amount_subtotal / 100,
      amount_total: session.amount_total / 100,
      stripe_fee_actual: paymentIntent.charges.data[0]?.balance_transaction?.fee / 100 || 'pending',
      your_loading_fee: parseFloat(session.metadata.loadingFee),
      breakdown_difference: (session.amount_total / 100) - parseFloat(session.metadata.totalPaid)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get breakdown' });
  }
});

// Success page route
app.get('/success', (req, res) => {
  const sessionId = req.query.session_id;
  res.send(`
    <html>
      <head><title>Payment Successful - MountainShares</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>🎉 Payment Successful!</h1>
        <p>Thank you for your MountainShares purchase!</p>
        <p>Session ID: ${sessionId}</p>
        <p><a href="/">Return to MountainShares</a></p>
      </body>
    </html>
  `);
});

// Cancel page route
app.get('/cancel', (req, res) => {
  res.send(`
    <html>
      <head><title>Payment Cancelled - MountainShares</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>Payment Cancelled</h1>
        <p><a href="/">Return to MountainShares</a></p>
      </body>
    </html>
  `);
});

// Add after successful Stripe payment
const { ethers } = require('ethers');

// Webhook to handle successful payments and mint tokens
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook signature verification failed.`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Connect to Arbitrum and mint tokens
    const provider = new ethers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
    
    // Mint tokens with 2% fee distribution
    const amount = session.amount_total / 100; // Convert from cents
    await contract.loadGiftCard(session.customer_details.email, ethers.parseEther(amount.toString()));
  }

  res.json({received: true});
});

// Updated webhook handler for H4H contract
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('Payment successful:', session.id);
    
    try {
      // Connect to Arbitrum and call H4H contract
      const provider = new ethers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      const contract = new ethers.Contract(
        '0xF36Ebf89DF6C7ACdA6F98932Dc6804E833D1eFA1', // H4H contract address
        H4H_CONTRACT_ABI, 
        wallet
      );
      
      // Calculate amount in ETH (convert from cents)
      const amountInDollars = session.amount_total / 100;
      
      // Call loadGiftCard function with payment value
      const tx = await contract.loadGiftCard({
        value: ethers.parseEther(amountInDollars.toString())
      });
      
      console.log('H4H loadGiftCard transaction:', tx.hash);
      await tx.wait(); // Wait for confirmation
      console.log('MountainShares tokens loaded successfully!');
      
    } catch (error) {
      console.error('Error calling H4H contract:', error);
    }
  }

  res.json({received: true});
});

// H4H Contract ABI (add this before your webhook handler)
const CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "loadGiftCard",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
  // Add your complete H4H contract ABI here
];
