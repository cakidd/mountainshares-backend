const { ethers } = require('ethers');
const { JITCircuitBreaker } = require('./jit-circuit-breaker');
const { SafetyStockManager } = require('./safety-stock-manager');

class JITPaymentStrategy {
  constructor(provider, wallet) {
    this.provider = provider;
    this.wallet = wallet;
    this.circuitBreaker = new JITCircuitBreaker();
    this.safetyStock = new SafetyStockManager(provider, wallet);
    this.h4hContract = process.env.CONTRACT_ADDRESS;
  }
  
  async executePayment(totalPaid) {
    const usdcNeeded = ethers.utils.parseUnits(totalPaid.toString(), 6);
    const ethForSwap = ethers.utils.parseEther("0.001"); // ~$2.70 worth
    const minUSDCOut = usdcNeeded.mul(95).div(100); // 5% slippage tolerance
    
    console.log('🎯 JIT Payment Strategy executing...');
    console.log(`Amount needed: ${ethers.utils.formatUnits(usdcNeeded, 6)} USDC`);
    
    try {
      // Layer 1: JIT USDC Purchase
      await this.circuitBreaker.executeJITSwap(
        this.provider, 
        this.wallet, 
        ethForSwap, 
        minUSDCOut
      );
      
      console.log('✅ JIT USDC purchase successful');
      return { method: 'JIT', success: true };
      
    } catch (jitError) {
      console.log('⚠️ JIT failed, attempting safety stock...');
      
      try {
        // Layer 2: Safety Stock
        await this.safetyStock.useSafetyStock(usdcNeeded, this.h4hContract);
        console.log('✅ Safety stock payment successful');
        return { method: 'SAFETY_STOCK', success: true };
        
      } catch (safetyError) {
        // Layer 3: Manual Intervention Required
        console.error('🚨 All payment methods failed');
        console.error('JIT Error:', jitError.message);
        console.error('Safety Stock Error:', safetyError.message);
        
        // Alert operations team
        await this.alertOperations(totalPaid, { jitError, safetyError });
        
        return { 
          method: 'MANUAL_REQUIRED', 
          success: false, 
          errors: { jitError: jitError.message, safetyError: safetyError.message }
        };
      }
    }
  }
  
  async alertOperations(amount, errors) {
    console.log('📧 Alerting operations team...');
    // Could integrate with email, Slack, or monitoring systems
    const alert = {
      timestamp: new Date().toISOString(),
      amount: amount,
      errors: errors,
      action_required: 'Manual USDC funding needed'
    };
    
    // Log to file for operations review
    require('fs').appendFileSync('payment-alerts.log', JSON.stringify(alert) + '\n');
  }
}

module.exports = { JITPaymentStrategy };
