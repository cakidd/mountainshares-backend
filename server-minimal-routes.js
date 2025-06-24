const express = require('express');
const app = express();

app.use(express.json());

// Explicit route registration - these MUST work
app.get('/api/health', (req, res) => {
  console.log('Health endpoint called');
  res.json({ status: 'WORKING', timestamp: new Date().toISOString() });
});

app.get('/api/test-contract', (req, res) => {
  console.log('Test contract endpoint called');
  res.json({ 
    status: 'ROUTE_WORKING', 
    message: 'Route registration successful',
    timestamp: new Date().toISOString() 
  });
});

app.get('/api', (req, res) => {
  console.log('API root endpoint called');
  res.json({ 
    status: 'API_ROOT_WORKING',
    endpoints: ['/api/health', '/api/test-contract'],
    timestamp: new Date().toISOString() 
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Minimal routes server running on port ${PORT}`);
  console.log('Routes registered: /api/health, /api/test-contract, /api');
});
