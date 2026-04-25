module.exports = {
    // For local development with Ganache or Hardhat
    development: {
        network: process.env.ETHEREUM_NETWORK || 'http://localhost:8545',
        contractAddress: process.env.CONTRACT_ADDRESS,
        privateKey: process.env.PRIVATE_KEY,
        gasLimit: 3000000,
        gasPrice: 20000000000, // 20 Gwei
    },
    
    // For testnet (Sepolia, Goerli, etc.)
    testnet: {
        network: process.env.ETHEREUM_NETWORK_TESTNET,
        contractAddress: process.env.CONTRACT_ADDRESS_TESTNET,
        privateKey: process.env.PRIVATE_KEY,
        gasLimit: 3000000,
        gasPrice: 20000000000,
    },
    
    // Contract ABI (will be updated after compilation)
    contractABI: []
};