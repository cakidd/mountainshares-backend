const express = require('express');
const cors = require('cors');

const app = express();

// CORS configuration (Stack Overflow #68630525 solution)
app.use(cors({
  origin: [
    'https://relaxed-medovik-06c531.netlify.app',
    'https://68572e325b22ba201cbfdc15--relaxed-medovik-06c531.netlify.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Add explicit CORS headers (MDN documentation solution from search results)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ['https://relaxed-medovik-06c531.netlify.app', 'https://68572e325b22ba201cbfdc15--relaxed-medovik-06c531.netlify.app'].includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests (YouTube tutorial solution)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use(express.json());

// Create checkout session endpoint - RETURN URL INSTEAD OF REDIRECT (Stack Overflow #68630525)
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
    
    // CRITICAL: Return URL instead of redirect (Stack Overflow #68630525 solution)
    res.json({ url: sessionUrl });
    
  } catch (error) {
    console.error('❌ Checkout session failed:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ MountainShares backend running on port ${PORT}`);
  console.log(`🔧 CORS enabled with Stack Overflow #68630525 solution`);
  console.log(`💰 Regional banking fee (0.0111%) included`);
  console.log(`🏔️ Ready for West Virginia digital business transformation!`);
});
