const express = require('express');
const { ethers } = require('ethers');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(express.static('public'));

// Ethers v5 provider and wallet setup
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL || 'https://arb1.arbitrum.io/rpc');
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// H4H Contract setup with safety check
let contract;
try {
  if (process.env.CONTRACT_ABI && process.env.CONTRACT_ADDRESS) {
    const CONTRACT_ABI = JSON.parse(process.env.CONTRACT_ABI);
    contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
    console.log('✅ H4H contract loaded successfully');
  } else {
    console.log('⚠️ CONTRACT_ABI or CONTRACT_ADDRESS missing - running in basic mode');
  }
} catch (error) {
  console.error('❌ Contract setup failed:', error.message);
  console.log('⚠️ Running without contract integration');
}

// Basic routes that work without contract
app.get('/', (req, res) => {
  res.send(`
    <h1>🏔️ MountainShares Platform</h1>
    <p>Status: ${contract ? 'Full functionality' : 'Basic mode - missing environment variables'}</p>
    <p>Ethers version: ${ethers.version}</p>
    <p>Provider: ${provider ? 'Connected' : 'Disconnected'}</p>
  `);
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    ethers_version: ethers.version,
    contract_loaded: !!contract,
    environment_variables: {
      RPC_URL: !!process.env.RPC_URL,
      PRIVATE_KEY: !!process.env.PRIVATE_KEY,
      CONTRACT_ADDRESS: !!process.env.CONTRACT_ADDRESS,
      CONTRACT_ABI: !!process.env.CONTRACT_ABI,
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET
    }
  });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Mountain Shares server running on port ${PORT}`);
  console.log(`Ethers version: ${ethers.version}`);
  console.log(`Contract status: ${contract ? 'Loaded' : 'Missing environment variables'}`);
});

module.exports = app;

// Stripe checkout session creation
app.post('/create-checkout-session', express.json(), async (req, res) => {
  try {
    const { amount } = req.body;
    const loadingFee = 0.02;
    const stripeFee = 0.33;
    const regionalFee = 0.01;
    const total = amount + loadingFee + stripeFee + regionalFee;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${amount} MountainShares`,
            description: 'Digital currency for West Virginia communities - JIT Processing',
          },
          unit_amount: Math.round(total * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancel`,
      metadata: {
        tokenAmount: amount.toString(),
        loadingFee: loadingFee.toString(),
        totalPaid: total.toString()
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe webhook with JIT integration
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    try {
      const session = event.data.object;
      const amount = parseFloat(session.metadata.tokenAmount);
      const total = parseFloat(session.metadata.totalPaid);

      console.log('🚀 Processing MountainShares purchase:', { amount, total });

      // Call H4H contract
      if (contract) {
        const contractCallTx = await contract.loadGiftCard({
          value: ethers.utils.parseEther("0.0005")
        });
        await contractCallTx.wait();
        console.log('✅ MountainShares token minted successfully!');
      }

      res.status(200).send('Success');
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).send('Webhook Error');
    }
  } else {
    res.status(200).send('Event received');
  }
});

// Success page
app.get('/success', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>🎉 Payment Successful - MountainShares</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; text-align: center; background: #0A0A0A; color: white; }
            .success { color: #FFD700; font-size: 32px; margin: 20px 0; }
            .info { background: rgba(255, 215, 0, 0.1); padding: 30px; border-radius: 15px; margin: 20px 0; border: 2px solid #FFD700; }
        </style>
    </head>
    <body>
        <h1>🏔️ MountainShares</h1>
        <div class="success">🎉 Payment Successful!</div>
        
        <div class="info">
            <h3>Your MountainShares tokens are being minted!</h3>
            <p>Session ID: ${req.query.session_id}</p>
            <p>Your tokens will appear in your MetaMask wallet shortly.</p>
            <p>Network: Arbitrum One</p>
        </div>
        
        <a href="/" style="color: #FFD700; text-decoration: none; font-size: 18px;">← Return to MountainShares</a>
    </body>
    </html>
  `);
});

// Cancel page
app.get('/cancel', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Payment Cancelled - MountainShares</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; text-align: center; background: #0A0A0A; color: white; }
        </style>
    </head>
    <body>
        <h1>🏔️ MountainShares</h1>
        <h2>Payment Cancelled</h2>
        <p>Your payment was cancelled. No charges were made.</p>
        <a href="/" style="color: #FFD700; text-decoration: none; font-size: 18px;">← Return to MountainShares</a>
    </body>
    </html>
  `);
});
