const express = require('express');
const cors = require('cors');

const app = express();

// CORS configuration with your exact Netlify domain
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

// Add manual CORS headers (Railway Help Station solution[7])
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (corsOptions.origin.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use(express.json());

// Handle preflight requests
app.options('*', cors(corsOptions));

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'mountainshares-backend',
    cors: 'enabled'
  });
});

// Create checkout session endpoint with 0.0111% regional banking fee
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
  console.log(`🔧 CORS enabled with Access-Control-Allow-Origin header`);
  console.log(`💰 Regional banking fee (0.0111%) included in calculations`);
  console.log(`🏔️ Ready for West Virginia digital business transformation!`);
});
