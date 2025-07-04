/* -----------------------------------------------------------
   Stripe webhook  — Vercel (serverless, CommonJS)
   -----------------------------------------------------------
   ➊  npm deps  (already in "dependencies"):
       pnpm add stripe dotenv
   ➋  env vars  added in the Preview scope:
       STRIPE_SECRET_KEY     → sk_test_…
       STRIPE_WEBHOOK_SECRET → whsec_…
   ----------------------------------------------------------- */

if (!process.env.VERCEL) require('dotenv').config();

/*  Disable automatic JSON parsing — Stripe needs the raw bytes  */
module.exports.config = { api: { bodyParser: false } };

const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

/* ----------  zero-mistake raw-body helper  ---------- */
async function getRawBody(req) {
  if (req.rawBody) return req.rawBody;                // Next.js/Express 5
  if (req.body && Buffer.isBuffer(req.body)) return req.body; // custom parser
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);  // untouched stream
  return Buffer.concat(chunks);
}
/* ---------------------------------------------------- */

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  let event;
  try {
    const rawBody   = await getRawBody(req);
    const signature = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
  } catch (err) {
    console.error('❌  Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  /* --------  business logic  -------- */
  if (event.type === 'checkout.session.completed') {
    console.log('✅  Checkout complete:', event.data.object.id);
    // … add your custom work here …
  } else {
    console.log('ℹ️  Unhandled event type:', event.type);
  }
  /* ---------------------------------- */

  res.status(200).json({ received: true });
};
