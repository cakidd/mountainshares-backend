export default function handler(req, res) {
  // Set CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle GET requests to root
  if (req.method === 'GET') {
    return res.status(200).json({
      message: 'MountainShares Backend API',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    });
  }

  // Handle POST requests (for webhooks)
  if (req.method === 'POST') {
    return res.status(200).json({
      message: 'POST request received',
      timestamp: new Date().toISOString()
    });
  }

  // Return 405 for unsupported methods
  res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
  return res.status(405).json({
    error: `Method ${req.method} Not Allowed`,
    allowedMethods: ['GET', 'POST', 'OPTIONS']
  });
}
