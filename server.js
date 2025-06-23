const express = require('express');
const { ethers } = require('ethers');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { JITPaymentStrategy } = require('./jit-payment-strategy');

const app = express();

// Ethers v5 provider and wallet setup
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// H4H Contract setup
const CONTRACT_ABI = JSON.parse(process.env.CONTRACT_ABI);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

// Initialize JIT Payment Strategy
const jitStrategy = new JITPaymentStrategy(provider, wallet);

// Serve static files
app.use(express.static('public'));

// Home route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>MountainShares - Digital Currency for West Virginia</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .hero { text-align: center; margin: 40px 0; }
            .purchase-btn { background: #4CAF50; color: white; padding: 15px 30px; font-size: 18px; border: none; border-radius: 5px; cursor: pointer; }
            .purchase-btn:hover { background: #45a049; }
            .fee-breakdown { background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .jit-info { background: #e3f2fd; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #2196F3; }
        </style>
    </head>
    <body>
        <div class="hero">
            <h1>🏔️ MountainShares</h1>
            <p>Digital currency for West Virginia communities</p>
            <button class="purchase-btn" onclick="purchaseMountainShares()">Purchase 1 MountainShare - $1.36</button>
        </div>
        
        <div class="fee-breakdown">
            <h3>Fee Breakdown</h3>
            <div>1 MountainShare Token: $1.00</div>
            <div>Platform Processing: $0.36</div>
            <div><strong>Total: $1.36</strong></div>
        </div>

        <div class="jit-info">
            <h3>🚀 Advanced JIT Payment Processing</h3>
            <p>Your payment triggers real-time liquidity acquisition via Uniswap V3</p>
            <p>✅ Circuit breaker protection • ✅ Safety stock fallback • ✅ Zero operational float</p>
        </div>

        <script>
            async function purchaseMountainShares() {
                try {
                    const response = await fetch('/create-checkout-session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ amount: 1 })
                    });
                    
                    const { url } = await response.json();
                    window.location.href = url;
                } catch (error) {
                    console.error('Error:', error);
                    alert('Purchase failed. Please try again.');
                }
            }
        </script>
    </body>
    </html>
  `);
});

// Create Stripe checkout session
app.post('/create-checkout-session', express.json(), async (req, res) => {
  try {
    const { amount } = req.body;
    const loadingFee = 0.02;
    const stripeFee = 0.33;
    const regionalFee = 0.01;
    const total = amount + loadingFee + stripeFee + regionalFee;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${amount} MountainShares`,
            description: 'Digital currency for West Virginia communities - JIT Processing',
          },
          unit_amount: Math.round(total * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancel`,
      metadata: {
        tokenAmount: amount.toString(),
        loadingFee: loadingFee.toString(),
        totalPaid: total.toString()
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe webhook with JIT USDC purchase
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    try {
      const session = event.data.object;
      const amount = parseFloat(session.metadata.tokenAmount);
      const total = parseFloat(session.metadata.totalPaid);
      const loadingFee = parseFloat(session.metadata.loadingFee);
      const stripeFee = 0.33;
      const regionalFee = 0.01;

      console.log('Debug values:', {
        amount,
        total,
        loadingFee,
        stripeFee,
        regionalFee
      });

      // Execute JIT Payment Strategy
      console.log('🚀 Executing JIT Payment Strategy...');
      const paymentResult = await jitStrategy.executePayment(total);

      if (!paymentResult.success) {
        console.error('JIT payment strategy failed:', paymentResult);
        res.status(500).send('Payment processing failed - manual review required');
        return;
      }

      console.log(`✅ Payment successful via ${paymentResult.method}`);
      
      console.log('About to call H4H contract...');
      
      // Call H4H contract with ETH payment
      const contractCallTx = await contract.loadGiftCard({
        value: ethers.utils.parseEther((total / 2700).toString()) // ETH equivalent
      });
      
      await contractCallTx.wait();
      
      console.log('✅ JIT payment strategy and token minting completed!');
      res.status(200).send('JIT Success');
      
    } catch (error) {
      console.error('JIT webhook error:', error);
      res.status(500).send('JIT Error');
    }
  } else {
    // Handle other event types
    console.log(`Unhandled event type: ${event.type}`);
    res.status(200).send('Event received');
  }
});

// Success page
app.get('/success', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Payment Successful - MountainShares</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; text-align: center; }
            .success { color: #4CAF50; font-size: 24px; margin: 20px 0; }
            .info { background: #f0f8ff; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .jit-success { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #4CAF50; }
        </style>
    </head>
    <body>
        <h1>🎉 Payment Successful!</h1>
        <div class="success">Thank you for your MountainShares purchase!</div>
        
        <div class="jit-success">
            <h3>🚀 JIT Processing Complete</h3>
            <p>Your payment triggered real-time liquidity acquisition</p>
            <p>Advanced circuit breaker protection ensured seamless processing</p>
        </div>
        
        <div class="info">
            <h3>Your MountainShares tokens are being minted!</h3>
            <p>Session ID: ${req.query.session_id}</p>
            <p>Your tokens will appear in your MetaMask wallet shortly.</p>
            <p>Network: Arbitrum One</p>
            <p>Token Contract: 0xD1687623C922084C73A5325fDc7b0dE6E3E39453</p>
            
            <h4>Add Token to MetaMask:</h4>
            <p>Contract: 0xD1687623C922084C73A5325fDc7b0dE6E3E39453</p>
            <p>Symbol: MS</p>
            <p>Decimals: 18</p>
        </div>
        
        <a href="/">Return to MountainShares</a>
    </body>
    </html>
  `);
});

// Cancel page
app.get('/cancel', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Payment Cancelled - MountainShares</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; text-align: center; }
        </style>
    </head>
    <body>
        <h1>Payment Cancelled</h1>
        <p>Your payment was cancelled. No charges were made.</p>
        <p>JIT payment processing was not triggered.</p>
        <a href="/">Return to MountainShares</a>
    </body>
    </html>
  `);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0-jit',
    jit_enabled: true,
    ethers_version: ethers.version
  });
});

// JIT status endpoint
app.get('/jit-status', (req, res) => {
  res.json({
    circuit_breaker_state: jitStrategy.circuitBreaker.state,
    failure_count: jitStrategy.circuitBreaker.failureCount,
    last_failure: jitStrategy.circuitBreaker.lastFailureTime,
    ethers_version: ethers.version,
    provider_ready: !!provider,
    wallet_ready: !!wallet
  });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Mountain Shares server running on port ${PORT}`);
  console.log(`🚀 JIT Payment Strategy enabled with circuit breaker protection`);
  console.log(`Ethers version: ${ethers.version}`);
});

module.exports = app;
