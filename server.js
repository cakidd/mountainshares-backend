require('dotenv').config();

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { ethers } = require('ethers');

const app = express();
const PORT = process.env.PORT || 3001;

// UPDATED CORS configuration for your Netlify frontend
app.use(cors({
    origin: [
        'https://sensational-blancmange-048bc5.netlify.app',
        'https://6854aa939e5549c6ad6d363d--frolicking-crisp-0b1d43.netlify.app',
        'https://frolicking-crisp-0b1d43.netlify.app',
        'http://localhost:3000',
        'https://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security middleware
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false
}));
app.use(morgan('combined'));

// Webhook endpoint FIRST (before express.json())
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        console.log('✅ Webhook signature verified:', event.type);
    } catch (err) {
        console.error('❌ Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        try {
            const { walletAddress, tokenAmount } = session.metadata;
            
            if (!walletAddress || !tokenAmount) {
                throw new Error('Missing wallet address or token amount in metadata');
            }

            console.log(`💰 Processing payment: ${tokenAmount} tokens → ${walletAddress}`);
            
            const result = await mintTokensToWallet(walletAddress, tokenAmount);
            
            if (result.success) {
                console.log(`✅ Tokens minted successfully: ${result.txHash}`);
            } else {
                console.error('❌ Token minting failed:', result.error);
            }
            
        } catch (error) {
            console.error('❌ Payment processing failed:', error.message);
        }
    }

    res.status(200).json({received: true});
});

// JSON middleware for API endpoints
app.use(express.json());

// OPTIONS preflight for CORS
app.options('*', cors());

// Create Stripe checkout session
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        console.log('📝 Checkout request received from:', req.headers.origin);
        console.log('📝 Request body:', req.body);

        const { amount, walletAddress, currency = 'usd' } = req.body;
        
        if (!amount || !walletAddress) {
            return res.status(400).json({ error: 'Amount and wallet address required' });
        }
        
        if (amount < 1 || amount > 10000) {
            return res.status(400).json({ error: 'Amount must be between $1 and $10,000' });
        }
        
        if (!ethers.isAddress(walletAddress)) {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }

        const loadingFee = amount * 0.02;
        const stripeFee = (subtotal * 0.029) + 0.30;
        const total = subtotal + stripeFee;
        const subtotal = amount + loadingFee;
        const totalCents = Math.round(total * 100);

        console.log(`💳 Creating checkout: $${amount} + $${loadingFee.toFixed(2)} loading fee + $${stripeFee.toFixed(2)} processing fee = $${(subtotal + stripeFee).toFixed(2)}`);
        console.log(`🔍 Debug - subtotal: $${subtotal}, stripeFee: $${stripeFee}`);
        console.log(`🔍 Line item 1 amount: ${Math.round(subtotal * 100)} cents`);
        console.log(`🔍 Line item 2 amount: ${Math.round(stripeFee * 100)} cents`);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: currency,
                    unit_amount: Math.round((subtotal + stripeFee) * 100),
                    product_data: {
                        name: "MountainShares Tokens",
                        description: `${amount} tokens + $${loadingFee.toFixed(2)} loading fee + $${stripeFee.toFixed(2)} processing fee`,
                    },
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `https://sensational-blancmange-048bc5.netlify.app/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `https://sensational-blancmange-048bc5.netlify.app`,
            metadata: {
                walletAddress: walletAddress,
                tokenAmount: amount.toString(),
                loadingFee: loadingFee.toString(),
                stripeFee: stripeFee.toString(),
                timestamp: new Date().toISOString()
            },
            billing_address_collection: 'required',
            customer_creation: 'always'
        });

        console.log(`✅ Checkout session created: ${session.id}`);
        
        res.json({
            url: session.url,
            sessionId: session.id
        });

    } catch (error) {
        console.error('❌ Checkout creation failed:', error.message);
        res.status(500).json({ error: 'Failed to create checkout session: ' + error.message });
    }
});

async function mintTokensToWallet(walletAddress, amount) {
    try {
        console.log(`🔗 Initiating blockchain transaction...`);
        
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        
        const contractABI = [
            "function adminMintPMS(address to, uint256 amount) external",
            "function transfer(address to, uint256 amount) external returns (bool)"
        ];
        
        const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, wallet);
        const tokenAmount = ethers.parseEther(amount.toString());
        
        console.log(`📝 Minting ${amount} tokens to ${walletAddress}`);
        
        let tx;
        try {
            tx = await contract.adminMintPMS(walletAddress, tokenAmount, {
                gasLimit: 500000
            });
        } catch (error1) {
            console.log('⚠️ adminMintPMS failed, trying transfer...');
            tx = await contract.transfer(walletAddress, tokenAmount, {
                gasLimit: 300000
            });
        }
        
        console.log(`📤 Transaction submitted: ${tx.hash}`);
        
        const receipt = await Promise.race([
            tx.wait(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Transaction timeout')), 120000)
            )
        ]);
        
        if (receipt.status === 1) {
            console.log(`✅ Transaction confirmed: ${tx.hash}`);
            return { 
                success: true, 
                txHash: tx.hash,
                blockNumber: receipt.blockNumber 
            };
        } else {
            throw new Error('Transaction failed');
        }
        
    } catch (error) {
        console.error('❌ Blockchain transaction failed:', error.message);
        return { 
            success: false, 
            error: error.message
        };
    }
}

// Health check
app.get('/health', async (req, res) => {
    try {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const blockNumber = await provider.getBlockNumber();
        
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            checks: {
                database: 'optional',
                ethereum: `connected (block ${blockNumber})`,
                admin_wallet: process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.substring(0, 10) + '...' : 'missing',
                mountainshares_balance: 'Contract check disabled'
            }
        });
        
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Error handling
app.use((error, req, res, next) => {
    console.error('❌ Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log('🚀 MountainShares Production Backend');
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log(`🔗 Contract: ${process.env.CONTRACT_ADDRESS}`);
    console.log(`🌐 Frontend: ${process.env.FRONTEND_URL}`);
    console.log(`✅ CORS enabled for Netlify domain`);
});

module.exports = app;
// Force rebuild Fri Jun 20 00:15:08 EDT 2025
// Force rebuild 1750394781
