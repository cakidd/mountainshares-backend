const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

// Webhook route with raw body handling (Search Result #4)
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log('✅ Webhook verified successfully');
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('🎉 Payment completed:', session.id);
      
      // Call contract for token minting
      if (contractWithSigner) {
        try {
          const amount = ethers.utils.parseEther((session.amount_total / 100).toString());
          const recipientAddress = "0xdE75F5168e33db23fa5601b5fc88545be7b287a4";
          
          console.log(`🔄 Minting ${session.amount_total / 100} tokens`);
          const tx = await contractWithSigner.mint(recipientAddress, amount);
          console.log('✅ Mint transaction sent:', tx.hash);
          
          const receipt = await tx.wait();
          console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
        } catch (mintError) {
          console.error('❌ Minting failed:', mintError.message);
        }
      } else {
        console.error('❌ Contract not available for minting');
      }
    }
    
    res.json({received: true});
  } catch (err) {
    console.error('❌ Webhook error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// JSON middleware for other routes
app.use(express.json());

// Contract setup with CORRECT constructor (Search Results #2, #3, #7)
const MS_TOKEN_ADDRESS = process.env.CONTRACT_ADDRESS || "0xE8A9c6fFE6b2344147D886EcB8608C5F7863B20D";
const TOKEN_ABI = [
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function mint(address to, uint256 amount) external",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

let provider, msToken, contractWithSigner;

async function initializeContract() {
  try {
    // CORRECT ethers.js import and usage (Search Result #3)
    const { ethers } = require('ethers');
    
    // CORRECT provider initialization
    provider = new ethers.providers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
    console.log('✅ Provider created');
    
    // CORRECT contract initialization (Search Result #7)
    msToken = new ethers.Contract(MS_TOKEN_ADDRESS, TOKEN_ABI, provider);
    console.log('✅ Contract created');
    
    // Test contract connection
    const totalSupply = await msToken.totalSupply();
    console.log('✅ Contract responsive, total supply:', ethers.utils.formatEther(totalSupply));
    
    // Setup wallet for transactions
    if (process.env.PRIVATE_KEY) {
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      contractWithSigner = msToken.connect(wallet);
      console.log('✅ Contract setup successful with minting capability');
    } else {
      console.log('⚠️ No private key - read-only mode');
    }
    
  } catch (error) {
    console.error('❌ Contract setup failed:', error.message);
    console.error('Full error:', error);
  }
}

// Initialize contract on startup
initializeContract();

// API endpoints
app.get('/', (req, res) => {
  res.json({ 
    status: 'MountainShares Backend - COMPLETE FIX',
    contractStatus: msToken ? 'Connected' : 'Failed',
    mintingStatus: contractWithSigner ? 'Ready' : 'No wallet',
    webhookStatus: 'Fixed with raw body handling',
    timestamp: new Date().toISOString()
  });
});

app.get('/test-contract', async (req, res) => {
  try {
    if (!msToken) {
      return res.json({
        status: 'FAILED',
        error: 'Contract not initialized'
      });
    }
    
    const totalSupply = await msToken.totalSupply();
    
    res.json({
      status: 'SUCCESS',
      contractAddress: MS_TOKEN_ADDRESS,
      totalSupply: require('ethers').utils.formatEther(totalSupply),
      mintingCapable: !!contractWithSigner,
      timestamp: new Date().toISOString()
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
