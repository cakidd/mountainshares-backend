const { ethers } = require('ethers');

class SafetyStockManager {
  constructor(provider, wallet) {
    this.provider = provider;
    this.wallet = wallet;
    this.usdcContract = new ethers.Contract(
      '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      ['function balanceOf(address) view returns (uint256)', 'function transfer(address,uint256) returns (bool)'],
      wallet
    );
    this.minimumBuffer = ethers.utils.parseUnits('10', 6); // 10 USDC minimum
  }
  
  async checkSafetyStock() {
    const balance = await this.usdcContract.balanceOf(this.wallet.address);
    console.log('Safety stock balance:', ethers.utils.formatUnits(balance, 6), 'USDC');
    return balance;
  }
  
  async useSafetyStock(amount, recipient) {
    const balance = await this.checkSafetyStock();
    
    if (balance.lt(amount)) {
      throw new Error(`Insufficient safety stock: need ${ethers.utils.formatUnits(amount, 6)} USDC, have ${ethers.utils.formatUnits(balance, 6)} USDC`);
    }
    
    console.log('🛡️ Using safety stock for payment...');
    const tx = await this.usdcContract.transfer(recipient, amount);
    await tx.wait();
    
    // Alert if below minimum buffer
    const newBalance = await this.checkSafetyStock();
    if (newBalance.lt(this.minimumBuffer)) {
      console.log('⚠️ Safety stock below minimum - manual refill required');
    }
    
    return tx;
  }
}

module.exports = { SafetyStockManager };
