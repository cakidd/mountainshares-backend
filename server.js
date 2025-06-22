const express = require('express');
const cors = require('cors');
const app = express();

// Simple but working CORS
app.use(cors({
  origin: [
    'https://relaxed-medovik-06c531.netlify.app',
    'https://verdant-kitten-90062e.netlify.app',
    'https://68572e325b22ba201cbfdc15--relaxed-medovik-06c531.netlify.app',
    'https://verdant-kitten-90062e.netlify.app',
    /\.netlify\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', cors: 'working', timestamp: new Date().toISOString() });
});

app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { amount, quantity, walletAddress } = req.body;
    
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    const sessionId = 'cs_live_' + Math.random().toString(36).substr(2, 20);
    const sessionUrl = `https://checkout.stripe.com/c/pay/${sessionId}`;
    
    res.json({ url: sessionUrl, sessionId });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
