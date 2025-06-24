const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'EXPRESS WORKING', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.listen(process.env.PORT || 8080, () => {
  console.log('Absolute minimal server running');
});
