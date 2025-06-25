const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Health check endpoint with detailed debugging
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        contracts: {
            token: '0xE8A9c6fFE6b2344147D886EcB8608C5F7863B20D',
            purchase: '0x2a36e8775EbfaAb18E25Df81EF6Eab05E026f400',
            vault: '0x95e4c1b6aad37e610742254114216ceaf0f49acd',
            connected: !!process.env.STRIPE_SECRET_KEY
        },
        stripe: {
            keyLoaded: !!process.env.STRIPE_SECRET_KEY,
            keyPrefix: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 15) + '...' : 'not set',
            keyLength: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.length : 0
        },
        env: {
            nodeEnv: process.env.NODE_ENV,
            port: process.env.PORT,
            stripeVarsFound: Object.keys(process.env).filter(key => key.includes('STRIPE'))
        }
    });
});

// Test Stripe connection
app.get('/test-stripe', async (req, res) => {
    try {
        if (!process.env.STRIPE_SECRET_KEY) {
            return res.status(500).json({
                success: false,
                error: 'STRIPE_SECRET_KEY not found in environment'
            });
        }
        
        const prices = await stripe.prices.list({ limit: 1 });
        res.json({ 
            success: true, 
            message: 'Stripe connection successful',
            priceCount: prices.data.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            type: error.type,
            code: error.code
        });
    }
});

// Create Stripe checkout session with enhanced logging
app.post('/create-checkout-session', async (req, res) => {
    try {
        const { amount, customerWallet } = req.body;

        console.log(`🏔️ [${new Date().toISOString()}] Creating checkout session:`, { amount, customerWallet });
        console.log('🔑 Stripe key status:', !!process.env.STRIPE_SECRET_KEY);

        if (!amount) {
            console.log('❌ Missing amount field');
            return res.status(400).json({
                error: 'Missing required field: amount'
            });
        }

        if (!process.env.STRIPE_SECRET_KEY) {
            console.log('❌ STRIPE_SECRET_KEY not found in environment');
            return res.status(500).json({
                error: 'Stripe not configured - missing secret key'
            });
        }

        const sessionData = {
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: '1 MountainShares',
                        description: 'Digital currency for West Virginia communities',
                    },
                    unit_amount: Math.round(amount * 100),
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: 'https://mountainshares-backend-production.up.railway.app/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url: 'https://mountainshares-backend-production.up.railway.app/cancel',
            metadata: {
                totalPaid: amount.toString(),
                tokenAmount: (amount * 0.98).toString(),
                customerWallet: customerWallet || 'not_provided'
            }
        };

        console.log('🌐 Session URLs:', {
            success: sessionData.success_url,
            cancel: sessionData.cancel_url
        });

        const session = await stripe.checkout.sessions.create(sessionData);

        console.log('✅ Checkout session created successfully:', session.id);
        res.json({ 
            url: session.url, 
            sessionId: session.id,
            success: true
        });

    } catch (error) {
        console.error('❌ Error creating checkout session:', {
            message: error.message,
            type: error.type,
            code: error.code,
            param: error.param,
            timestamp: new Date().toISOString()
        });
        
        res.status(500).json({
            error: 'Failed to create checkout session',
            message: error.message,
            type: error.type,
            code: error.code,
            param: error.param
        });
    }
});

// Success page
app.get('/success', (req, res) => {
    const sessionId = req.query.session_id;
    console.log('✅ Payment success page accessed:', sessionId);
    res.send(`
        <html>
        <head><title>Payment Successful - MountainShares</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>🎉 Payment Successful!</h1>
            <p>Your MountainShares purchase was completed successfully.</p>
            <p><strong>Session ID:</strong> ${sessionId}</p>
            <a href="/" style="background: #FFD700; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Return to MountainShares</a>
        </body>
        </html>
    `);
});

// Cancel page
app.get('/cancel', (req, res) => {
    console.log('❌ Payment cancelled page accessed');
    res.send(`
        <html>
        <head><title>Payment Cancelled - MountainShares</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>❌ Payment Cancelled</h1>
            <p>Your payment was cancelled. No charges were made.</p>
            <a href="/" style="background: #0066FF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Return to MountainShares</a>
        </body>
        </html>
    `);
});

// Stripe webhook handler
app.post('/stripe-webhook', express.raw({ type: 'application/json' }), (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        if (endpointSecret) {
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } else {
            event = JSON.parse(req.body);
        }
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            console.log('💰 Payment successful for session:', session.id);
            console.log('👛 Customer wallet:', session.metadata.customerWallet);
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
});

// Start server with enhanced logging
app.listen(PORT, () => {
    console.log(`🏔️ MountainShares Server starting on port ${PORT}`);
    console.log(`📅 Startup time: ${new Date().toISOString()}`);
    console.log('🔍 Environment check:');
    console.log('  - NODE_ENV:', process.env.NODE_ENV || 'not set');
    console.log('  - PORT:', process.env.PORT || '3000 (default)');
    console.log('  - STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Set (' + process.env.STRIPE_SECRET_KEY.length + ' chars)' : '❌ Missing');
    console.log('  - STRIPE_SECRET_KEY prefix:', process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 15) + '...' : 'none');
    console.log('  - All STRIPE env vars:', Object.keys(process.env).filter(key => key.includes('STRIPE')));
    console.log('🚀 Server ready to accept connections');
    
    if (!process.env.STRIPE_SECRET_KEY) {
        console.log('⚠️  WARNING: STRIPE_SECRET_KEY not found! Payments will fail.');
        console.log('⚠️  Set it with: railway variables --set STRIPE_SECRET_KEY=sk_live_...');
    }
});

// FORCE DEPLOY Tue Jun 24 21:04:23 EDT 2025
