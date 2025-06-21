const cors = require('cors');

// Add your Netlify domain to allowed origins
const allowedOrigins = [
  'https://68571eab2182a306ff7359d9--relaxed-medovik-06c531.netlify.app',
  'https://relaxed-medovik-06c531.netlify.app',
  'http://localhost:3000',
  'http://localhost:3001'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // For legacy browser support
};

module.exports = corsOptions;
