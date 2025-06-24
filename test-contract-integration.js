const { ethers } = require('ethers');

async function testContractIntegration() {
    console.log('🏔️ MOUNTAINSHARES CONTRACT INTEGRATION TEST');
    console.log('==========================================');
    
    // ✅ FIXED: Use ethers v6 syntax (no .providers)
    const provider = new ethers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
    
    // Test 1: Verify token contract
    console.log('\n1. Testing MountainShares Token Contract...');
    const tokenContract = new ethers.Contract(
        '0xE8A9c6fFE6b2344147D886EcB8608C5F7863B20D',
        ['function name() view returns (string)', 'function symbol() view returns (string)', 'function totalSupply() view returns (uint256)'],
        provider
    );
    
    try {
        const name = await tokenContract.name();
        const symbol = await tokenContract.symbol();
        const supply = await tokenContract.totalSupply();
        
        console.log(`✅ Token Name: ${name}`);
        console.log(`✅ Token Symbol: ${symbol}`);
        console.log(`✅ Total Supply: ${ethers.formatEther(supply)} MS`); // v6 syntax
    } catch (error) {
        console.error('❌ Token contract test failed:', error.message);
    }
    
    // Test 2: Verify purchase contract
    console.log('\n2. Testing Purchase Contract...');
    try {
        const contractCode = await provider.getCode('0x2a36e8775EbfaAb18E25Df81EF6Eab05E026f400');
        console.log(`✅ Purchase Contract Deployed: ${contractCode.length > 2 ? 'Yes' : 'No'}`);
        console.log(`✅ Contract Size: ${contractCode.length} bytes`);
    } catch (error) {
        console.error('❌ Purchase contract test failed:', error.message);
    }
    
    // Test 3: Verify vault contract
    console.log('\n3. Testing H4H Vault Contract...');
    try {
        const vaultCode = await provider.getCode('0x95e4c1b6aad37e610742254114216ceaf0f49acd');
        console.log(`✅ Vault Contract Deployed: ${vaultCode.length > 2 ? 'Yes' : 'No'}`);
        console.log(`✅ Vault Size: ${vaultCode.length} bytes`);
    } catch (error) {
        console.error('❌ Vault contract test failed:', error.message);
    }
    
    // Test 4: Verify fee wallet addresses
    console.log('\n4. Testing Fee Distribution Wallets...');
    const feeWallets = {
        'Harmony for Hope': '0xde75f5168e33db23fa5601b5fc88545be7b287a4',
        'Community Programs': '0xf8c739a101e53f6fe4e24df768be833ceecefa84',
        'Treasury': '0x2b686a6c1c4b40ffc748b56b6c7a06c49e361167',
        'Governance': '0x8c09e686bdfd283bdf5f6fffc780e62a695014f3',
        'Development': '0xd8bb25076e61b5a382e17171b48d8e0952b5b4f3'
    };
    
    for (const [name, address] of Object.entries(feeWallets)) {
        try {
            const balance = await provider.getBalance(address);
            console.log(`✅ ${name}: ${address} (Balance: ${ethers.formatEther(balance)} ETH)`); // v6 syntax
        } catch (error) {
            console.error(`❌ ${name} wallet test failed:`, error.message);
        }
    }
    
    console.log('\n🎉 CONTRACT INTEGRATION TESTS COMPLETE!');
}

testContractIntegration();
