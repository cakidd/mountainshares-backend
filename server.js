const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

// CRITICAL: Raw body middleware for Stripe webhooks
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const payload = req.body; // This is the raw buffer Stripe needs
  const sig = req.headers['stripe-signature'];
  
  let event;
  try {
    // Construct event with raw payload (from Stripe docs)
    event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log('✅ STRIPE WEBHOOK VERIFIED SUCCESSFULLY');
  } catch (err) {
    console.log(`❌ Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle successful checkout
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('🎉 STRIPE PAYMENT COMPLETED:', session.id);
    console.log('💰 Amount:', session.amount_total / 100, 'USD');
    
    // Call contract immediately
    try {
      await callContractFromStripe(session);
      console.log('✅ CONTRACT CALLED SUCCESSFULLY FROM STRIPE');
    } catch (error) {
      console.error('❌ CONTRACT CALL FAILED:', error.message);
    }
  }
  
  res.status(200).send('Success');
});

// JSON middleware for other routes
app.use(express.json());

// Contract calling function
async function callContractFromStripe(stripeSession) {
  // Initialize ethers if needed
  if (!contractWithSigner) {
    await initializeContract();
  }
  
  if (!contractWithSigner) {
    throw new Error('Contract not available - check PRIVATE_KEY');
  }
  
  const totalPaid = stripeSession.amount_total / 100;
  const customerAmount = totalPaid * 0.98; // 98% to customer
  const feeAmount = totalPaid * 0.02; // 2% fee
  
  console.log(`🔄 Minting ${customerAmount} tokens for payment ${stripeSession.id}`);
  
  // Mint tokens to customer
  const { ethers } = require('ethers');
  const tokenAmount = ethers.utils.parseEther(customerAmount.toString());
  const recipientAddress = "0xdE75F5168e33db23fa5601b5fc88545be7b287a4";
  
  const tx = await contractWithSigner.mint(recipientAddress, tokenAmount);
  console.log('✅ MINT TRANSACTION SENT:', tx.hash);
  console.log('🔗 Arbiscan:', `https://arbiscan.io/tx/${tx.hash}`);
  
  const receipt = await tx.wait();
  console.log('✅ TRANSACTION CONFIRMED in block:', receipt.blockNumber);
  
  // Process 2% fee split to 5 wallets
  await processFeeDistribution(feeAmount, stripeSession.id);
}

// Fee distribution to your 5 wallets
async function processFeeDistribution(feeAmount, sessionId) {
  const feePerWallet = feeAmount / 5;
  const feeWallets = [
    "0x...", // Replace with your actual 5 wallet addresses
    "0x...",
    "0x...",
    "0x...",
    "0x..."
  ];
  
  console.log(`💰 Distributing ${feeAmount} fee (${feePerWallet} per wallet)`);
  
  for (let i = 0; i < feeWallets.length; i++) {
    try {
      const { ethers } = require('ethers');
      const feeTokenAmount = ethers.utils.parseEther(feePerWallet.toString());
      
      const feeTx = await contractWithSigner.mint(feeWallets[i], feeTokenAmount);
      console.log(`✅ Fee split ${i+1} sent: ${feeTx.hash}`);
      
      await feeTx.wait();
      console.log(`✅ Fee split ${i+1} confirmed`);
    } catch (error) {
      console.error(`❌ Fee split ${i+1} failed:`, error.message);
    }
  }
}

// Contract initialization (fixed ethers v5 syntax)
let provider, msToken, contractWithSigner;

async function initializeContract() {
  try {
    const { ethers } = require('ethers');
    
    // Use your configured RPC URL
    provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL || 'https://arb1.arbitrum.io/rpc');
    console.log('✅ Provider created');
    
    // Use your configured contract address and ABI
    const contractAddress = process.env.CONTRACT_ADDRESS;
    const abi = [
      "function mint(address to, uint256 amount) external",
      "function totalSupply() view returns (uint256)",
      "event Transfer(address indexed from, address indexed to, uint256 value)"
    ];
    
    msToken = new ethers.Contract(contractAddress, abi, provider);
    console.log('✅ Contract created');
    
    // Connect wallet for transactions
    if (process.env.PRIVATE_KEY) {
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      contractWithSigner = msToken.connect(wallet);
      console.log('✅ WALLET CONNECTED - READY TO MINT FROM STRIPE');
    } else {
      throw new Error('PRIVATE_KEY not configured');
    }
    
  } catch (error) {
    console.error('❌ Contract initialization failed:', error.message);
    throw error;
  }
}

// Initialize on startup
initializeContract();

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'STRIPE-TO-CONTRACT BRIDGE ACTIVE',
    contractReady: !!contractWithSigner,
    stripeReady: !!process.env.STRIPE_SECRET_KEY,
    bridgeStatus: (!!contractWithSigner && !!process.env.STRIPE_SECRET_KEY) ? 'READY' : 'NOT_READY'
  });
});

app.listen(process.env.PORT || 8080, () => {
  console.log('🔥 STRIPE-TO-CONTRACT BRIDGE RUNNING');
  console.log('✅ Ready to mint tokens from Stripe payments');
});
