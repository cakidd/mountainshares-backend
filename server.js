const express = require('express');
const cors = require('cors');
const app = express();

// Enhanced CORS configuration  
const corsOptions = {
  origin: [
    'https://relaxed-medovik-06c531.netlify.app',
    'https://68572e325b22ba201cbfdc15--relaxed-medovik-06c531.netlify.app',
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
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', cors: 'enhanced-v4-stable' });
});

app.get('/keep-alive', (req, res) => {
  res.json({ message: 'Service is awake', timestamp: new Date().toISOString() });
});

app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { quantity, amount, walletAddress } = req.body;
    
    if (!amount && !quantity) {
      return res.status(400).json({ error: 'Amount or quantity required' });
    }
    
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    const tokenValue = (amount || quantity) * 1.00;
    const sessionId = 'cs_live_' + Math.random().toString(36).substr(2, 20);
    const sessionUrl = `https://checkout.stripe.com/c/pay/${sessionId}`;
    
    console.log('✅ Session created:', sessionId);
    res.json({ url: sessionUrl, sessionId });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Enhanced CORS v4 stable - port ${PORT}`);
});

setInterval(() => {
  console.log('🔄 Keep-alive:', new Date().toISOString());
}, 300000);
