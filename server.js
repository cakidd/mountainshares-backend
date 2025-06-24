const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

// CRITICAL: Raw body for Stripe webhook signature verification
app.use('/webhook', express.raw({type: 'application/json'}));

app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    // STEP 1: Verify Stripe webhook
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log('✅ STRIPE WEBHOOK VERIFIED');
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      console.log('🎉 STRIPE PAYMENT COMPLETED:', session.id);
      console.log('💰 Amount:', session.amount_total / 100, 'USD');
      
      // STEP 2: IMMEDIATELY call your contract
      await callContractFromStripe(session);
    }
    
    res.json({received: true});
    
  } catch (err) {
    console.error('❌ STRIPE WEBHOOK FAILED:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// STEP 3: Contract calling function
async function callContractFromStripe(stripeSession) {
  try {
    console.log('🔄 CALLING CONTRACT FROM STRIPE...');
    
    // Initialize ethers if not done
    if (!contractWithSigner) {
      await initializeContract();
    }
    
    if (!contractWithSigner) {
      throw new Error('Contract not available for minting');
    }
    
    // Calculate amounts from Stripe data
    const totalPaid = stripeSession.amount_total / 100; // Convert cents to dollars
    const customerAmount = totalPaid * 0.98; // 98% to customer
    const feeAmount = totalPaid * 0.02; // 2% fee
    
    const recipientAddress = "0xdE75F5168e33db23fa5601b5fc88545be7b287a4";
    
    console.log(`🔄 Minting ${customerAmount} tokens for Stripe session ${stripeSession.id}`);
    
    // CALL THE CONTRACT
    const { ethers } = require('ethers');
    const tokenAmount = ethers.utils.parseEther(customerAmount.toString());
    
    const tx = await contractWithSigner.mint(recipientAddress, tokenAmount);
    console.log('✅ CONTRACT CALLED! Transaction:', tx.hash);
    console.log('🔗 Arbiscan:', `https://arbiscan.io/tx/${tx.hash}`);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('✅ TRANSACTION CONFIRMED in block:', receipt.blockNumber);
    
    // Process your 2% fee split to 5 wallets
    await processFeeDistribution(feeAmount, stripeSession.id);
    
    console.log('🎉 STRIPE-TO-CONTRACT BRIDGE SUCCESSFUL!');
    
  } catch (error) {
    console.error('❌ CONTRACT CALL FROM STRIPE FAILED:', error.message);
    throw error;
  }
}

// Your 2% fee distribution to 5 wallets
async function processFeeDistribution(feeAmount, sessionId) {
  const feePerWallet = feeAmount / 5;
  const feeWallets = [
    "0x...", // Replace with your 5 actual wallet addresses
    "0x...",
    "0x...", 
    "0x...",
    "0x..."
  ];
  
  console.log(`💰 Processing ${feeAmount} fee split (${feePerWallet} per wallet)`);
  
  for (let i = 0; i < feeWallets.length; i++) {
    try {
      const { ethers } = require('ethers');
      const feeTokenAmount = ethers.utils.parseEther(feePerWallet.toString());
      
      const feeTx = await contractWithSigner.mint(feeWallets[i], feeTokenAmount);
      console.log(`✅ Fee split ${i+1}: ${feeTx.hash}`);
      
      await feeTx.wait();
      console.log(`✅ Fee split ${i+1} confirmed`);
      
    } catch (error) {
      console.error(`❌ Fee split ${i+1} failed:`, error.message);
    }
  }
}

app.use(express.json());

// Contract initialization (your working version)
let provider, msToken, contractWithSigner;

async function initializeContract() {
  try {
    const { ethers } = require('ethers');
    
    provider = new ethers.providers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
    console.log('✅ Provider created');
    
    const abi = [
      "function totalSupply() view returns (uint256)",
      "function mint(address to, uint256 amount) external",
      "event Transfer(address indexed from, address indexed to, uint256 value)"
    ];
    
    msToken = new ethers.Contract(
      "0xE8A9c6fFE6b2344147D886EcB8608C5F7863B20D", 
      abi, 
      provider
    );
    console.log('✅ Contract created');
    
    if (process.env.PRIVATE_KEY) {
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      contractWithSigner = msToken.connect(wallet);
      console.log('✅ STRIPE-TO-CONTRACT BRIDGE READY');
    }
    
  } catch (error) {
    console.error('❌ Contract initialization failed:', error.message);
  }
}

// Initialize on startup
initializeContract();

app.get('/', (req, res) => {
  res.json({ 
    status: 'STRIPE-TO-CONTRACT BRIDGE',
    stripeReady: !!process.env.STRIPE_SECRET_KEY,
    contractReady: !!contractWithSigner,
    bridgeStatus: (!!process.env.STRIPE_SECRET_KEY && !!contractWithSigner) ? 'READY' : 'NOT_READY'
  });
});

app.listen(process.env.PORT || 8080, () => {
  console.log('🔥 STRIPE-TO-CONTRACT BRIDGE RUNNING');
  console.log('Ready to mint tokens from Stripe payments!');
});
