export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, transactionType, transactionHash } = req.body;
    
    // Calculate distribution based on your existing model
    const distribution = calculateDistribution(amount);
    
    console.log('Treasury distribution calculated:', {
      amount,
      transactionType,
      distribution,
      transactionHash,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      amount,
      transactionType,
      distribution,
      transactionHash,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Treasury distribution error:', error);
    return res.status(500).json({
      success: false,
      error: 'Treasury distribution failed',
      message: error.message
    });
  }
}

function calculateDistribution(amount) {
  return {
    total: amount,
    distributions: [
      {
        recipient: process.env.H4H_NONPROFIT_ADDRESS,
        amount: (amount * 30) / 100,
        percentage: 30,
        type: 'nonprofit'
      },
      {
        recipient: process.env.H4H_COMMUNITY_PROGRAMS_ADDRESS,
        amount: (amount * 15) / 100,
        percentage: 15,
        type: 'community_programs'
      },
      {
        recipient: process.env.H4H_TREASURY_MOUNTAINSHARES_ADDRESS,
        amount: (amount * 30) / 100,
        percentage: 30,
        type: 'treasury'
      },
      {
        recipient: process.env.H4H_GOVERNANCE_ADDRESS,
        amount: (amount * 10) / 100,
        percentage: 10,
        type: 'governance'
      },
      {
        recipient: process.env.DEVELOPMENT_ADDRESS,
        amount: (amount * 15) / 100,
        percentage: 15,
        type: 'development'
      }
    ]
  };
}
