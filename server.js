const express = require('express');
const cors = require('cors');

const app = express();

// CORS configuration using Railway environment variables (NEW APPROACH)
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'https://relaxed-medovik-06c531.netlify.app',
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: (process.env.CORS_METHODS || 'GET,POST,PUT,DELETE,OPTIONS').split(','),
  allowedHeaders: (process.env.CORS_HEADERS || 'Content-Type,Authorization,X-Requested-With').split(','),
  optionsSuccessStatus: 200
};

// Apply CORS middleware
app.use(cors(corsOptions));
app.use(express.json());

// Handle preflight requests
app.options('*', cors(corsOptions));

// Create checkout session endpoint - RETURN URL INSTEAD OF REDIRECT
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { quantity, walletAddress, amount, productName } = req.body;
    
    if (!quantity || !walletAddress) {
      return res.status(400).json({ error: 'Amount and wallet address required' });
    }
    
    // Calculate pricing with 0.0111% regional banking fee
    const tokenValue = quantity * 1.00;
    const stripeBaseFee = (tokenValue * 0.029) + 0.30;
    const stripeRegionalFee = tokenValue * 0.000111;
    const totalStripeFee = Math.ceil((stripeBaseFee + stripeRegionalFee) * 100) / 100;
    const msFee = Math.ceil((tokenValue * 0.02) * 100) / 100;
    const totalAmount = tokenValue + totalStripeFee + msFee;
    
    // Simulate Stripe session creation
    const sessionId = 'cs_test_' + Math.random().toString(36).substr(2, 20);
    const sessionUrl = `https://checkout.stripe.com/c/pay/${sessionId}`;
    
    console.log('✅ MountainShares checkout session created:', sessionId);
    console.log('🔧 CORS Origin:', process.env.CORS_ORIGIN);
    
    // RETURN URL FOR CLIENT-SIDE REDIRECT (Stack Overflow solution)
    res.json({ url: sessionUrl });
    
  } catch (error) {
    console.error('❌ Checkout session failed:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ MountainShares backend running on port ${PORT}`);
  console.log(`🔧 CORS Origin: ${process.env.CORS_ORIGIN}`);
  console.log(`🔧 CORS Methods: ${process.env.CORS_METHODS}`);
  console.log(`🔧 CORS Headers: ${process.env.CORS_HEADERS}`);
  console.log(`💰 Regional banking fee (0.0111%) included`);
  console.log(`🏔️ Ready for West Virginia digital business transformation!`);
});
