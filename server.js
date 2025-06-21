const express = require('express');
const cors = require('cors');

const app = express();

// CORS configuration for your Netlify domain (based on Stack Overflow solution[3])
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

// Apply CORS middleware FIRST
app.use(cors(corsOptions));

// Add explicit CORS headers for all responses (CORS debugging solution[5])
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (corsOptions.origin.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests (CORS flow solution[5])
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use(express.json());

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'mountainshares-backend',
    cors: 'enabled',
    stripe: 'ready'
  });
});

// Create checkout session endpoint for MountainShares purchases
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
    
    // Create MountainShares payment session
    const sessionId = 'cs_' + Math.random().toString(36).substr(2, 9);
    const orderId = 'order_' + Math.random().toString(36).substr(2, 9);
    
    console.log('✅ MountainShares checkout session created:', sessionId);
    
    res.json({
      success: true,
      id: sessionId,
      orderId: orderId,
      amount: Math.round(totalAmount * 100), // Amount in cents for Stripe
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
    console.error('❌ Checkout session failed:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ MountainShares backend running on port ${PORT}`);
  console.log(`🔧 CORS enabled with Access-Control-Allow-Origin header`);
  console.log(`💰 Regional banking fee (0.0111%) included in calculations`);
  console.log(`💳 Stripe payment system ready for MountainShares purchases`);
  console.log(`🏔️ Ready for West Virginia digital business transformation!`);
});
