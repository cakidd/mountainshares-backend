const express = require('express');
const cors = require('cors');

const app = express();

// CORS configuration for form submissions (YouTube tutorial solution)
app.use(cors({
  origin: [
    'https://relaxed-medovik-06c531.netlify.app',
    'https://68572e325b22ba201cbfdc15--relaxed-medovik-06c531.netlify.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Parse form data (NEW - for HTML form submissions)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Handle preflight requests
app.options('*', cors());

// Create checkout session endpoint - HANDLE FORM SUBMISSION (Stack Overflow #68630525)
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { quantity, walletAddress, amount, productName } = req.body;
    
    if (!quantity || !walletAddress) {
      return res.status(400).send('Amount and wallet address required');
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
    
    // REDIRECT DIRECTLY (Form submission allows this - YouTube tutorial)
    res.redirect(303, sessionUrl);
    
  } catch (error) {
    console.error('❌ Checkout session failed:', error);
    res.status(500).send('Payment session creation failed');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ MountainShares backend running on port ${PORT}`);
  console.log(`🔧 CORS enabled for HTML form submissions`);
  console.log(`💰 Regional banking fee (0.0111%) included`);
  console.log(`📋 Form submission handler ready`);
});
