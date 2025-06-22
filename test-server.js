const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello from Railway! Server is working.');
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', port: port });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Test server running on port ${port}`);
});
