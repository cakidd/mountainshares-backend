const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { ethers } = require('ethers');

const app = express();

// Webhook route MUST come before express.json() middleware
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Use raw buffer for signature verification
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log(`⚠️ Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('🎉 Payment completed:', session.id);
  }

  res.json({received: true});
});

// JSON middleware comes AFTER webhook route
app.use(express.json());

// Contract setup with proper ethers v5 syntax
const MS_TOKEN_ADDRESS = process.env.CONTRACT_ADDRESS || "0xE8A9c6fFE6b2344147D886EcB8608C5F7863B20D";
const TOKEN_ABI = [
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

let provider, msToken;

try {
  // Correct ethers v5 provider syntax
  provider = new ethers.providers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
  
  // Correct ethers v5 contract syntax
  msToken = new ethers.Contract(MS_TOKEN_ADDRESS, TOKEN_ABI, provider);
  
  console.log('✅ Contract setup successful');
} catch (error) {
  console.error('❌ Contract setup failed:', error.message);
}

// Verification endpoint
app.get('/verify/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  
  try {
    if (!msToken) {
      throw new Error('Contract not initialized');
    }

    // Verify Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // Get contract state
    const totalSupply = await msToken.totalSupply();
    
    // Query recent events
    const filter = msToken.filters.Transfer();
    const recentEvents = await msToken.queryFilter(filter, -100);
    
    res.json({
      stripeSession: {
        id: session.id,
        status: session.payment_status,
        amount: session.amount_total / 100,
        created: new Date(session.created * 1000)
      },
      contractState: {
        totalSupply: ethers.utils.formatEther(totalSupply),
        contractAddress: MS_TOKEN_ADDRESS
      },
      recentEvents: recentEvents.length,
      verification: {
        stripeCompleted: session.payment_status === 'paid',
        contractWorking: true,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ 
      error: error.message,
      sessionId: sessionId,
      contractInitialized: !!msToken
    });
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'MountainShares Backend Running',
    contractStatus: msToken ? 'Connected' : 'Failed',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`MountainShares server running on port ${PORT}`);
  console.log(`Contracts: ${msToken ? 'Connected' : 'Failed'}`);
});
