/**
 * app.js  ─ MountainShares backend
 * ---------------------------------
 * • Single Express app exported for Vercel Serverless Functions
 * • CORS whitelist so the browser can call the API
 * • Health check + Stripe checkout route
 */

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

/* ────────────────────────────────
   CORS
   ──────────────────────────────── */
const ALLOWED_ORIGINS = [
  'https://mountainshares-frontend-seven.vercel.app', // production UI
  'http://localhost:3000'                             // local `npm run dev`
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error('CORS: origin not allowed'));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204
  })
);

app.use(express.json());

/* ────────────────────────────────
   HEALTH CHECK  •  GET /health
   ──────────────────────────────── */
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    contracts: {
      token:    '0xE8A9c6fFE6b2344147D886EcB8608C5F7863B20D',
      purchase: '0x2a36e8775EbfaAb18E25Df81EF6Eab05E026f400',
      vault:    '0x95e4c1b6aad37e610742254114216ceaf0f49acd',
      stripeKeyLoaded: !!process.env.STRIPE_SECRET_KEY
    }
  });
});

/* ────────────────────────────────
   CHECKOUT  •  POST /create-checkout-session
   ──────────────────────────────── */
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { amount, customerWallet, email } = req.body;
    if (!amount || !email) {
      return res.status(400).json({ success: false, message: 'amount & email required' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1
        }
      ],
      customer_email: email,
      metadata: { wallet: customerWallet ?? '' },
      success_url: 'https://mountainshares-frontend-seven.vercel.app/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url:  'https://mountainshares-frontend-seven.vercel.app/cancel'
    });

    res.json({ url: session.url, sessionId: session.id, success: true });
  } catch (err) {
    console.error('[stripe] checkout error', err);
    res.status(500).json({ success: false, message: 'Checkout error' });
  }
});

/* ────────────────────────────────
   EXPORT FOR VERCEL
   ──────────────────────────────── */
module.exports = app;

/* ────────────────────────────────
   LOCAL DEV SUPPORT
   (node app.js)
   ──────────────────────────────── */
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () =>
    console.log(`Local API listening on http://localhost:${PORT}`)
  );
}
