const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

// Search Result #4 solution: Webhook with raw body
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log('✅ Webhook verified');
    
    if (event.type === 'checkout.session.completed') {
      console.log('🎉 Payment completed:', event.data.object.id);
    }
    
    res.json({received: true});
  } catch (err) {
    console.error('❌ Webhook error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

app.use(express.json());

// Search Result #3 solution: Correct ethers.js import
let provider, msToken;

async function initContract() {
  try {
    // Fix from search result #3: explicit import path
    const ethers = require('ethers');
    
    if (!ethers.providers) {
      console.error('❌ ethers.providers not found - version mismatch');
      return;
    }
    
    provider = new ethers.providers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
    console.log('✅ Provider created');
    
    const abi = ["function totalSupply() view returns (uint256)"];
    const address = "0xE8A9c6fFE6b2344147D886EcB8608C5F7863B20D";
    
    msToken = new ethers.Contract(address, abi, provider);
    console.log('✅ Contract created');
    
    const supply = await msToken.totalSupply();
    console.log('✅ Contract working, supply:', ethers.utils.formatEther(supply));
    
  } catch (error) {
    console.error('❌ Contract failed:', error.message);
  }
}

initContract();

// Basic endpoints
app.get('/', (req, res) => {
  res.json({ 
    status: 'MountainShares Running',
    contractStatus: msToken ? 'Connected' : 'Failed',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
