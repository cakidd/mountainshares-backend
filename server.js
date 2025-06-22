const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const Stripe = require('stripe');

const app = express();

// Initialize Stripe with your secret key (use environment variable in production)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_YOUR_TEST_KEY_HERE');

app.use(cors());
app.use(express.json());

// Serve the frontend
app.get('/', (req, res) => {
  try {
    const htmlContent = fs.readFileSync('./index.html', 'utf8');
    res.send(htmlContent);
  } catch (error) {
    const files = fs.readdirSync('./').filter(f => f.endsWith('.html'));
    res.send(`
      <h1>MountainShares Backend</h1>
      <p>Error: Could not find index.html</p>
      <p>HTML files found: ${files.join(', ') || 'none'}</p>
    `);
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    version: '3.0',
    stripe: stripe ? 'configured' : 'not configured',
    timestamp: new Date().toISOString() 
  });
});

// Create real Stripe checkout session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { amount, walletAddress } = req.body;
    
    // Validate wallet address
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }
    
    // Validate amount
    if (!amount || amount < 1 || amount > 10000) {
      return res.status(400).json({ error: 'Invalid amount. Must be between $1 and $10,000' });
    }

    // Calculate fees
    const loadingFee = amount * 0.02; // 2% loading fee
    const subtotal = amount + loadingFee;
    const stripeFee = (subtotal * 0.029) + 0.30; // Stripe's fee
    const totalAmount = Math.round((subtotal + stripeFee) * 100); // Convert to cents

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'MountainShares Tokens',
              description: `${amount} MountainShares (1 MS = $1 USD)`,
              metadata: {
                type: 'mountainshares_purchase'
              }
            },
            unit_amount: totalAmount, // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'https://mountainshares-backend-production.up.railway.app'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://mountainshares-backend-production.up.railway.app'}/`,
      metadata: {
        walletAddress: walletAddress,
        purchaseAmount: amount.toString(),
        tokenAmount: amount.toString(),
        loadingFee: loadingFee.toFixed(2),
        totalPaid: (totalAmount / 100).toFixed(2)
      },
      payment_intent_data: {
        metadata: {
          walletAddress: walletAddress,
          purchaseAmount: amount.toString()
        }
      }
    });

    // Return the checkout URL
    res.json({ 
      url: session.url,
      sessionId: session.id
    });

  } catch (error) {
    console.error('Stripe session creation failed:', error);
    
    // Check if it's a Stripe API key error
    if (error.message && error.message.includes('API key')) {
      return res.status(500).json({ 
        error: 'Stripe configuration error. Please set STRIPE_SECRET_KEY environment variable.' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    });
  }
});

// Webhook endpoint to handle successful payments
app.post('/webhook/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Payment successful for wallet:', session.metadata.walletAddress);
      // TODO: Trigger smart contract to mint tokens
      // TODO: Store purchase record in database
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({received: true});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server v3.0 running on port ${PORT}`);
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('⚠️  STRIPE_SECRET_KEY not set. Stripe integration will not work.');
  }
});
