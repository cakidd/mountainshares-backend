const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { ethers } = require('ethers');

const app = express();

// CRITICAL: Webhook route MUST come BEFORE express.json() middleware
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Use raw buffer for signature verification
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log('✅ Webhook signature verified');
  } catch (err) {
    console.log(`⚠️ Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('🎉 Payment completed:', session.id);
    
    // CRITICAL: Actually mint tokens for the customer
    try {
      if (!contractWithSigner) {
        console.error('❌ CRITICAL: No wallet configured - cannot mint tokens!');
        return res.status(500).json({error: 'Minting not available'});
      }
      
      // Calculate token amount
      const dollarAmount = session.amount_total / 100;
      const tokenAmount = ethers.utils.parseEther(dollarAmount.toString());
      const recipientAddress = "0xdE75F5168e33db23fa5601b5fc88545be7b287a4";
      
      console.log(`🔄 Minting ${dollarAmount} tokens for payment ${session.id}`);
      console.log(`Recipient: ${recipientAddress}`);
      
      // Send the actual mint transaction
      const tx = await contractWithSigner.mint(recipientAddress, tokenAmount);
      console.log('✅ Mint transaction sent:', tx.hash);
      console.log('🔗 Arbiscan link:', `https://arbiscan.io/tx/${tx.hash}`);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
      
    } catch (contractError) {
      console.error('❌ CRITICAL: Token minting failed:', contractError.message);
    }
  }

  res.json({received: true});
});

// JSON middleware comes AFTER webhook route
app.use(express.json());

// Contract setup with COMPLETE ABI
const MS_TOKEN_ADDRESS = process.env.CONTRACT_ADDRESS || "0xE8A9c6fFE6b2344147D886EcB8608C5F7863B20D";
const TOKEN_ABI = [
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function mint(address to, uint256 amount) external",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Mint(address indexed to, uint256 amount)"
];

let provider, msToken, wallet, contractWithSigner;

try {
  // CORRECT ethers v5 provider syntax
  provider = new ethers.providers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
  
  // CORRECT ethers v5 contract syntax
  msToken = new ethers.Contract(MS_TOKEN_ADDRESS, TOKEN_ABI, provider);
  
  // Wallet setup for sending transactions
  if (process.env.PRIVATE_KEY) {
    wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    contractWithSigner = msToken.connect(wallet);
    console.log('✅ Contract setup successful with minting capability');
  } else {
    console.log('⚠️ No private key - read-only mode');
  }
  
} catch (error) {
  console.error('❌ Contract setup failed:', error.message);
  console.error('Full error:', error);
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
        contractWorking: !!msToken,
        mintingCapable: !!contractWithSigner,
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

// Test contract endpoint
app.get('/test-contract', async (req, res) => {
  try {
    if (!msToken) {
      return res.json({
        status: 'FAILED',
        error: 'Contract not initialized',
        contractAddress: MS_TOKEN_ADDRESS
      });
    }
    
    const totalSupply = await msToken.totalSupply();
    const contractCode = await provider.getCode(MS_TOKEN_ADDRESS);
    
    res.json({
      status: 'SUCCESS',
      contractAddress: MS_TOKEN_ADDRESS,
      totalSupply: ethers.utils.formatEther(totalSupply),
      hasCode: contractCode !== '0x',
      mintingCapable: !!contractWithSigner,
      walletAddress: wallet ? wallet.address : 'Not configured'
    });
    
  } catch (error) {
    res.json({
      status: 'FAILED',
      error: error.message,
      contractAddress: MS_TOKEN_ADDRESS
    });
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'MountainShares Backend Running',
    contractStatus: msToken ? 'Connected' : 'Failed',
    mintingStatus: contractWithSigner ? 'Ready' : 'No wallet',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`MountainShares server running on port ${PORT}`);
  console.log(`Contracts: ${msToken ? 'Connected' : 'Failed'}`);
  console.log(`Minting: ${contractWithSigner ? 'Ready' : 'No wallet'}`);
});
