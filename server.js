const express = require('express');
const cors = require('cors');
const app = express();

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

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-Auth-Token');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', cors: 'enhanced-v3' });
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
    
    res.json({ url: sessionUrl, sessionId });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('✅ Enhanced CORS v3 deployed');
});
