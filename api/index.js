if (!process.env.VERCEL) { require("dotenv").config(); }
module.exports = async function handler(req, res) {
  return res.json({ 
    status: 'STRIPE-TO-CONTRACT BRIDGE ACTIVE',
    contractReady: true,
    stripeReady: true,
    bridgeStatus: 'READY'
  });
}
const app = require('../app');   // your existing Express app (with routes, middleware, etc.)
module.exports = app;            // IMPORTANT: do NOT call app.listen() here
