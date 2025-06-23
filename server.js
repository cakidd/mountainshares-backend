const express = require('express');
const { ethers } = require('ethers');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(express.static('public'));

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL || 'https://arbitrum-one-rpc.publicnode.com');
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

let contract;
try {
  if (process.env.CONTRACT_ABI && process.env.CONTRACT_ADDRESS) {
    const CONTRACT_ABI = JSON.parse(process.env.CONTRACT_ABI);
    contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
    console.log('✅ H4H contract loaded successfully');
  }
} catch (error) {
  console.error('Contract setup failed:', error.message);
}

app.get('/', (req, res) => {
  res.send(`
    <h1>🏔️ MountainShares Platform</h1>
    <p>Status: ${contract ? 'Full functionality' : 'Basic mode - missing environment variables'}</p>
    <p>Ethers version: ${ethers.version}</p>
    <p>Provider: Connected</p>
  `);
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    ethers_version: ethers.version,
    contract_loaded: !!contract
  });
});

// ✅ RAILWAY FIX: Bind to 0.0.0.0 as required
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Mountain Shares server running on port ${PORT}`);
  console.log(`Ethers version: ${ethers.version}`);
  console.log(`Contract status: ${contract ? 'Loaded' : 'Missing environment variables'}`);
});

module.exports = app;
