import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";

const { ARBITRUM_RPC_URL = "", PRIVATE_KEY = "" } = process.env;

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    arbitrumSepolia: {
      url: ARBITRUM_RPC_URL,   // https://sepolia-rollup.arbitrum.io/rpc
      accounts: [PRIVATE_KEY], // 0x… private key
      chainId: 421614
    }
  }
};

export default config;
