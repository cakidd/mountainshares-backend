import { ethers } from "hardhat";

async function main() {
  const Comp = await ethers.deployContract("MountainSharesComplianceFramework");
  await Comp.waitForDeployment();
  console.log("ComplianceFramework deployed to:", Comp.target);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
