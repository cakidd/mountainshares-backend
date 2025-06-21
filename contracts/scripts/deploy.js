const { ethers } = require("hardhat");
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

async function main() {
  const addresses = [
    "0xD8bb25076e61B5a382e17171b48d8E0952b5b4f3",
    "0xYourSecondAddressHere"
  ];
  
  const leaves = addresses.map(addr => keccak256(addr));
  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const root = tree.getHexRoot();

  // Deploy contract
  const KYC = await ethers.getContractFactory("KYC");
  const kyc = await KYC.deploy(root);
  
  // FIX: Use waitForDeployment() instead of deployed()
  await kyc.waitForDeployment();
  
  // FIX: Use getAddress() instead of .address
  console.log("KYC deployed to:", await kyc.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
