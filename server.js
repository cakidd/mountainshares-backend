const express = require('express');
const { ethers } = require('ethers');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(express.static('public'));
app.use(express.json());

// ✅ FIXED: Use ethers v6 syntax
const provider = new ethers.providers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// YOUR ACTUAL MOUNTAINSHARES CONTRACTS
const MS_TOKEN_ADDRESS = '0xE8A9c6fFE6b2344147D886EcB8608C5F7863B20D';
const MS_PURCHASE_ADDRESS = '0x2a36e8775EbfaAb18E25Df81EF6Eab05E026f400';
const H4H_VAULT_ADDRESS = '0x95e4c1b6aad37e610742254114216ceaf0f49acd';

// Minimal ABI for token minting
const TOKEN_ABI = [
  "function mint(address to, uint256 amount) external",
  "function balanceOf(address owner) view returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)"
];

let msToken;
try {
  msToken = new ethers.Contract(MS_TOKEN_ADDRESS, TOKEN_ABI, wallet);
  console.log('✅ MountainShares contracts loaded successfully');
} catch (error) {
  console.error('❌ Contract setup failed:', error.message);
}

app.post('/create-checkout-session', async (req, res) => {
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
            description: 'Digital currency for West Virginia communities',
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
        totalPaid: total.toString()
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

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

      console.log('🚀 Processing MountainShares purchase:', { amount });

      // CALL YOUR ACTUAL CONTRACTS
      if (msToken) {
        console.log('💎 Minting MountainShares tokens...');
        
        // Use your actual contract methods with ethers v6 syntax
        const mintTx = await msToken.mint(
          '0xde75f5168e33db23fa5601b5fc88545be7b287a4', // H4H wallet
          ethers.utils.parseEther(amount.toString()) // v6 syntax
        );
        await mintTx.wait();
        
        console.log('✅ MountainShares tokens minted successfully!');
      }

      res.status(200).send('Success');
    } catch (error) {
      console.error('❌ Webhook processing error:', error);
      res.status(500).send('Webhook Error');
    }
  } else {
    res.status(200).send('Event received');
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    contracts: {
      token: MS_TOKEN_ADDRESS,
      purchase: MS_PURCHASE_ADDRESS,
      vault: H4H_VAULT_ADDRESS,
      connected: !!msToken
    }
  });
});

app.get('/success', (req, res) => {
  res.send(`
    <h1>🎉 Payment Successful!</h1>
    <p>Your MountainShares tokens are being minted!</p>
    <p>Session ID: ${req.query.session_id}</p>
  `);
});

app.get('/cancel', (req, res) => {
  res.send('<h1>Payment Cancelled</h1><p>You can try again anytime.</p>');
});

// ✅ RAILWAY FIX: Bind to 0.0.0.0 as required
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`MountainShares server running on port ${PORT}`);
  console.log(`Contracts: ${msToken ? 'Connected' : 'Failed'}`);
});

// Contract verification endpoint
app.get('/verify/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  
  try {
    // Verify the Stripe session was completed
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // Get recent contract events
    const filter = msToken.filters.Transfer();
    const recentEvents = await msToken.queryFilter(filter, -100);
    
    // Get current contract state
    const totalSupply = await msToken.totalSupply();
    
    // Look for events around the payment time
    const sessionTime = new Date(session.created * 1000);
    const relatedEvents = recentEvents.filter(event => {
      const eventTime = new Date(event.blockNumber * 15000); // Approximate block time
      return Math.abs(eventTime - sessionTime) < 600000; // Within 10 minutes
    });
    
    res.json({
      stripeSession: {
        id: session.id,
        status: session.payment_status,
        amount: session.amount_total / 100, // Convert from cents
        created: sessionTime
      },
      contractState: {
        totalSupply: ethers.utils.formatEther(totalSupply),
        contractAddress: MS_TOKEN_ADDRESS
      },
      relatedEvents: relatedEvents.map(event => ({
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        from: event.args.from,
        to: event.args.to,
        amount: ethers.utils.formatEther(event.args.value),
        arbiscanLink: `https://arbiscan.io/tx/${event.transactionHash}`
      })),
      verification: {
        stripeCompleted: session.payment_status === 'paid',
        blockchainEvents: relatedEvents.length > 0,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ 
      error: error.message,
      sessionId: sessionId 
    });
  }
});
