const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

// Webhook with raw body handling (proven working)
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log('✅ Webhook verified');
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('🎉 Payment completed:', session.id);
      
      // Call contract for token minting
      if (contractWithSigner) {
        try {
          const { ethers } = require('ethers');
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
      }
    }
    
    res.json({received: true});
  } catch (err) {
    console.error('❌ Webhook error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

app.use(express.json());

// Contract setup (proven working locally)
let provider, msToken, contractWithSigner;

async function initContract() {
  try {
    const { ethers } = require('ethers');
    
    provider = new ethers.providers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
    console.log('✅ Provider created');
    
    const abi = [
      "function totalSupply() view returns (uint256)",
      "function mint(address to, uint256 amount) external",
      "event Transfer(address indexed from, address indexed to, uint256 value)"
    ];
    const address = "0xE8A9c6fFE6b2344147D886EcB8608C5F7863B20D";
    
    msToken = new ethers.Contract(address, abi, provider);
    console.log('✅ Contract created');
    
    const supply = await msToken.totalSupply();
    console.log('✅ Contract working, supply:', ethers.utils.formatEther(supply));
    
    if (process.env.PRIVATE_KEY) {
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      contractWithSigner = msToken.connect(wallet);
      console.log('✅ Minting capability ready');
    }
    
  } catch (error) {
    console.error('❌ Contract failed:', error.message);
  }
}

initContract();

// Working endpoints
app.get('/', (req, res) => {
  res.json({ 
    status: 'MountainShares Running',
    contractStatus: msToken ? 'Connected' : 'Failed',
    mintingReady: !!contractWithSigner,
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    contracts: {
      token: "0xE8A9c6fFE6b2344147D886EcB8608C5F7863B20D",
      purchase: "0x2a36e8775EbfaAb18E25Df81EF6Eab05E026f400",
      vault: "0x95e4c1b6aad37e610742254114216ceaf0f49acd",
      connected: !!msToken
    },
    mintingReady: !!contractWithSigner
  });
});

app.listen(process.env.PORT || 8080, () => {
  console.log('MountainShares server running with contract integration');
});
