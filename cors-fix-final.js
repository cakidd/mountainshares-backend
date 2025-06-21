const cors = require('cors');

const corsOptions = {
  origin: [
    'https://68571eab2182a306ff7359d9--relaxed-medovik-06c531.netlify.app',
    'https://relaxed-medovik-06c531.netlify.app',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));
