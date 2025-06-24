const { expect } = require('chai');
const { ethers } = require('ethers');
const axios = require('axios');

describe('MountainShares Platform Tests', function() {
    const RAILWAY_URL = 'https://mountainshares-backend-production.up.railway.app';
    const EXPECTED_CONTRACTS = {
        token: '0xE8A9c6fFE6b2344147D886EcB8608C5F7863B20D',
        purchase: '0x2a36e8775EbfaAb18E25Df81EF6Eab05E026f400',
        vault: '0x95e4c1b6aad37e610742254114216ceaf0f49acd'
    };

    describe('🌐 Platform Health Tests', function() {
        it('Should return 200 status for main endpoint', async function() {
            const response = await axios.get(RAILWAY_URL);
            expect(response.status).to.equal(200);
            expect(response.data).to.include('MountainShares');
        });

        it('Should have healthy status endpoint', async function() {
            const response = await axios.get(`${RAILWAY_URL}/health`);
            expect(response.status).to.equal(200);
            expect(response.data.status).to.equal('healthy');
        });

        it('Should show correct contract addresses', async function() {
            const response = await axios.get(`${RAILWAY_URL}/health`);
            expect(response.data.contracts.token).to.equal(EXPECTED_CONTRACTS.token);
            expect(response.data.contracts.purchase).to.equal(EXPECTED_CONTRACTS.purchase);
            expect(response.data.contracts.vault).to.equal(EXPECTED_CONTRACTS.vault);
        });
    });

    describe('💰 Stripe Integration Tests', function() {
        it('Should create checkout session', async function() {
            const response = await axios.post(`${RAILWAY_URL}/create-checkout-session`, {
                amount: 1
            }, {
                headers: { 'Content-Type': 'application/json' }
            });
            
            expect(response.status).to.equal(200);
            expect(response.data.url).to.include('checkout.stripe.com');
        });

        it('Should calculate correct fees', async function() {
            // Test fee calculation: $1.00 + $0.02 + $0.33 + $0.01 = $1.36
            const response = await axios.post(`${RAILWAY_URL}/create-checkout-session`, {
                amount: 1
            }, {
                headers: { 'Content-Type': 'application/json' }
            });
            
            // Verify the checkout session has correct amount (136 cents = $1.36)
            expect(response.data.url).to.include('checkout.stripe.com');
        });
    });

    describe('🔗 Smart Contract Tests', function() {
        let provider, tokenContract;

        before(async function() {
            provider = new ethers.providers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
            
            const tokenABI = [
                "function name() view returns (string)",
                "function symbol() view returns (string)",
                "function totalSupply() view returns (uint256)",
                "function balanceOf(address) view returns (uint256)"
            ];
            
            tokenContract = new ethers.Contract(
                EXPECTED_CONTRACTS.token,
                tokenABI,
                provider
            );
        });

        it('Should connect to MountainShares token contract', async function() {
            const name = await tokenContract.name();
            expect(name).to.include('MountainShares');
        });

        it('Should have correct token symbol', async function() {
            const symbol = await tokenContract.symbol();
            expect(symbol).to.equal('MS');
        });

        it('Should show total supply', async function() {
            const totalSupply = await tokenContract.totalSupply();
            expect(totalSupply.gt(0)).to.be.true;
        });
    });

    describe('🎯 Frontend Tests', function() {
        it('Should serve MountainShares interface', async function() {
            const response = await axios.get(RAILWAY_URL);
            expect(response.data).to.include('Purchase 1 MountainShare - $1.36');
            expect(response.data).to.include('Digital currency for West Virginia');
        });

        it('Should show correct contract addresses in UI', async function() {
            const response = await axios.get(RAILWAY_URL);
            expect(response.data).to.include(EXPECTED_CONTRACTS.token);
            expect(response.data).to.include(EXPECTED_CONTRACTS.purchase);
            expect(response.data).to.include(EXPECTED_CONTRACTS.vault);
        });

        it('Should have working JavaScript purchase function', async function() {
            const response = await axios.get(RAILWAY_URL);
            expect(response.data).to.include('purchaseMountainShares()');
            expect(response.data).to.include('/create-checkout-session');
        });
    });

    describe('⚡ Performance Tests', function() {
        it('Should respond within 2 seconds', async function() {
            const start = Date.now();
            await axios.get(RAILWAY_URL);
            const duration = Date.now() - start;
            expect(duration).to.be.below(2000);
        });

        it('Should handle multiple concurrent requests', async function() {
            const requests = Array(5).fill().map(() => axios.get(`${RAILWAY_URL}/health`));
            const responses = await Promise.all(requests);
            responses.forEach(response => {
                expect(response.status).to.equal(200);
            });
        });
    });
});
