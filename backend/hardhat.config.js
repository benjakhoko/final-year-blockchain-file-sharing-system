require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      chainId: 1337  // Changed from 5777 to 1337
    },
    ganache: {
      url: "http://127.0.0.1:7545",
      chainId: 1337  // Changed from 5777 to 1337
    }
  },
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
    cache: "./cache"
  }
};