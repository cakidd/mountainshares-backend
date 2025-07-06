// api/create-checkout-session.js

import Stripe from 'stripe';

// api/create-checkout-session.js

const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.mountainshares.us');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'false');
  if (req.method === 'OPTIONS') return res.status(204).end();
  res.status(200).json({ success: true, message: "Minimal handler works!" });
};

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, governance_fee, reinforcement_fee, wallet_address } = req.body || {};

    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const tokensPurchase = Math.round(amount * 100) / 100;
    const governanceFeeFinal = Math.round(tokensPurchase * 0.02 * 100) / 100;
    const reinforcementFeeFinal = Math.max(0.01, Math.round(tokensPurchase * 0.005 * 100) / 100);
    const totalPlatformFees = governanceFeeFinal + reinforcementFeeFinal;
    const subtotal = tokensPurchase + totalPlatformFees;

    let stripeFee;
    if (tokensPurchase <= 10) {
      stripeFee = 0.34;
    } else {
      stripeFee = Math.round(((subtotal * 0.029) + 0.30) * 100) / 100;
    }

    const totalWithStripeFee = subtotal + stripeFee;
    const totalCents = Math.round(totalWithStripeFee * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'MountainShares Tokens',
            description: `$${tokensPurchase} worth of MountainShares tokens with dual-stream H4H support`,
          },
          unit_amount: totalCents,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://www.mountainshares.us?session_id={CHECKOUT_SESSION_ID}&success=true',
      cancel_url: 'https://www.mountainshares.us?cancelled=true',
      metadata: {
        tokens_purchase: tokensPurchase.toString(),
        governance_fee: governanceFeeFinal.toString(),
        reinforcement_fee: reinforcementFeeFinal.toString(),
        total_platform_fees: totalPlatformFees.toString(),
        stripe_fee: stripeFee.toString(),
        total_with_stripe_fee: totalWithStripeFee.toString(),
        wallet_address: wallet_address || 'not_connected',
        dual_stream: 'true'
      }
    });

    res.status(200).json({
      id: session.id,
      url: session.url,
      success: true
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
      success: false
    });
  }
};
