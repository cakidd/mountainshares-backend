import { buffer } from 'micro';
import Stripe from 'stripe';

export const config = { api: { bodyParser: false } };
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export default async function handler(req, res) {
  if (req.method === 'GET') return res.status(200).end('ok'); // health ping
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const sig = req.headers['stripe-signature'];
  if (!sig) return res.status(400).end('Missing stripe-signature header');

  const raw = (await buffer(req)).toString();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      raw,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('⚠️  Signature check failed:', err.message);
    return res.status(400).end(`Webhook Error: ${err.message}`);
  }

  // … existing business logic …
  return res.json({ received: true });
}
