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
