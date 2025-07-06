export default async function handler(req, res) {
  // CORS headers for Netlify frontend
  res.setHeader('Access-Control-Allow-Origin', 'https://rad-panda-205b66.netlify.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const { sessionId } = req.query;
    
    if (!sessionId) {
      return res.status(400).json({
        error: 'Missing sessionId parameter',
        timestamp: new Date().toISOString()
      });
    }
    
    // For now, return mock data - replace with actual database lookup
    const mockTransaction = {
      id: sessionId,
      processed: true,
      tokensPurchased: 100,
      platformFee: 2.00,
      settlementAmount: 102.00,
      status: 'completed',
      timestamp: new Date().toISOString()
    };
    
    return res.status(200).json({
      processed: true,
      transaction: mockTransaction,
      contracts: {
        mountainSharesToken: process.env.MOUNTAINSHARES_TOKEN_ADDRESS,
        settlementReserve: process.env.SETTLEMENT_RESERVE_ADDRESS
      },
      timestamp: new Date().toISOString()
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
