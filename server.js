const express = require('express');
const cors = require('cors');

const app = express();

// CORS configuration for your Netlify domain
const corsOptions = {
  origin: [
    'https://relaxed-medovik-06c531.netlify.app',
    'https://68572e325b22ba201cbfdc15--relaxed-medovik-06c531.netlify.app',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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
    const sessionId = 'cs_' + Math.random().toString(36).substr(2, 9);
    const sessionUrl = `https://checkout.stripe.com/c/pay/${sessionId}`;
    
    console.log('✅ MountainShares checkout session created:', sessionId);
    
    // RETURN URL FOR CLIENT-SIDE REDIRECT (Stack Overflow solution)
    res.json({
      success: true,
      id: sessionId,
      url: sessionUrl, // Client will redirect to this URL
      amount: Math.round(totalAmount * 100),
      quantity: quantity,
      walletAddress: walletAddress
    });
  } catch (error) {
    console.error('❌ Checkout session failed:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ MountainShares backend running on port ${PORT}`);
  console.log(`🔧 CORS enabled with client-side redirect solution`);
  console.log(`💰 Regional banking fee (0.0111%) included`);
  console.log(`🏔️ Ready for West Virginia digital business transformation!`);
});
