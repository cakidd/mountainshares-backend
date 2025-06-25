const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: ['https://cakidd.github.io', 'http://localhost:3000'],
    credentials: true
}));

// Health check endpoint (this works already)
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        cors: 'working',
        timestamp: new Date().toISOString()
    });
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

// Create payment session (your frontend calls this)
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

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`MountainShares backend running on port ${PORT}`);
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

// Create payment session (your frontend calls this)
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

// Create payment session (your frontend calls this)
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
            quantity: quantity
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
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
            quantity: quantity
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
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

// Create payment session (your frontend calls this)
app.post('/create-payment-session', async (req, res) => {
    const { quantity, walletaddress, amount, productname } = req.body;
    
    try {
        // TODO: Connect to Customer Purchase System contract 0x2a36e8775EbfaAb18E25Df81EF6Eab05E026f400
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

// Create payment session (your frontend calls this)
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
