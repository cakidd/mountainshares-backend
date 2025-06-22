// Use the complete H4H ABI from the search results
const H4H_CONTRACT_ABI = [/* paste the complete ABI from search results */];

// In your webhook, call the loadGiftCard function
const tx = await contract.loadGiftCard({ 
  value: ethers.parseEther(amountInDollars.toString()) 
});
