const express = require('express');
const cors = require('cors');

const app = express();

// CORS configuration with regional banking fee support
const corsOptions = {
  origin: [
    'https://relaxed-medovik-06c531.netlify.app',
    'https://68571eab2182a306ff7359d9--relaxed-medovik-06c531.netlify.app',
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

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'mountainshares-backend',
    cors: 'enabled',
    regionalBankingFee: '0.0111%'
  });
});

// Calculate purchase endpoint with 0.0111% regional banking fee
app.post('/api/calculate-purchase', (req, res) => {
  try {
    const { msTokens } = req.body;
    
    if (!msTokens || msTokens < 1) {
      return res.status(400).json({ error: 'Invalid token amount' });
    }
    
    const tokenValue = msTokens * 1.00;
    
    // Stripe fees: 2.9% + $0.30 + 0.0111% regional banking fee
    const stripeBaseFee = (tokenValue * 0.029) + 0.30;
    const stripeRegionalFee = tokenValue * 0.000111; // 0.0111% regional banking fee
    const totalStripeFee = stripeBaseFee + stripeRegionalFee;
    
    // MountainShares fee: 2%
    const mountainSharesFee = tokenValue * 0.02;
    
    // Round up both fees to ensure accurate accounting
    const stripeFeeFinal = Math.ceil(totalStripeFee * 100) / 100;
    const mountainSharesFeeFinal = Math.ceil(mountainSharesFee * 100) / 100;
    
    const totalCharge = tokenValue + stripeFeeFinal + mountainSharesFeeFinal;
    
    const pricing = {
      tokenValue: tokenValue,
      stripeFee: stripeFeeFinal,
      stripeRegionalFee: stripeRegionalFee,
      mountainSharesFee: mountainSharesFeeFinal,
      totalCharge: totalCharge
    };
    
    res.json({ success: true, pricing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create checkout session endpoint with regional banking fee
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { quantity, walletAddress, amount, productName } = req.body;
    
    if (!quantity || !walletAddress) {
      return res.status(400).json({ error: 'Amount and wallet address required' });
    }
    
    // Calculate pricing with 0.0111% regional banking fee
    const tokenValue = quantity * 1.00;
    const stripeBaseFee = (tokenValue * 0.029) + 0.30;
    const stripeRegionalFee = tokenValue * 0.000111; // 0.0111% regional banking fee
    const totalStripeFee = Math.ceil((stripeBaseFee + stripeRegionalFee) * 100) / 100;
    const msFee = Math.ceil((tokenValue * 0.02) * 100) / 100;
    const totalAmount = tokenValue + totalStripeFee + msFee;
    
    // Simulate payment session creation
    const sessionId = 'cs_' + Math.random().toString(36).substr(2, 9);
    const orderId = 'order_' + Math.random().toString(36).substr(2, 9);
    
    res.json({
      success: true,
      id: sessionId,
      orderId: orderId,
      amount: Math.round(totalAmount * 100), // Amount in cents
      quantity: quantity,
      walletAddress: walletAddress,
      pricing: {
        tokenValue: tokenValue,
        stripeFee: totalStripeFee,
        regionalFee: stripeRegionalFee,
        mountainSharesFee: msFee,
        totalCharge: totalAmount
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ MountainShares backend running on port ${PORT}`);
  console.log(`🔧 CORS enabled for Netlify domains`);
  console.log(`💰 Regional banking fee (0.0111%) included in calculations`);
  console.log(`🏔️ Ready for West Virginia digital business transformation!`);
});
