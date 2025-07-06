import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req) {
  try {
    if (req.rawBody) return req.rawBody;
    if (req.body && Buffer.isBuffer(req.body)) return req.body;
    
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch (error) {
    console.error('❌ Raw body parsing failed:', error);
    throw new Error('Failed to parse raw body');
  }
}

export default async function handler(req, res) {
  const startTime = Date.now();
  
  // CORS headers for Netlify frontend
  res.setHeader('Access-Control-Allow-Origin', 'https://rad-panda-205b66.netlify.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, stripe-signature');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  let event;
  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature) {
      console.error('❌ Missing stripe-signature header');
      return res.status(400).send('Webhook Error: Missing signature header');
    }

    if (!endpointSecret) {
      console.error('❌ Missing STRIPE_WEBHOOK_SECRET environment variable');
      return res.status(500).send('Webhook Error: Missing webhook secret');
    }

    event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
    
    console.log('✅ Stripe webhook verified:', {
      eventType: event.type,
      eventId: event.id,
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('❌ Signature verification failed:', {
      error: err.message,
      timestamp: new Date().toISOString()
    });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const processingResult = await processWebhookEvent(event);
    const processingTime = Date.now() - startTime;
    
    console.log('✅ Webhook processing completed:', {
      eventType: event.type,
      eventId: event.id,
      processingTime: `${processingTime}ms`,
      result: processingResult,
      timestamp: new Date().toISOString()
    });
    
    return res.status(200).json({ 
      received: true, 
      eventType: event.type,
      eventId: event.id,
      processingTime: processingTime,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    console.error('❌ Webhook processing failed:', {
      eventType: event.type,
      eventId: event.id,
      error: error.message,
      stack: error.stack,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString()
    });
    
    return res.status(200).json({
      received: true,
      error: 'Processing failed but acknowledged',
      eventType: event.type,
      eventId: event.id,
      timestamp: new Date().toISOString()
    });
  }
}

async function processWebhookEvent(event) {
  switch (event.type) {
    case 'checkout.session.completed':
      return await handleMountainSharesPurchase(event.data.object);
      
    case 'payment_intent.succeeded':
      return await handlePaymentSucceeded(event.data.object);
      
    case 'payment_intent.payment_failed':
      return await handlePaymentFailed(event.data.object);
      
    case 'invoice.payment_succeeded':
      return await handleSubscriptionPayment(event.data.object);
      
    default:
      console.log('ℹ️ Unhandled event type:', event.type);
      return { status: 'unhandled', eventType: event.type };
  }
}

async function handleMountainSharesPurchase(session) {
  const transactionId = `ms_${session.id}_${Date.now()}`;
  
  try {
    await validateContractEnvironment();
    
    const purchaseData = extractPurchaseDataWithDualStreams(session);
    
    const results = await Promise.allSettled([
      processSettlementReserveDeposit(purchaseData, transactionId),
      processGovernanceOverageDistribution(purchaseData, transactionId),
      processTreasuryReinforcement(purchaseData, transactionId),
      processMountainSharesTokenAllocation(purchaseData, transactionId)
    ]);
    
    logProcessingResults(results, transactionId, session.id);
    
    return {
      status: 'completed',
      transactionId: transactionId,
      sessionId: session.id,
      purchaseData: purchaseData,
      results: results.map(r => ({ status: r.status, value: r.value || r.reason }))
    };
    
  } catch (error) {
    console.error('❌ MountainShares purchase processing failed:', {
      transactionId: transactionId,
      sessionId: session.id,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

async function validateContractEnvironment() {
  const requiredContracts = [
    'MOUNTAINSHARES_TOKEN_ADDRESS',
    'BUSINESS_REGISTRY_ADDRESS', 
    'MOUNTAINSHARES_PHASE1_ADDRESS',
    'MS_GIFT_CARD_MANAGER_ADDRESS',
    'MS_TOKEN_CUSTOMER_PURCHASE_ADDRESS',
    'EMPLOYEE_REWARD_VAULT_SIMPLE_ADDRESS',
    'VOLUNTEER_ORGANIZATION_MANAGER_ADDRESS',
    'GOVERNANCE_FEE_DISTRIBUTOR_ADDRESS',
    'KYC_ADDRESS',
    'H4H_EARNEDMS_VAULT_ADDRESS',
    'HERITAGE_CLIO_REVENUE_ADDRESS',
    'SETTLEMENT_RESERVE_ADDRESS'
  ];
  
  const requiredTreasury = [
    'H4H_NONPROFIT_ADDRESS',
    'H4H_COMMUNITY_PROGRAMS_ADDRESS',
    'H4H_TREASURY_MOUNTAINSHARES_ADDRESS',
    'H4H_GOVERNANCE_ADDRESS',
    'DEVELOPMENT_ADDRESS',
    'H4H_TREASURY_RESERVE_BUILDER_ADDRESS'
  ];
  
  const missing = [...requiredContracts, ...requiredTreasury]
    .filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}

function extractPurchaseDataWithDualStreams(session) {
  const tokensPurchase = parseFloat(session.metadata?.tokens_purchase) || 
                        (session.amount_total / 100);
  
  if (!tokensPurchase || tokensPurchase <= 0) {
    throw new Error('Invalid purchase amount');
  }
  
  // DUAL-STREAM FEE STRUCTURE
  const settlementReserveAmount = tokensPurchase; // Exact 1:1 backing
  const governanceOverage = tokensPurchase * 0.02; // 2% to governance contract
  const treasuryReinforcement = tokensPurchase * 0.005; // 0.5% direct reinforcement
  const totalPlatformFees = governanceOverage + treasuryReinforcement; // 2.5% total
  const subtotal = tokensPurchase + totalPlatformFees;
  
  return {
    tokensPurchase: tokensPurchase,
    settlementReserveAmount: settlementReserveAmount,
    governanceOverage: governanceOverage,
    treasuryReinforcement: treasuryReinforcement,
    totalPlatformFees: totalPlatformFees,
    subtotal: subtotal,
    netReceived: subtotal,
    sessionId: session.id,
    customerId: session.customer,
    customerEmail: session.customer_details?.email
  };
}

async function processSettlementReserveDeposit(purchaseData, transactionId) {
  const settlementReserve = process.env.SETTLEMENT_RESERVE_ADDRESS;
  
  console.log('💰 Processing Settlement Reserve Deposit (1:1 Backing):', {
    transactionId: transactionId,
    amount: `$${purchaseData.settlementReserveAmount} USDC`,
    tokenValue: `$${purchaseData.tokensPurchase}`,
    backingRatio: '100%',
    settlementReserveAddress: settlementReserve,
    sessionId: purchaseData.sessionId,
    timestamp: new Date().toISOString()
  });
  
  return {
    action: 'settlement_reserve_deposit',
    amount: purchaseData.settlementReserveAmount,
    contractAddress: settlementReserve,
    backingRatio: '100%',
    status: 'logged'
  };
}

async function processGovernanceOverageDistribution(purchaseData, transactionId) {
  const governanceContract = process.env.GOVERNANCE_FEE_DISTRIBUTOR_ADDRESS;
  
  console.log('🏛️ Processing Governance Contract Distribution (2% Overage):', {
    transactionId: transactionId,
    overageAmount: `$${purchaseData.governanceOverage}`,
    governanceContract: governanceContract,
    purpose: 'H4H Ecosystem Operational Funding',
    expectedDistribution: {
      nonprofit: `$${(purchaseData.governanceOverage * 0.30).toFixed(2)} (30%)`,
      communityPrograms: `$${(purchaseData.governanceOverage * 0.15).toFixed(2)} (15%)`,
      treasury: `$${(purchaseData.governanceOverage * 0.30).toFixed(2)} (30%)`,
      governance: `$${(purchaseData.governanceOverage * 0.10).toFixed(2)} (10%)`,
      development: `$${(purchaseData.governanceOverage * 0.15).toFixed(2)} (15%)`
    },
    sessionId: purchaseData.sessionId,
    timestamp: new Date().toISOString()
  });
  
  return {
    action: 'governance_overage_distribution',
    amount: purchaseData.governanceOverage,
    contractAddress: governanceContract,
    purpose: 'h4h_ecosystem_funding',
    status: 'logged'
  };
}

async function processTreasuryReinforcement(purchaseData, transactionId) {
  const reinforcementWallet = process.env.H4H_TREASURY_RESERVE_BUILDER_ADDRESS;
  
  console.log('🏦 Processing Treasury Reinforcement (0.5% Direct):', {
    transactionId: transactionId,
    reinforcementAmount: `$${purchaseData.treasuryReinforcement}`,
    reinforcementWallet: reinforcementWallet,
    purpose: 'Treasury Reserve Building & Reinforcement',
    frequency: 'Every Transaction',
    sessionId: purchaseData.sessionId,
    timestamp: new Date().toISOString()
  });
  
  return {
    action: 'treasury_reinforcement',
    amount: purchaseData.treasuryReinforcement,
    contractAddress: reinforcementWallet,
    purpose: 'treasury_reserve_building',
    status: 'logged'
  };
}

async function processMountainSharesTokenAllocation(purchaseData, transactionId) {
  const mountainSharesToken = process.env.MOUNTAINSHARES_TOKEN_ADDRESS;
  
  console.log('🪙 Processing MountainShares Token Allocation:', {
    transactionId: transactionId,
    tokenValue: `$${purchaseData.tokensPurchase} worth`,
    mountainSharesTokenAddress: mountainSharesToken,
    customerId: purchaseData.customerId,
    customerEmail: purchaseData.customerEmail,
    backingAmount: `$${purchaseData.settlementReserveAmount} USDC`,
    sessionId: purchaseData.sessionId,
    timestamp: new Date().toISOString()
  });
  
  return {
    action: 'mountainshares_token_allocation',
    tokenValue: purchaseData.tokensPurchase,
    contractAddress: mountainSharesToken,
    customerId: purchaseData.customerId,
    backingAmount: purchaseData.settlementReserveAmount,
    status: 'logged'
  };
}

function logProcessingResults(results, transactionId, sessionId) {
  const summary = {
    transactionId: transactionId,
    sessionId: sessionId,
    totalOperations: results.length,
    successful: results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length,
    dualStreamProcessing: 'active',
    timestamp: new Date().toISOString()
  };
  
  console.log('📋 Dual-Stream Processing Summary:', summary);
  
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`❌ Operation ${index + 1} failed:`, {
        transactionId: transactionId,
        error: result.reason?.message || result.reason,
        timestamp: new Date().toISOString()
      });
    }
  });
}

async function handlePaymentSucceeded(paymentIntent) {
  console.log('✅ Payment Intent Succeeded:', {
    paymentIntentId: paymentIntent.id,
    amount: `$${paymentIntent.amount / 100}`,
    currency: paymentIntent.currency,
    status: paymentIntent.status,
    timestamp: new Date().toISOString()
  });
  
  return { status: 'logged', action: 'payment_succeeded' };
}

async function handlePaymentFailed(paymentIntent) {
  console.log('❌ Payment Intent Failed:', {
    paymentIntentId: paymentIntent.id,
    amount: `$${paymentIntent.amount / 100}`,
    currency: paymentIntent.currency,
    lastPaymentError: paymentIntent.last_payment_error?.message,
    timestamp: new Date().toISOString()
  });
  
  return { status: 'logged', action: 'payment_failed' };
}

async function handleSubscriptionPayment(invoice) {
  console.log('💳 Subscription Payment Succeeded:', {
    invoiceId: invoice.id,
    subscriptionId: invoice.subscription,
    amount: `$${invoice.amount_paid / 100}`,
    currency: invoice.currency,
    timestamp: new Date().toISOString()
  });
  
  return { status: 'logged', action: 'subscription_payment' };
}
