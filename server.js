const express = require('express');

// Dynamic regional fee calculation function
const calculateRegionalFee = (subtotal, cardCountry = 'US', currency = 'USD') => {
    let regionalFee = 0;
    if (cardCountry !== 'US') {
        regionalFee += subtotal * 0.015;
    }
    if (currency !== 'USD') {
        regionalFee += subtotal * 0.01;
    }
    const minBuffer = subtotal * 0.005;
    regionalFee = Math.max(regionalFee, minBuffer);
    return Math.ceil(regionalFee * 100) / 100;
};

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Basic route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`Mountain Shares server running on port ${port}`);
});

// Stripe configuration
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

// Create checkout session endpoint
app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: "Stripe not configured" });
  }
  try {
    const { amount } = req.body;
    
    if (!amount || amount < 1 || amount > 10000) {
      return res.status(400).json({ error: 'Invalid amount. Must be between $1 and $10,000' });
    }

    // Calculate fees using your dynamic regional fee system
    const loadingFee = amount * 0.02;
    const subtotal = amount + loadingFee;
    const stripeFeeExact = (subtotal * 0.029) + 0.30;
    const stripeFee = Math.ceil(stripeFeeExact * 100) / 100;
    const cardCountry = req.body.cardCountry || 'US';
    const currency = req.body.currency || 'USD';
    const regionalFee = calculateRegionalFee(subtotal, cardCountry, currency);
    const total = subtotal + stripeFee + regionalFee;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${amount} MountainShares`,
              description: `Digital currency for West Virginia communities`,
            },
            unit_amount: Math.round(total * 100), // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancel`,
      metadata: {
        tokenAmount: amount.toString(),
        loadingFee: loadingFee.toFixed(2),
        totalPaid: (Math.round(total * 100) / 100).toFixed(2)
      }
    });

    res.json({ url: session.url, id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});
