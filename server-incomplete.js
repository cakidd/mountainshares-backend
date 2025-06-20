require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Add CORS before your routes
app.use(cors({
  origin: [
    'https://peppy-squirrel-5e98bc.netlify.app',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Add the missing route
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    // Your Stripe checkout logic here
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: [
        'https://6854aa939e5549c6ad6d363d--frolicking-crisp-0b1d43.netlify.app',
        'https://frolicking-crisp-0b1d43.netlify.app'
    ]
}));

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.post('/api/create-checkout-session', (req, res) => {
    console.log('API endpoint called:', req.body);
    res.json({ message: 'API endpoint working', received: req.body });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
