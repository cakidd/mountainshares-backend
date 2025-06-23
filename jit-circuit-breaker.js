const { ethers } = require('ethers');

class JITCircuitBreaker {
  constructor() {
    this.failureCount = 0;
    this.threshold = 3;
    this.state = 'CLOSED';
    this.lastFailureTime = null;
    this.timeout = 60000; // 1 minute
  }
  
  async executeJITSwap(provider, wallet, ethAmount, minUSDCOut) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
        this.failureCount = 0;
      } else {
        throw new Error('Circuit breaker OPEN - using safety stock');
      }
    }
    
    try {
      console.log('🔄 JIT Circuit Breaker: Attempting USDC swap...');
      
      const swapRouter = new ethers.Contract(
        '0xE592427A0AEce92De3Edee1F18E0157C05861564',
        ["function exactInputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160)) payable returns (uint256)"],
        wallet
      );
      
      const swapParams = {
        tokenIn: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',  // WETH
        tokenOut: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC
        fee: 3000,
        recipient: wallet.address,
        deadline: Math.floor(Date.now() / 1000) + 1200,
        amountIn: ethAmount,
        amountOutMinimum: minUSDCOut,
        sqrtPriceLimitX96: 0
      };
      
      const tx = await swapRouter.exactInputSingle(swapParams, {
        value: ethAmount,
        gasLimit: 300000
      });
      
      await tx.wait();
      this.onSuccess();
      console.log('✅ JIT swap successful!');
      return tx;
      
    } catch (error) {
      this.onFailure();
      console.error('❌ JIT swap failed:', error.message);
      throw error;
    }
  }
  
  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      console.log('🚨 Circuit breaker OPEN - switching to safety mechanisms');
    }
  }
}

module.exports = { JITCircuitBreaker };
