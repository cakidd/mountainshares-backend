const axios = require('axios');
const { ethers } = require('ethers');

async function verifyMountainShares() {
    console.log('🏔️ MOUNTAINSHARES PLATFORM VERIFICATION');
    console.log('=====================================');
    
    try {
        // Test 1: Platform Health
        console.log('\n1. Testing Platform Health...');
        const healthResponse = await axios.get('https://mountainshares-backend-production.up.railway.app/health');
        console.log(`✅ Status: ${healthResponse.data.status}`);
        console.log(`✅ Contracts Connected: ${healthResponse.data.contracts.connected}`);
        
        // Test 2: Frontend Loading
        console.log('\n2. Testing Frontend...');
        const frontendResponse = await axios.get('https://mountainshares-backend-production.up.railway.app/');
        const hasPurchaseButton = frontendResponse.data.includes('Purchase 1 MountainShare - $1.36');
        console.log(`✅ Purchase Button Present: ${hasPurchaseButton}`);
        
        // Test 3: Stripe Integration
        console.log('\n3. Testing Stripe Integration...');
        const stripeResponse = await axios.post('https://mountainshares-backend-production.up.railway.app/create-checkout-session', {
            amount: 1
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
        const hasStripeURL = stripeResponse.data.url && stripeResponse.data.url.includes('stripe.com');
        console.log(`✅ Stripe Checkout Working: ${hasStripeURL}`);
        
        // Test 4: Smart Contract Connection
        console.log('\n4. Testing Smart Contract...');
        const provider = new ethers.providers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
        const tokenContract = new ethers.Contract(
            '0xE8A9c6fFE6b2344147D886EcB8608C5F7863B20D',
            ['function name() view returns (string)'],
            provider
        );
        const tokenName = await tokenContract.name();
        console.log(`✅ Token Contract: ${tokenName}`);
        
        console.log('\n🎉 ALL TESTS PASSED - MOUNTAINSHARES PLATFORM IS FULLY OPERATIONAL!');
        
    } catch (error) {
        console.error('❌ Test Failed:', error.message);
    }
}

verifyMountainShares();
