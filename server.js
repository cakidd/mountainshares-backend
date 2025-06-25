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

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`MountainShares backend running on port ${PORT}`);
});
