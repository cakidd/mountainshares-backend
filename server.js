const express = require('express');
const app = express();

app.use(express.json());

// Basic health check that always works
app.get('/', (req, res) => {
  res.json({ 
    status: 'MountainShares Backend Running',
    timestamp: new Date().toISOString(),
    endpoints: ['/test-contract', '/verify/:sessionId'],
    debug: 'Minimal working server'
  });
});

// Test endpoint that always works
app.get('/test-contract', (req, res) => {
  res.json({
    status: 'SERVER_WORKING',
    message: 'Server is running but contract initialization disabled for testing',
    timestamp: new Date().toISOString()
  });
});

// Verify endpoint that always works
app.get('/verify/:sessionId', (req, res) => {
  res.json({
    sessionId: req.params.sessionId,
    status: 'SERVER_WORKING',
    message: 'Endpoint accessible but contract verification disabled for testing',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Minimal MountainShares server running on port ${PORT}`);
  console.log('All endpoints should be accessible');
});
