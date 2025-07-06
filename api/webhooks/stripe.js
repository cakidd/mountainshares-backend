// api/webhooks/stripe.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { ethers } = require('ethers');

// --- Addresses from your project ---
const PROVIDER_URL = "https://arb1.arbitrum.io/rpc";
const TOKEN_CONTRACT_ADDRESS = "0xE8A9c6fFE6b2344147D886EcB8608C5F7863B20D";
const MSTOKEN_CUSTOMER_PURCHASE = "0x2a36e8775EbfaAb18E25Df81EF6Eab05E026f400";
const SETTLEMENT_RESERVE = "0x2b686a6c1c4b40ffc748b56b6c7a06c49e361167";
const GOVERNANCE_WALLET = "0x8c09e686bdfd283bdf5f6fffc780e62a695014f3";
const GOVERNANCE_SPLIT_WALLETS = [
  "0xde75f5168e33db23fa5601b5fc88545be7b287a4", // Harmony for Hope, Inc. 30%
  "0xf8c739a101e53f6fe4e24df768be833ceecefa84", // H4H Community Programs 15%
  "0x2b686a6c1c4b40ffc748b56b6c7a06c49e361167", // H4H Treasury 30%
  "0x8c09e686bdfd283bdf5f6fffc780e62a695014f3", // H4H Governance 10%
  "0xd8bb25076e61b5a382e17171b48d8e0952b5b4f3"  // Development 15%
];
const TREASURY_WALLET = "0x95E4c1b6AaD37E610742254114216CeAf0f49ACD";

// --- Setup ethers provider and signer (use a secure key in prod) ---
const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
const signer = new ethers.Wallet(process.env.WEBHOOK_SIGNER_PRIVATE_KEY, provider);

// --- TODO: Replace with your actual ABI ---
const tokenAbi = [ /* ... */ ];

const tokenContract = new ethers.Contract(TOKEN_CONTRACT_ADDRESS, tokenAbi, signer);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  // Read raw body for Stripe signature verification
  let buf = '';
  await new Promise((resolve) => {
    req.on('data', (chunk) => { buf += chunk; });
    req.on('end', resolve);
  });

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const amountUSD = session.amount_total / 100; // Stripe sends cents
    const walletAddress = session.metadata.wallet_address; // Must be set in your frontend

    // --- 1. Mint tokens: 1 token per $1 ---
    try {
      // TODO: Replace 'mint' with your actual mint function and adjust params
      const tx = await tokenContract.mint(walletAddress, ethers.parseUnits(amountUSD.toString(), 18));
      await tx.wait();
      console.log(`✅ Minted ${amountUSD} tokens to ${walletAddress}`);
    } catch (err) {
      console.error('Token minting failed:', err);
      return res.status(500).send('Token minting failed');
    }

    // --- 2. Calculate distributions ---
    const governanceOverage = amountUSD * 0.02;
    const treasuryFee = amountUSD * 0.0005;
    const reserveAmount = amountUSD - governanceOverage - treasuryFee;

    // --- 3. Distribute funds (pseudo-code, replace with actual contract calls) ---
    try {
      // Send reserveAmount to settlement reserve contract
      // TODO: Implement your settlement reserve transfer logic

      // Send 2% overage to governance wallet, then split among 5 wallets
      // TODO: Implement governance split logic

      // Send 0.05% to treasury backup wallet
      // TODO: Implement treasury transfer logic

      console.log(`✅ Distributed: reserve ${reserveAmount}, governance ${governanceOverage}, treasury ${treasuryFee}`);
    } catch (err) {
      console.error('Distribution failed:', err);
      return res.status(500).send('Distribution failed');
    }
  }

  res.status(200).send('Received');
};
