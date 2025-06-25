const express = require('express');
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
const cors = require('cors');


const app = express();
const app = express();
const PORT = process.env.PORT || 3000;
const PORT = process.env.PORT || 3000;


// Middleware
// Middleware
app.use(cors());
app.use(cors());
app.use(express.json());
app.use(express.json());
app.use(express.static('.'));
app.use(express.static('.'));


// Health check endpoint with detailed debugging
// Health check endpoint with detailed debugging
app.get('/health', (req, res) => {
app.get('/health', (req, res) => {
    res.json({
    res.json({
        status: 'healthy',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        contracts: {
        contracts: {
            token: '0xE8A9c6fFE6b2344147D886EcB8608C5F7863B20D',
            token: '0xE8A9c6fFE6b2344147D886EcB8608C5F7863B20D',
            purchase: '0x2a36e8775EbfaAb18E25Df81EF6Eab05E026f400',
            purchase: '0x2a36e8775EbfaAb18E25Df81EF6Eab05E026f400',
            vault: '0x95e4c1b6aad37e610742254114216ceaf0f49acd',
            vault: '0x95e4c1b6aad37e610742254114216ceaf0f49acd',
            connected: !!process.env.STRIPE_SECRET_KEY
            connected: !!process.env.STRIPE_SECRET_KEY
        },
        },
        stripe: {
        stripe: {
            keyLoaded: !!process.env.STRIPE_SECRET_KEY,
            keyLoaded: !!process.env.STRIPE_SECRET_KEY,
            keyPrefix: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 15) + '...' : 'not set',
            keyPrefix: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 15) + '...' : 'not set',
            keyLength: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.length : 0
            keyLength: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.length : 0
        },
        },
        env: {
        env: {
            nodeEnv: process.env.NODE_ENV,
            nodeEnv: process.env.NODE_ENV,
            port: process.env.PORT,
            port: process.env.PORT,
            stripeVarsFound: Object.keys(process.env).filter(key => key.includes('STRIPE'))
            stripeVarsFound: Object.keys(process.env).filter(key => key.includes('STRIPE'))
        }
        }
    });
    });
});


