// Only load .env when running locally
if (!process.env.VERCEL) { require('dotenv').config(); }

/* Disable Vercel’s default JSON parsing: Stripe needs the raw body */
module.exports.config = { api: { bodyParser: false } };

const Stripe = require('stripe');
const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
const secret  = process.env.STRIPE_WEBHOOK_SECRET;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  // Read raw request body
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const rawBody = Buffer.concat(chunks);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, req.headers['stripe-signature'], secret);
  } catch (err) {
    console.error('❌  Signature verification failed', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  /* ---- Your business logic ---- */
  if (event.type === 'checkout.session.completed') {
    console.log(`✅  Checkout complete: ${event.data.object.id}`);
    // … update DB, emit event, etc. …
  } else {
    console.log(`ℹ️  Unhandled type: ${event.type}`);
  }

  res.status(200).json({ received: true });
};
