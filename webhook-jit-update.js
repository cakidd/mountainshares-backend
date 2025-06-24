// Replace your USDC transfer section with JIT purchase
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  try {
    const amount = 1;
    const total = 1.36;
    
    console.log('Debug values:', { amount, total });
    
    // NEW: JIT USDC Purchase
    console.log('🔄 Executing JIT USDC purchase...');
    
    const usdcNeeded = ethers.utils.parseUnits(total.toString(), 6);
    const ethForSwap = ethers.utils.parseEther("0.001"); // ~$2.70 worth
    const minUSDCOut = usdcNeeded.mul(95).div(100); // 5% slippage
    
    // Execute ETH → USDC swap
    await swapETHForUSDC(provider, wallet, ethForSwap, minUSDCOut);
    
    console.log('About to call H4H contract...');
    
    // Your existing H4H contract call
    const contractCallTx = await contract.loadGiftCard({
      value: ethers.utils.parseEther("0.0005")
    });
    await contractCallTx.wait();
    
    console.log('✅ JIT USDC purchase and token minting completed!');
    res.status(200).send('JIT Success');
    
  } catch (error) {
    console.error('JIT webhook error:', error);
    res.status(500).send('JIT Error');
  }
});
