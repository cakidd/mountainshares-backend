export default async function handler(req, res) {
  // CORS headers for Netlify frontend
  res.setHeader('Access-Control-Allow-Origin', 'https://rad-panda-205b66.netlify.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      message: 'MountainShares Smart Contract API',
      status: 'ready',
      contracts: {
        mountainSharesToken: process.env.MOUNTAINSHARES_TOKEN_ADDRESS,
        businessRegistry: process.env.BUSINESS_REGISTRY_ADDRESS,
        phase1Contract: process.env.MOUNTAINSHARES_PHASE1_ADDRESS,
        giftCardManager: process.env.MS_GIFT_CARD_MANAGER_ADDRESS,
        customerPurchase: process.env.MS_TOKEN_CUSTOMER_PURCHASE_ADDRESS,
        employeeRewards: process.env.EMPLOYEE_REWARD_VAULT_SIMPLE_ADDRESS,
        volunteerManager: process.env.VOLUNTEER_ORGANIZATION_MANAGER_ADDRESS,
        governance: process.env.GOVERNANCE_FEE_DISTRIBUTOR_ADDRESS,
        kyc: process.env.KYC_ADDRESS,
        earnedMSVault: process.env.H4H_EARNEDMS_VAULT_ADDRESS,
        heritageRevenue: process.env.HERITAGE_CLIO_REVENUE_ADDRESS,
        settlementReserve: process.env.SETTLEMENT_RESERVE_ADDRESS
      },
      treasury: {
        nonprofit: process.env.H4H_NONPROFIT_ADDRESS,
        communityPrograms: process.env.H4H_COMMUNITY_PROGRAMS_ADDRESS,
        treasury: process.env.H4H_TREASURY_MOUNTAINSHARES_ADDRESS,
        governance: process.env.H4H_GOVERNANCE_ADDRESS,
        development: process.env.DEVELOPMENT_ADDRESS
      },
      endpoints: {
        connect: '/api/contracts/connect',
        status: '/api/contracts/status',
        treasury: '/api/contracts/treasury'
      },
      timestamp: new Date().toISOString()
    });
  }

  if (req.method === 'POST') {
    try {
      const { action, contractAddress, data } = req.body;
      
      console.log('Contract interaction:', { 
        action, 
        contractAddress, 
        timestamp: new Date().toISOString() 
      });
      
      return res.status(200).json({
        success: true,
        action,
        contractAddress,
        result: 'Contract interaction logged successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Contract interaction error:', error);
      return res.status(500).json({
        success: false,
        error: 'Contract interaction failed',
        message: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
