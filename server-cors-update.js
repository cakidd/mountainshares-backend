const express = require('express');
const cors = require('cors');
const corsOptions = require('./cors-fix');

const app = express();

// Apply CORS middleware BEFORE other middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Your existing middleware
app.use(express.json());

// Your existing routes
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    // Your existing checkout logic here
    res.json({ success: true, sessionId: 'test' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    cors: 'enabled'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT} with CORS enabled`);
});
