const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

// CRITICAL: Raw buffer middleware for webhook ONLY
app.use('/webhook', express.raw({type: 'application/json'}));

// Webhook handler with proper raw buffer handling
app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Use the raw buffer directly (req.body is already raw due to middleware)
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log('✅ Webhook signature verified successfully');
  } catch (err) {
    console.log(`⚠️ Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('🎉 Payment completed:', session.id);
    console.log('⚠️ Token minting temporarily disabled - contract setup failed');
  }

  res.json({received: true});
});

// JSON middleware for other routes
app.use(express.json());

// 2. Fix ethers.js import issue (from search result #3)
let provider, msToken, contractWithSigner;

async function initializeContract() {
  try {
    // Direct import approach from search results
    const { ethers } = require('ethers');
    
    console.log('🔄 Attempting contract initialization...');
    
    // Test if ethers is properly imported
    if (!ethers) {
      throw new Error('ethers module not found');
    }
    
    if (!ethers.providers) {
      throw new Error('ethers.providers not found - using v6 syntax');
    }
    
    // Initialize provider
    provider = new ethers.providers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
    console.log('✅ Provider created successfully');
    
    // Test provider connection
    const network = await provider.getNetwork();
    console.log('✅ Connected to network:', network.name, 'chainId:', network.chainId);
    
    // Initialize contract
    const MS_TOKEN_ADDRESS = process.env.CONTRACT_ADDRESS || "0xE8A9c6fFE6b2344147D886EcB8608C5F7863B20D";
    const TOKEN_ABI = [
      "function totalSupply() view returns (uint256)",
      "function balanceOf(address) view returns (uint256)",
      "function mint(address to, uint256 amount) external",
      "event Transfer(address indexed from, address indexed to, uint256 value)"
    ];
    
    msToken = new ethers.Contract(MS_TOKEN_ADDRESS, TOKEN_ABI, provider);
    console.log('✅ Contract created successfully');
    
    // Test contract call
    const totalSupply = await msToken.totalSupply();
    console.log('✅ Contract responsive, total supply:', ethers.utils.formatEther(totalSupply));
    
    // Initialize wallet if private key available
    if (process.env.PRIVATE_KEY) {
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      contractWithSigner = msToken.connect(wallet);
      console.log('✅ Wallet connected, address:', wallet.address);
      console.log('✅ Contract setup successful with minting capability');
    } else {
      console.log('⚠️ No private key - read-only mode');
    }
    
  } catch (error) {
    console.error('❌ Contract initialization failed:', error.message);
    console.error('Full error:', error);
    
    // Detailed error analysis
    const { ethers } = require('ethers');
    console.log('🔍 Debugging ethers import:');
    console.log('ethers exists:', !!ethers);
    console.log('ethers.providers exists:', !!(ethers && ethers.providers));
    console.log('ethers.Contract exists:', !!(ethers && ethers.Contract));
  }
}

// Initialize contract on startup
initializeContract();

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'MountainShares Backend Running',
    contractStatus: msToken ? 'Connected' : 'Failed',
    mintingStatus: contractWithSigner ? 'Ready' : 'No wallet',
    webhookStatus: 'Fixed - Raw buffer handling',
    timestamp: new Date().toISOString()
  });
});

// Test contract endpoint
app.get('/test-contract', async (req, res) => {
  try {
    if (!msToken) {
      return res.json({
        status: 'FAILED',
        error: 'Contract not initialized',
        ethersDebug: {
          ethersExists: !!require('ethers'),
          providersExists: !!(require('ethers').providers)
        }
      });
    }
    
    const totalSupply = await msToken.totalSupply();
    const contractCode = await provider.getCode(process.env.CONTRACT_ADDRESS || "0xE8A9c6fFE6b2344147D886EcB8608C5F7863B20D");
    
    res.json({
      status: 'SUCCESS',
      contractAddress: process.env.CONTRACT_ADDRESS || "0xE8A9c6fFE6b2344147D886EcB8608C5F7863B20D",
      totalSupply: require('ethers').utils.formatEther(totalSupply),
      hasCode: contractCode !== '0x',
      mintingCapable: !!contractWithSigner
    });
    
  } catch (error) {
    res.json({
      status: 'FAILED',
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`MountainShares server running on port ${PORT}`);
});
