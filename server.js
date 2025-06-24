const express = require('express');
const app = express();

// Absolutely minimal server that MUST work
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    status: 'NUCLEAR OPTION - MINIMAL SERVER',
    message: 'Testing if basic Express functionality works at all',
    timestamp: new Date().toISOString()
  });
});

app.get('/test-contract', (req, res) => {
  res.json({
    status: 'BASIC_SERVER_WORKING',
    message: 'If you see this, Express routes are registering',
    contractStatus: 'DISABLED_FOR_TESTING',
    timestamp: new Date().toISOString()
  });
});

app.post('/webhook', (req, res) => {
  console.log('Webhook received - basic functionality test');
  res.json({received: true, status: 'basic_webhook_working'});
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`NUCLEAR OPTION: Minimal server running on port ${PORT}`);
  console.log('If this works, the problem is in contract/ethers code');
  console.log('If this fails, the problem is fundamental Express/Railway issue');
});
