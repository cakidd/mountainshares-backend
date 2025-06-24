const { ethers } = require('ethers');

const UNISWAP_ROUTER_ADDRESS = process.env.UNISWAP_ROUTER_ADDRESS || '0xE592427A0AEce92De3Edee1F18E0157C05861564';

console.log('🔧 Using Uniswap Router:', UNISWAP_ROUTER_ADDRESS);

class JITCircuitBreaker {
  constructor(provider, wallet) {
    this.provider = provider;
    this.wallet = wallet;
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.threshold = 3;
    this.timeout = 60000;
    
    // ✅ FIXED: Proper provider connection
    this.swapRouter = new ethers.Contract(
      UNISWAP_ROUTER_ADDRESS,
      ["function exactInputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160)) payable returns (uint256)"],
      wallet.connect(provider)
    );
  }
  
  // Rest of methods...
}

module.exports = { JITCircuitBreaker };
