const { ethers } = require("hardhat");

async function main() {
  const kyc = await ethers.getContractAt(
    "KYC", 
    "0x8CFF221E2e6327560E2a6EeE3CD552fe26402bd2"
  );
  const root = await kyc.merkleRoot();
  console.log(root);
}

main().catch(console.error);
