const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

// CRITICAL FIX from search result #6: Raw body handling for webhooks
app.use(express.json({
    verify: (req, res, buf) => {
      if (req.originalUrl.startsWith('/webhook')) {
        req.rawBody = buf.toString();
      }
    },
}));

// Webhook handler with proper raw body (from search result #6)
app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const rawBody = req.rawBody;
  let event;

  try {
    // Use the webhook secret from search result #3
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set');
    }

    // Construct event with raw body (exact solution from search result #6)
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    console.log('✅ Webhook signature verified successfully');
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('🎉 Payment completed:', session.id);
    console.log('⚠️ Token minting disabled - contract setup failed');
    // TODO: Add contract minting once ethers.js is fixed
  }

  res.json({received: true});
});

// Basic endpoints that work
app.get('/', (req, res) => {
  res.json({ 
    status: 'MountainShares Backend - WEBHOOK FIXED',
    message: 'Applied exact solutions from Stripe docs and Stack Overflow',
    webhookStatus: 'FIXED - Raw body handling implemented',
    contractStatus: 'STILL_BROKEN - ethers.js constructor issue',
    timestamp: new Date().toISOString()
  });
});

app.get('/test-contract', (req, res) => {
  res.json({
    status: 'WEBHOOK_FIXED_CONTRACT_BROKEN',
    message: 'Webhook buffer issue resolved, contract setup still failing',
    webhookFix: 'Applied search result #6 solution',
    contractIssue: 'ethers.js constructor error persists',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`MountainShares server running on port ${PORT}`);
  console.log('✅ Webhook buffer issue FIXED');
  console.log('❌ Contract setup still BROKEN');
});
