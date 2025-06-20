require('dotenv').config();
const express = require('express');
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
