// Add this error handling around your contract call:
try {
  console.log('About to call H4H contract...');
  console.log('Amount:', amount);
  console.log('Contract address:', process.env.CONTRACT_ADDRESS);
  
  const tx = await contract.loadGiftCard({ 
    value: ethers.parseEther(amount.toString()),
    gasLimit: 500000  // Add gas limit
  });
  
  console.log('Transaction sent:', tx.hash);
  await tx.wait();
  console.log('Transaction confirmed!');
  
} catch (error) {
  console.error('Contract call failed:', error.message);
  // Don't crash - return success to Stripe
  return res.json({received: true, error: error.message});
}
