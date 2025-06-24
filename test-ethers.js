const { ethers } = require('ethers');

console.log('Testing ethers.js setup...');

try {
  console.log('1. Testing provider...');
  const provider = new ethers.providers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
  console.log('✅ Provider created successfully');
  
  console.log('2. Testing contract...');
  const abi = ["function totalSupply() view returns (uint256)"];
  const address = "0xE8A9c6fFE6b2344147D886EcB8608C5F7863B20D";
  const contract = new ethers.Contract(address, abi, provider);
  console.log('✅ Contract created successfully');
  
  console.log('3. Testing wallet...');
  if (process.env.PRIVATE_KEY) {
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    console.log('✅ Wallet created successfully');
    
    const contractWithSigner = contract.connect(wallet);
    console.log('✅ Contract with signer created successfully');
  } else {
    console.log('⚠️ No PRIVATE_KEY environment variable');
  }
  
} catch (error) {
  console.error('❌ Ethers.js test failed:', error.message);
  console.error('Full error:', error);
}
