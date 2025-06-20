require('dotenv').config();

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { ethers } = require('ethers');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
    origin: [process.env.FRONTEND_URL, 'http://localhost:3000'],
    credentials: true
}));

// Webhook endpoint FIRST (before express.json())
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // Verify webhook signature
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        console.log('✅ Webhook signature verified:', event.type);
    } catch (err) {
        console.error('❌ Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle payment success
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        try {
            const { walletAddress, tokenAmount } = session.metadata;
            
            if (!walletAddress || !tokenAmount) {
                throw new Error('Missing wallet address or token amount in metadata');
            }

            console.log(`💰 Processing payment: ${tokenAmount} tokens → ${walletAddress}`);
            
            // Mint tokens to wallet
            const result = await mintTokensToWallet(walletAddress, tokenAmount);
            
            if (result.success) {
                console.log(`✅ Tokens minted successfully: ${result.txHash}`);
            } else {
                console.error('❌ Token minting failed:', result.error);
            }
            
        } catch (error) {
            console.error('❌ Payment processing failed:', error.message);
            // Log to your monitoring system here
        }
    }

    // Always acknowledge webhook
    res.status(200).json({received: true});
});

// JSON middleware for API endpoints
app.use(express.json());

// Create Stripe checkout session
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { amount, walletAddress, currency = 'usd' } = req.body;
        
        // Validation
        if (!amount || !walletAddress) {
            return res.status(400).json({ error: 'Amount and wallet address required' });
        }
        
        if (amount < 1 || amount > 10000) {
            return res.status(400).json({ error: 'Amount must be between $1 and $10,000' });
        }
        
        if (!ethers.isAddress(walletAddress)) {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }

        // Calculate total with fees (matching frontend)
        const loadingFee = amount * 0.02; // 2% loading fee
        const subtotal = amount + loadingFee;
        const totalCents = Math.round(subtotal * 100);

        console.log(`💳 Creating checkout: $${amount} + $${loadingFee.toFixed(2)} fee = $${subtotal.toFixed(2)}`);

        // Create Stripe session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: currency,
                    product_data: {
                        name: 'MountainShares',
                        description: `${amount} MountainShares tokens for Mount Hope, WV`,
                    },
                    unit_amount: totalCents,
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: process.env.FRONTEND_URL,
            metadata: {
                walletAddress: walletAddress,
                tokenAmount: amount.toString(),
                loadingFee: loadingFee.toString(),
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
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});

// Token minting function with complete error handling
async function mintTokensToWallet(walletAddress, amount) {
    let provider, wallet, contract;
    
    try {
        console.log(`🔗 Initiating blockchain transaction...`);
        
        // Setup blockchain connection
        provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        
        // Contract ABI - Updated for your MountainShares contract
        const contractABI = [
            "function purchaseShares() external payable",
            "function adminMintPMS(address to, uint256 amount) external",
            "function mintTokensTo(address to, uint256 amount) external",
            "function transfer(address to, uint256 amount) external returns (bool)",
            "function balanceOf(address) view returns (uint256)",
            "function owner() view returns (address)"
        ];
        
        contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, wallet);
        
        // Convert amount to wei (18 decimals)
        const tokenAmount = ethers.parseEther(amount.toString());
        
        console.log(`📝 Minting ${amount} tokens (${ethers.formatEther(tokenAmount)} wei) to ${walletAddress}`);
        
        // Try different minting functions based on your contract
        let tx;
        try {
            // Try adminMintPMS first (most likely for your contract)
            tx = await contract.adminMintPMS(walletAddress, tokenAmount, {
                gasLimit: 500000
            });
        } catch (error1) {
            console.log('⚠️ adminMintPMS failed, trying mintTokensTo...');
            try {
                tx = await contract.mintTokensTo(walletAddress, tokenAmount, {
                    gasLimit: 500000
                });
            } catch (error2) {
                console.log('⚠️ mintTokensTo failed, trying transfer...');
                tx = await contract.transfer(walletAddress, tokenAmount, {
                    gasLimit: 300000
                });
            }
        }
        
        console.log(`📤 Transaction submitted: ${tx.hash}`);
        
        // Wait for confirmation with timeout
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
        
        // Detailed error logging
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            address: walletAddress,
            amount: amount,
            contractAddress: process.env.CONTRACT_ADDRESS
        });
        
        return { 
            success: false, 
            error: error.message,
            details: error.code || 'Unknown error'
        };
    } finally {
        // Cleanup connections
        if (provider) {
            try { provider.destroy(); } catch (e) {}
        }
    }
}

// Health check with detailed status
app.get('/health', async (req, res) => {
    try {
        // Test Stripe connection
        const stripeTest = await stripe.balance.retrieve();
        
        // Test blockchain connection
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const blockNumber = await provider.getBlockNumber();
        
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            stripe: 'connected',
            blockchain: {
                connected: true,
                latestBlock: blockNumber,
                network: 'Arbitrum One'
            },
            contract: process.env.CONTRACT_ADDRESS,
            environment: process.env.NODE_ENV || 'development'
        });
        
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Error handling middleware
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
    console.log(`✅ Webhook endpoint: /webhook`);
    console.log(`✅ Checkout endpoint: /api/create-checkout-session`);
    console.log(`✅ Health check: /health`);
});

module.exports = app;
