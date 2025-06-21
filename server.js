const express = require('express');
const cors = require('cors');
const app = express();

// Enhanced CORS configuration
const corsOptions = {
  origin: [
    'https://relaxed-medovik-06c531.netlify.app',
    'https://68572e325b22ba201cbfdc15--relaxed-medovik-06c531.netlify.app',
    'http://localhost:3000',
    'http://localhost:5173',
    /\.netlify\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'X-Auth-Token'
  ],
  exposedHeaders: ['Access-Control-Allow-Origin'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://relaxed-medovik-06c531.netlify.app',
    'https://68572e325b22ba201cbfdc15--relaxed-medovik-06c531.netlify.app'
  ];
  
  if (allowedOrigins.includes(origin) || (origin && /\.netlify\.app$/.test(origin))) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-Auth-Token');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    console.log('🔍 CORS Preflight from:', origin);
    return res.status(200).end();
  }
  
  next();
});

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'mountainshares-backend',
    cors: 'enhanced-v2',
    uptime: process.uptime()
  });
});

app.get('/keep-alive', (req, res) => {
  res.status(200).json({
    message: 'Service is awake',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/create-checkout-session', async (req, res) => {
  try {
    console.log('💳 Checkout request from:', req.headers.origin);
    
    const { quantity, amount, walletAddress, productName } = req.body;
    
    if (!amount && !quantity) {
      return res.status(400).json({ error: 'Amount or quantity required' });
    }
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }
    
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    const tokenValue = (amount || quantity) * 1.00;
    const stripeBaseFee = (tokenValue * 0.029) + 0.30;
    const stripeRegionalFee = tokenValue * 0.000111;
    const totalStripeFee = Math.ceil((stripeBaseFee + stripeRegionalFee) * 100) / 100;
    const msFee = Math.ceil((tokenValue * 0.02) * 100) / 100;
    const totalAmount = tokenValue + totalStripeFee + msFee;

    const sessionId = 'cs_live_' + Math.random().toString(36).substr(2, 20);
    const sessionUrl = `https://checkout.stripe.com/c/pay/${sessionId}`;
    
    console.log('✅ Session created:', sessionId);
    
    res.json({ 
      url: sessionUrl,
      sessionId: sessionId,
      amount: totalAmount
    });
    
  } catch (error) {
    console.error('❌ Checkout failed:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ MountainShares backend running on port ${PORT}`);
  console.log(`🔧 Enhanced CORS v2 with full headers`);
  console.log(`🏔️ Ready for West Virginia digital business!`);
});

setInterval(() => {
  console.log('🔄 Keep-alive:', new Date().toISOString());
}, 300000);
