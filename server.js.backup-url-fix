const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for Stripe webhook (raw body needed)
app.use('/stripe-webhook', express.raw({ type: 'application/json' }));

// Regular middleware for other routes
app.use(express.json());
app.use(cors());

// Serve static files
app.use(express.static('.'));

// Health check endpoint with contract info
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        contracts: {
            token: '0xE8A9c6fFE6b2344147D886EcB8608C5F7863B20D',
            purchase: '0x2a36e8775EbfaAb18E25Df81EF6Eab05E026f400',
            vault: '0x95e4c1b6aad37e610742254114216ceaf0f49acd',
            connected: !!process.env.STRIPE_SECRET_KEY
        },
        stripe: {
            keyLoaded: !!process.env.STRIPE_SECRET_KEY,
            keyPrefix: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 12) + '...' : 'not set'
        }
    });
});

// Test Stripe connection
app.get('/test-stripe', async (req, res) => {
    try {
        const prices = await stripe.prices.list({ limit: 1 });
        res.json({ success: true, message: 'Stripe connection successful' });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message,
            type: error.type 
        });
    }
});

// Create Stripe checkout session
app.post('/create-checkout-session', async (req, res) => {
    try {
        const { amount, customerWallet } = req.body;

        if (!amount) {
            return res.status(400).json({ 
                error: 'Missing required field: amount' 
            });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: '1 MountainShares',
                        description: 'Digital currency for West Virginia communities',
                    },
                    unit_amount: Math.round(amount * 100), // Stripe expects cents
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `https://mountainshares-backend-production.up.railway.app/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin}/cancel`,
            metadata: {
                totalPaid: amount.toString(),
                tokenAmount: (amount * 0.98).toString(),
                customerWallet: customerWallet || 'not_provided'
            }
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        console.error('Error details:', {
            message: error.message,
            type: error.type,
            code: error.code,
            statusCode: error.statusCode
        });
        res.status(500).json({ 
            error: 'Failed to create checkout session',
            message: error.message,
            type: error.type
        });
    }
});

// Stripe webhook handler
app.post('/stripe-webhook', (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        if (endpointSecret) {
            // Verify webhook signature
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } else {
            // For development/testing without webhook secret
            event = JSON.parse(req.body);
        }
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            console.log('Payment successful for session:', session.id);
            console.log('Customer wallet:', session.metadata.customerWallet);
            
            // Here you would typically:
            // 1. Verify the payment
            // 2. Update your database
            // 3. Trigger any business logic (e.g., mint NFTs, update balances)
            
            break;
        
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log('PaymentIntent succeeded:', paymentIntent.id);
            break;
            
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
});

// Get checkout session details
app.get('/checkout-session/:sessionId', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
        res.json(session);
    } catch (error) {
        console.error('Error retrieving session:', error);
        res.status(500).json({ error: 'Failed to retrieve session' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Environment check:');
    console.log('- STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Set' : '❌ Missing');
    console.log('- Frontend URL:', process.env.FRONTEND_URL || 'Using request origin');
    
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('your_test_key_here')) {
        console.log('⚠️  WARNING: Set real Stripe keys in Railway dashboard!');
    }
});
