const express = require('express');
const { ethers } = require('ethers');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

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