// Test Stripe connection
// Test Stripe connection
app.get('/test-stripe', async (req, res) => {
app.get('/test-stripe', async (req, res) => {
    try {
    try {
        if (!process.env.STRIPE_SECRET_KEY) {
        if (!process.env.STRIPE_SECRET_KEY) {
            return res.status(500).json({
            return res.status(500).json({
                success: false,
                success: false,
                error: 'STRIPE_SECRET_KEY not found in environment'
                error: 'STRIPE_SECRET_KEY not found in environment'
            });
            });
        }
        }
        
        
        const prices = await stripe.prices.list({ limit: 1 });
        const prices = await stripe.prices.list({ limit: 1 });
        res.json({ 
        res.json({ 
            success: true, 
            success: true, 
            message: 'Stripe connection successful',
            message: 'Stripe connection successful',
            priceCount: prices.data.length
            priceCount: prices.data.length
        });
        });
    } catch (error) {
    } catch (error) {
        res.status(500).json({
        res.status(500).json({
            success: false,
            success: false,
            error: error.message,
            error: error.message,
            type: error.type,
            type: error.type,
            code: error.code
            code: error.code
        });
        });
    }
    }
});


// Create Stripe checkout session with enhanced logging
// Create Stripe checkout session with enhanced logging
app.post('/create-checkout-session', async (req, res) => {
app.post('/create-checkout-session', async (req, res) => {
    try {
    try {
        const { amount, customerWallet } = req.body;
        const { amount, customerWallet } = req.body;


        console.log(`🏔️ [${new Date().toISOString()}] Creating checkout session:`, { amount, customerWallet });
        console.log(`🏔️ [${new Date().toISOString()}] Creating checkout session:`, { amount, customerWallet });
        console.log('🔑 Stripe key status:', !!process.env.STRIPE_SECRET_KEY);
        console.log('🔑 Stripe key status:', !!process.env.STRIPE_SECRET_KEY);


        if (!amount) {
        if (!amount) {
            console.log('❌ Missing amount field');
            console.log('❌ Missing amount field');
            return res.status(400).json({
            return res.status(400).json({
                error: 'Missing required field: amount'
                error: 'Missing required field: amount'
            });
            });
        }
        }


        if (!process.env.STRIPE_SECRET_KEY) {
        if (!process.env.STRIPE_SECRET_KEY) {
            console.log('❌ STRIPE_SECRET_KEY not found in environment');
            console.log('❌ STRIPE_SECRET_KEY not found in environment');
            return res.status(500).json({
            return res.status(500).json({
                error: 'Stripe not configured - missing secret key'
                error: 'Stripe not configured - missing secret key'
            });
            });
        }
        }


        const sessionData = {
        const sessionData = {
            payment_method_types: ['card'],
            payment_method_types: ['card'],
            line_items: [{
            line_items: [{
                price_data: {
                price_data: {
                    currency: 'usd',
                    currency: 'usd',
                    product_data: {
                    product_data: {
                        name: '1 MountainShares',
                        name: '1 MountainShares',
                        description: 'Digital currency for West Virginia communities',
                        description: 'Digital currency for West Virginia communities',
                    },
                    },
                    unit_amount: Math.round(amount * 100),
                    unit_amount: Math.round(amount * 100),
                },
                },
                quantity: 1,
                quantity: 1,
            }],
            }],
            mode: 'payment',
            mode: 'payment',
            success_url: 'https://mountainshares-backend-production.up.railway.app/success?session_id={CHECKOUT_SESSION_ID}',
            success_url: 'https://mountainshares-backend-production.up.railway.app/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url: 'https://mountainshares-backend-production.up.railway.app/cancel',
            cancel_url: 'https://mountainshares-backend-production.up.railway.app/cancel',
            metadata: {
            metadata: {
                totalPaid: amount.toString(),
                totalPaid: amount.toString(),
                tokenAmount: (amount * 0.98).toString(),
                tokenAmount: (amount * 0.98).toString(),
                customerWallet: customerWallet || 'not_provided'
                customerWallet: customerWallet || 'not_provided'
            }
            }
        };
        };


        console.log('🌐 Session URLs:', {
        console.log('🌐 Session URLs:', {
            success: sessionData.success_url,
            success: sessionData.success_url,
            cancel: sessionData.cancel_url
            cancel: sessionData.cancel_url
        });
        });


        const session = await stripe.checkout.sessions.create(sessionData);
        const session = await stripe.checkout.sessions.create(sessionData);


        console.log('✅ Checkout session created successfully:', session.id);
        console.log('✅ Checkout session created successfully:', session.id);
        res.json({ 
        res.json({ 
            url: session.url, 
            url: session.url, 
            sessionId: session.id,
            sessionId: session.id,
            success: true
            success: true
        });
        });


    } catch (error) {
    } catch (error) {
        console.error('❌ Error creating checkout session:', {
        console.error('❌ Error creating checkout session:', {
            message: error.message,
            message: error.message,
            type: error.type,
            type: error.type,
            code: error.code,
            code: error.code,
            param: error.param,
            param: error.param,
            timestamp: new Date().toISOString()
            timestamp: new Date().toISOString()
        });
        });
        
        
        res.status(500).json({
        res.status(500).json({
            error: 'Failed to create checkout session',
            error: 'Failed to create checkout session',
            message: error.message,
            message: error.message,
            type: error.type,
            type: error.type,
            code: error.code,
            code: error.code,
            param: error.param
            param: error.param
        });
        });
    }
    }
});


// Success page
// Success page
app.get('/success', (req, res) => {
app.get('/success', (req, res) => {
    const sessionId = req.query.session_id;
    const sessionId = req.query.session_id;
    console.log('✅ Payment success page accessed:', sessionId);
    console.log('✅ Payment success page accessed:', sessionId);
    res.send(`
    res.send(`
        <html>
        <html>
        <head><title>Payment Successful - MountainShares</title></head>
        <head><title>Payment Successful - MountainShares</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
        <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>🎉 Payment Successful!</h1>
            <h1>🎉 Payment Successful!</h1>
            <p>Your MountainShares purchase was completed successfully.</p>
            <p>Your MountainShares purchase was completed successfully.</p>
            <p><strong>Session ID:</strong> ${sessionId}</p>
            <p><strong>Session ID:</strong> ${sessionId}</p>
            <a href="/" style="background: #FFD700; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Return to MountainShares</a>
            <a href="/" style="background: #FFD700; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Return to MountainShares</a>
        </body>
        </body>
        </html>
        </html>
    `);
    `);
});


// Cancel page
// Cancel page
app.get('/cancel', (req, res) => {
app.get('/cancel', (req, res) => {
    console.log('❌ Payment cancelled page accessed');
    console.log('❌ Payment cancelled page accessed');
    res.send(`
    res.send(`
        <html>
        <html>
        <head><title>Payment Cancelled - MountainShares</title></head>
        <head><title>Payment Cancelled - MountainShares</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
        <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>❌ Payment Cancelled</h1>
            <h1>❌ Payment Cancelled</h1>
            <p>Your payment was cancelled. No charges were made.</p>
            <p>Your payment was cancelled. No charges were made.</p>
            <a href="/" style="background: #0066FF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Return to MountainShares</a>
            <a href="/" style="background: #0066FF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Return to MountainShares</a>
        </body>
        </body>
        </html>
        </html>
    `);
    `);
});


// Stripe webhook handler
// Stripe webhook handler
app.post('/stripe-webhook', express.raw({ type: 'application/json' }), (req, res) => {
app.post('/stripe-webhook', express.raw({ type: 'application/json' }), (req, res) => {
    const sig = req.headers['stripe-signature'];
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;


    let event;
    let event;


    try {
    try {
        if (endpointSecret) {
        if (endpointSecret) {
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } else {
        } else {
            event = JSON.parse(req.body);
            event = JSON.parse(req.body);
        }
        }
    } catch (err) {
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    }


    switch (event.type) {
    switch (event.type) {
        case 'checkout.session.completed':
        case 'checkout.session.completed':
            const session = event.data.object;
            const session = event.data.object;
            console.log('💰 Payment successful for session:', session.id);
            console.log('💰 Payment successful for session:', session.id);
            console.log('👛 Customer wallet:', session.metadata.customerWallet);
            console.log('👛 Customer wallet:', session.metadata.customerWallet);
            break;
            break;
        default:
        default:
            console.log(`Unhandled event type ${event.type}`);
            console.log(`Unhandled event type ${event.type}`);
    }
    }


    res.json({ received: true });
    res.json({ received: true });
});


// Start server with enhanced logging
// Start server with enhanced logging
app.listen(PORT, () => {
app.listen(PORT, () => {
    console.log(`🏔️ MountainShares Server starting on port ${PORT}`);
    console.log(`🏔️ MountainShares Server starting on port ${PORT}`);
    console.log(`📅 Startup time: ${new Date().toISOString()}`);
    console.log(`📅 Startup time: ${new Date().toISOString()}`);
    console.log('🔍 Environment check:');
    console.log('🔍 Environment check:');
    console.log('  - NODE_ENV:', process.env.NODE_ENV || 'not set');
    console.log('  - NODE_ENV:', process.env.NODE_ENV || 'not set');
    console.log('  - PORT:', process.env.PORT || '3000 (default)');
    console.log('  - PORT:', process.env.PORT || '3000 (default)');
    console.log('  - STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Set (' + process.env.STRIPE_SECRET_KEY.length + ' chars)' : '❌ Missing');
    console.log('  - STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Set (' + process.env.STRIPE_SECRET_KEY.length + ' chars)' : '❌ Missing');
    console.log('  - STRIPE_SECRET_KEY prefix:', process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 15) + '...' : 'none');
    console.log('  - STRIPE_SECRET_KEY prefix:', process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 15) + '...' : 'none');
    console.log('  - All STRIPE env vars:', Object.keys(process.env).filter(key => key.includes('STRIPE')));
    console.log('  - All STRIPE env vars:', Object.keys(process.env).filter(key => key.includes('STRIPE')));
    console.log('🚀 Server ready to accept connections');
    console.log('🚀 Server ready to accept connections');
    
    
    if (!process.env.STRIPE_SECRET_KEY) {
    if (!process.env.STRIPE_SECRET_KEY) {
        console.log('⚠️  WARNING: STRIPE_SECRET_KEY not found! Payments will fail.');
        console.log('⚠️  WARNING: STRIPE_SECRET_KEY not found! Payments will fail.');
        console.log('⚠️  Set it with: railway variables --set STRIPE_SECRET_KEY=sk_live_...');
        console.log('⚠️  Set it with: railway variables --set STRIPE_SECRET_KEY=sk_live_...');
    }
    }
});




app.post('/calculate-purchase', (req, res) => {
    const { msTokens } = req.body;
    const quantity = parseInt(msTokens) || 1;
    
    const tokenValue = quantity * 1.00;
    const stripeFee = (tokenValue * 0.029) + 0.30;
    const mountainSharesFee = tokenValue * 0.02;
    const totalCharge = tokenValue + stripeFee + mountainSharesFee;
    
    res.json({
        success: true,
        pricing: {
            tokenValue: tokenValue,
            stripeFee: stripeFee,
            mountainSharesFee: mountainSharesFee,
            totalCharge: totalCharge
        }
    });


// Create payment session endpoint
// Create payment session endpoint
app.post('/create-payment-session', async (req, res) => {
app.post('/create-payment-session', async (req, res) => {
    const { quantity, walletaddress, amount, productname } = req.body;
    const { quantity, walletaddress, amount, productname } = req.body;
    
    
    try {
    try {
        // This should call your registry contract
        // This should call your registry contract
        // For now, return success to test the flow
        // For now, return success to test the flow
        res.json({
        res.json({
            success: true,
            success: true,
            id: 'test_session_' + Date.now(),
            id: 'test_session_' + Date.now(),
            orderid: 'order_' + Date.now(),
            orderid: 'order_' + Date.now(),
            walletAddress: walletaddress,
            walletAddress: walletaddress,
            quantity: quantity
            quantity: quantity
        });
        });
    } catch (error) {
    } catch (error) {
        res.status(500).json({ error: error.message });
        res.status(500).json({ error: error.message });
    }
    }


app.post('/calculate-purchase', (req, res) => {
    const { msTokens } = req.body;
    const quantity = parseInt(msTokens) || 1;
    
    const tokenValue = quantity * 1.00;
    const stripeFee = (tokenValue * 0.029) + 0.30;
    const mountainSharesFee = tokenValue * 0.02;
    const totalCharge = tokenValue + stripeFee + mountainSharesFee;
    
    res.json({
        success: true,
        pricing: {
            tokenValue: tokenValue,
            stripeFee: stripeFee,
            mountainSharesFee: mountainSharesFee,
            totalCharge: totalCharge
        }
    });


// Create payment session endpoint  
// Create payment session endpoint  
app.post('/create-payment-session', async (req, res) => {
app.post('/create-payment-session', async (req, res) => {
    const { quantity, walletaddress, amount, productname } = req.body;
    const { quantity, walletaddress, amount, productname } = req.body;
    
    
    try {
    try {
        res.json({
        res.json({
            success: true,
            success: true,
            id: 'test_session_' + Date.now(),
            id: 'test_session_' + Date.now(),
            orderid: 'order_' + Date.now(),
            orderid: 'order_' + Date.now(),
            walletAddress: walletaddress,
            walletAddress: walletaddress,
            quantity: quantity
            quantity: quantity
        });
        });
    } catch (error) {
    } catch (error) {
        res.status(500).json({ error: error.message });
        res.status(500).json({ error: error.message });
    }
    }
});


app.post('/calculate-purchase', (req, res) => {
    const { msTokens } = req.body;
    const quantity = parseInt(msTokens) || 1;
    
    const tokenValue = quantity * 1.00;
    const stripeFee = (tokenValue * 0.029) + 0.30;
    const mountainSharesFee = tokenValue * 0.02;
    const totalCharge = tokenValue + stripeFee + mountainSharesFee;
    
    res.json({
        success: true,
        pricing: {
            tokenValue: tokenValue,
            stripeFee: stripeFee,
            mountainSharesFee: mountainSharesFee,
            totalCharge: totalCharge
        }
    });


// Create payment session endpoint
// Create payment session endpoint
app.post('/create-payment-session', async (req, res) => {
app.post('/create-payment-session', async (req, res) => {
    const { quantity, walletaddress, amount, productname } = req.body;
    const { quantity, walletaddress, amount, productname } = req.body;
    
    
    try {
    try {
        res.json({
        res.json({
            success: true,
            success: true,
            id: 'test_session_' + Date.now(),
            id: 'test_session_' + Date.now(),
            orderid: 'order_' + Date.now(),
            orderid: 'order_' + Date.now(),
            walletAddress: walletaddress,
            walletAddress: walletaddress,
            quantity: quantity
            quantity: quantity
        });
        });
    } catch (error) {
    } catch (error) {
        res.status(500).json({ error: error.message });
        res.status(500).json({ error: error.message });
    }
    }
});


// Stripe webhook handler that calls Customer Purchase System contract
// Stripe webhook handler that calls Customer Purchase System contract
app.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
app.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const sig = req.headers['stripe-signature'];
    
    
    try {
    try {
        const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        
        
        if (event.type === 'checkout.session.completed') {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const session = event.data.object;
            
            
            // Call your Customer Purchase System contract at 0x2a36e8775EbfaAb18E25Df81EF6Eab05E026f400
            // Call your Customer Purchase System contract at 0x2a36e8775EbfaAb18E25Df81EF6Eab05E026f400
            // This should mint tokens to session.customer_details.wallet_address
            // This should mint tokens to session.customer_details.wallet_address
            
            
            console.log('Payment confirmed, calling Customer Purchase System...');
            console.log('Payment confirmed, calling Customer Purchase System...');
        }
        }
        
        
        res.json({ received: true });
        res.json({ received: true });
    } catch (err) {
    } catch (err) {
        console.error('Webhook error:', err.message);
        console.error('Webhook error:', err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
    }
});

// Calculate purchase pricing (your frontend calls this)
app.post('/calculate-purchase', (req, res) => {
    const { msTokens } = req.body;
    const quantity = parseInt(msTokens) || 1;
    
    const tokenValue = quantity * 1.00;
    const stripeFee = (tokenValue * 0.029) + 0.30;
    const mountainSharesFee = tokenValue * 0.02;
    const totalCharge = tokenValue + stripeFee + mountainSharesFee;
    
    res.json({
        success: true,
        pricing: {
            tokenValue: tokenValue,
            stripeFee: stripeFee,
            mountainSharesFee: mountainSharesFee,
            totalCharge: totalCharge
        }
    });
});

// Create payment session (your frontend calls this too)
app.post('/create-payment-session', async (req, res) => {
    const { quantity, walletaddress, amount, productname } = req.body;
    
    try {
        res.json({
            success: true,
            id: 'ms_session_' + Date.now(),
            orderid: 'ms_order_' + Date.now(),
            walletAddress: walletaddress,
            quantity: quantity,
            amount: amount,
            productname: productname
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Calculate purchase pricing (matches your frontend exactly)
app.post('/calculate-purchase', (req, res) => {
    const { msTokens } = req.body;
    const quantity = parseInt(msTokens) || 1;
    
    const tokenValue = quantity * 1.00;
    const stripeFee = (tokenValue * 0.029) + 0.30;
    const mountainSharesFee = tokenValue * 0.02;
    const totalCharge = tokenValue + stripeFee + mountainSharesFee;
    
    res.json({
        success: true,
        pricing: {
            tokenValue: tokenValue,
            stripeFee: stripeFee,
            mountainSharesFee: mountainSharesFee,
            totalCharge: totalCharge
        }
    });
});

// Create payment session (matches your frontend exactly)
app.post('/create-payment-session', async (req, res) => {
    const { quantity, walletaddress, amount, productname } = req.body;
    
    try {
        // TODO: Connect to your Customer Purchase System contract
        // Contract: 0x2a36e8775EbfaAb18E25Df81EF6Eab05E026f400
        
        res.json({
            success: true,
            id: 'ms_session_' + Date.now(),
            orderid: 'ms_order_' + Date.now(),
            walletAddress: walletaddress,
            quantity: quantity,
            amount: amount,
            productname: productname
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
