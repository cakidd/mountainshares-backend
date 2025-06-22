const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// Simple root route with inline HTML
app.get('/', (req, res) => {
  // Read and send the index.html file content directly
  try {
    const htmlContent = fs.readFileSync('./index.html', 'utf8');
    res.send(htmlContent);
  } catch (error) {
    // If file not found, show error with directory listing
    const files = fs.readdirSync('./').filter(f => f.endsWith('.html'));
    res.send(`
      <h1>MountainShares Backend</h1>
      <p>Error: Could not find index.html</p>
      <p>Current directory: ${process.cwd()}</p>
      <p>HTML files found: ${files.join(', ') || 'none'}</p>
      <p>Visit the <a href="/health">health check</a></p>
    `);
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    version: '2.0',
    timestamp: new Date().toISOString() 
  });
});

app.post('/api/create-checkout-session', async (req, res) => {
  const { amount, walletAddress } = req.body;
  if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }
  const sessionId = 'cs_live_' + Math.random().toString(36).substr(2, 20);
  res.json({ 
    url: `https://checkout.stripe.com/c/pay/${sessionId}`,
    sessionId 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
