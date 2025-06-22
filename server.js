const express = require('express');

// Dynamic regional fee calculation function
const calculateRegionalFee = (subtotal, cardCountry = 'US', currency = 'USD') => {
    let regionalFee = 0;
    if (cardCountry !== 'US') {
        regionalFee += subtotal * 0.015;
    }
    if (currency !== 'USD') {
        regionalFee += subtotal * 0.01;
    }
    const minBuffer = subtotal * 0.005;
    regionalFee = Math.max(regionalFee, minBuffer);
    return Math.ceil(regionalFee * 100) / 100;
};

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Basic route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`Mountain Shares server running on port ${port}`);
});
