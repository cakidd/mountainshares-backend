const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// CORS configuration
app.use(cors({
  origin: [
    'https://relaxed-medovik-06c531.netlify.app',
    'https://verdant-kitten-90062e.netlify.app',
    'https://68572e325b22ba201cbfdc15--relaxed-medovik-06c531.netlify.app',
    'https://verdant-kitten-90062e.netlify.app',
    /\.netlify\.app$/,
    'http://localhost:3000',
    'http://localhost:5000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

app.use(express.json());

// Root route - serve index.html
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  
  // Check if file exists
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // If not found, send the HTML content directly
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>The Commons - Redirecting...</title>
        <meta http-equiv="refresh" content="0; url=https://cakidd.github.io/Commons-Connect/">
      </head>
      <body>
        <h1>Redirecting to The Commons...</h1>
        <p>If you are not redirected, <a href="https://cakidd.github.io/Commons-Connect/">click here</a>.</p>
      </body>
      </html>
    `);
  }
});

// Debug route to check file system
app.get('/debug-fs', (req, res) => {
  try {
    const files = fs.readdirSync(__dirname);
    const htmlFiles = files.filter(f => f.endsWith('.html'));
    res.json({
      cwd: process.cwd(),
      dirname: __dirname,
      htmlFiles: htmlFiles,
      indexExists: fs.existsSync(path.join(__dirname, 'index.html')),
      totalFiles: files.length
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

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

// Serve static files (as fallback)
app.use(express.static(process.cwd()));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📁 Working directory: ${process.cwd()}`);
  console.log(`📁 Script directory: ${__dirname}`);
});
