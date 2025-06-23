const express = require('express');
const { ethers } = require('ethers');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(express.static('public'));

const provider = new ethers.providers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// YOUR ACTUAL MOUNTAINSHARES CONTRACTS
const MS_TOKEN_ADDRESS = '0xE8A9c6fFE6b2344147D886EcB8608C5F7863B20D';
const MS_PURCHASE_ADDRESS = '0x2a36e8775EbfaAb18E25Df81EF6Eab05E026f400';
const H4H_VAULT_ADDRESS = '0x95e4c1b6aad37e610742254114216ceaf0f49acd';

// Minimal ABI for token minting
const TOKEN_ABI = [
  "function mint(address to, uint256 amount) external",
  "function balanceOf(address owner) view returns (uint256)"
];

const PURCHASE_ABI = [
  "function purchaseTokens(uint256 amount) payable external",
  "function processPayment(address customer, uint256 amount) external"
];

let msToken, msPurchase;
try {
  msToken = new ethers.Contract(MS_TOKEN_ADDRESS, TOKEN_ABI, wallet);
  msPurchase = new ethers.Contract(MS_PURCHASE_ADDRESS, PURCHASE_ABI, wallet);
  console.log('✅ MountainShares contracts loaded successfully');
} catch (error) {
  console.error('❌ Contract setup failed:', error.message);
}

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>🏔️ MountainShares - Digital Currency for West Virginia</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                max-width: 1000px; 
                margin: 0 auto; 
                padding: 20px; 
                background: linear-gradient(135deg, #0A0A0A, #1A1A1A);
                color: white;
            }
            .hero { 
                text-align: center; 
                margin: 40px 0; 
                background: rgba(255, 255, 255, 0.05);
                padding: 60px 40px;
                border-radius: 20px;
                border: 2px solid #FFD700;
            }
            .purchase-btn { 
                background: linear-gradient(135deg, #FFD700, #FFA500); 
                color: #000; 
                padding: 20px 40px; 
                font-size: 20px; 
                border: none; 
                border-radius: 10px; 
                cursor: pointer;
            }
            .contracts { 
                background: rgba(0, 102, 255, 0.1); 
                padding: 30px; 
                margin: 30px 0; 
                border-radius: 15px; 
                border-left: 4px solid #0066FF;
            }
        </style>
    </head>
    <body>
        <div class="hero">
            <h1>🏔️ MountainShares</h1>
            <p>Digital currency for West Virginia communities</p>
            <button class="purchase-btn" onclick="purchaseMountainShares()">
                Purchase 1 MountainShare - $1.36
            </button>
        </div>
        
        <div class="contracts">
            <h3>📋 Connected Contracts</h3>
            <div>MountainShares Token: ${MS_TOKEN_ADDRESS}</div>
            <div>Purchase Contract: ${MS_PURCHASE_ADDRESS}</div>
            <div>H4H Vault: ${H4H_VAULT_ADDRESS}</div>
            <div>Status: ${msToken ? 'Connected' : 'Failed'}</div>
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
            description: 'Digital currency for West Virginia communities',
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
        totalPaid: total.toString()
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    try {
      const session = event.data.object;
      const amount = parseFloat(session.metadata.tokenAmount);

      console.log('🚀 Processing MountainShares purchase:', { amount });

      // CALL YOUR ACTUAL CONTRACTS
      if (msPurchase && msToken) {
        console.log('💎 Minting MountainShares tokens...');
        
        // Use your actual contract methods
        const mintTx = await msToken.mint(
          '0xde75f5168e33db23fa5601b5fc88545be7b287a4', // H4H wallet
          ethers.utils.parseEther(amount.toString())
        );
        await mintTx.wait();
        
        console.log('✅ MountainShares tokens minted successfully!');
      }

      res.status(200).send('Success');
    } catch (error) {
      console.error('❌ Webhook processing error:', error);
      res.status(500).send('Webhook Error');
    }
  } else {
    res.status(200).send('Event received');
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    contracts: {
      token: MS_TOKEN_ADDRESS,
      purchase: MS_PURCHASE_ADDRESS,
      vault: H4H_VAULT_ADDRESS,
      connected: !!msToken
    }
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`MountainShares server running on port ${PORT}`);
  console.log(`Contracts: ${msToken ? 'Connected' : 'Failed'}`);
});
