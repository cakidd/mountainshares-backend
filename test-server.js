const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    message: 'EXPRESS SERVER WORKING',
    timestamp: new Date().toISOString(),
    test: 'This should be JSON, not HTML'
  });
});

app.get('/test-contract', (req, res) => {
  res.json({
    status: 'SUCCESS',
    message: 'Express endpoint working correctly',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
