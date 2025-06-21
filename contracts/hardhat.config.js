require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

module.exports = {
  solidity: {
    compilers: [
      { version: "0.8.28" }
    ]
  },
  networks: {
    arbitrumOne: {
      url: "https://arb1.arbitrum.io/rpc",
      chainId: 42161,
      accounts: [
        process.env.PRIVATE_KEY.startsWith('0x') 
          ? process.env.PRIVATE_KEY 
          : '0x' + process.env.PRIVATE_KEY
      ]
    }
  },
  etherscan: {
    apiKey: {
      arbitrumOne: process.env.ARBISCAN_API_KEY
    },
    customChains: [
      {
        network: "arbitrumOne",
        chainId: 42161,
        urls: {
          apiURL: "https://api.arbiscan.io/api",
          browserURL: "https://arbiscan.io/"
        }
      }
    ]
  }
};
