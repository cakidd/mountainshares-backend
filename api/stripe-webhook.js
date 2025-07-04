if (!process.env.VERCEL) { require('dotenv').config(); }
module.exports.config = { api: { bodyParser: false } };

const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
const secret = process.env.STRIPE_WEBHOOK_SECRET;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks);

  try {
    const event = stripe.webhooks.constructEvent(raw, req.headers['stripe-signature'], secret);
    if (event.type === 'checkout.session.completed') {
      console.log('✅  Checkout completed:', event.data.object.id);
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('❌  Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
};
