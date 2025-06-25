const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: ['https://cakidd.github.io', 'http://localhost:3000'],
    credentials: true
}));

// Health endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        cors: 'working',
        timestamp: new Date().toISOString()
    });
});

// Calculate purchase pricing
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

// Create payment session
app.post('/create-payment-session', async (req, res) => {
    const { quantity, walletaddress, amount, productname } = req.body;
    
    try {
        res.json({
            success: true,
            id: 'ms_session_' + Date.now(),
            orderid: 'ms_order_' + Date.now(),
            walletAddress: walletaddress,
            quantity: quantity
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// CRITICAL: Bind to 0.0.0.0 for Railway external connections
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`MountainShares backend running on port ${PORT}`);
});

// Stripe webhook endpoint (BEFORE express.json() middleware)
app.post('/webhook/stripe', express.raw({type: 'application/json'}), (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // Get from Stripe Dashboard
    
    let event;
    
    try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        console.log('✅ Webhook signature verified');
    } catch (err) {
        console.log(`⚠️ Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle MountainShares payment events
    switch (event.type) {
        case 'payment_intent.succeeded':
            const payment = event.data.object;
            console.log('🎉 MountainShares Payment succeeded:', payment.id);
            
            // TODO: Mint MountainShares tokens to customer wallet
            // Wallet: payment.metadata.walletAddress
            // Quantity: payment.metadata.quantity
            
            break;
            
        case 'checkout.session.completed':
            const session = event.data.object;
            console.log('🎊 MountainShares Purchase completed:', session.id);
            break;
            
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({received: true});
});
