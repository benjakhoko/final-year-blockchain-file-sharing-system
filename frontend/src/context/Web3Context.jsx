import React, { createContext, useState, useContext, useEffect } from 'react';
import Web3 from 'web3';
import toast from 'react-hot-toast';

const Web3Context = createContext();

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider = ({ children }) => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || '0x9f9276F6541881CAE49a7010131Cb3058eA46733';
  
  // Contract ABI - Replace with your actual ABI from the artifacts
  const contractABI = [
    // Add your contract ABI here from artifacts/contracts/FileSharing.json
    // This is a simplified version - you'll need to copy the actual ABI
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_fileId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "_user",
          "type": "address"
        }
      ],
      "name": "checkAccess",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_fileId",
          "type": "uint256"
        }
      ],
      "name": "getFileDetails",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "fileHash",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "fileName",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "fileSize",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "fileOwner",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "isActive",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "isPublic",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_fileId",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "_action",
          "type": "string"
        }
      ],
      "name": "logFileAccess",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_fileId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "_sharedWith",
          "type": "address"
        },
        {
          "internalType": "enum FileSharing.AccessType",
          "name": "_accessType",
          "type": "uint8"
        }
      ],
      "name": "shareFile",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_fileHash",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_fileName",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "_fileSize",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "_isPublic",
          "type": "bool"
        }
      ],
      "name": "uploadFile",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

  useEffect(() => {
    checkMetaMask();
  }, []);

  const checkMetaMask = () => {
    if (window.ethereum) {
      setIsMetaMaskInstalled(true);
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('Please install MetaMask to use blockchain features');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    try {
      setLoading(true);
      
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const account = accounts[0];
      setAccount(account);

      // Get chain ID
      const chainId = await window.ethereum.request({ 
        method: 'eth_chainId' 
      });
      setChainId(parseInt(chainId, 16));

      // Initialize contract
      const web3Instance = new Web3(window.ethereum);
      const contractInstance = new web3Instance.eth.Contract(
        contractABI,
        contractAddress
      );
      setContract(contractInstance);

      // Setup event listeners
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      toast.success('Wallet connected successfully!');
      
      // Update user's Ethereum address in backend
      await updateUserEthereumAddress(account);
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error(error.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const updateUserEthereumAddress = async (address) => {
    try {
      await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ethereumAddress: address })
      });
    } catch (error) {
      console.error('Error updating Ethereum address:', error);
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      // User disconnected
      setAccount(null);
      setContract(null);
      toast.info('Wallet disconnected');
    } else {
      setAccount(accounts[0]);
      toast.info('Account changed');
    }
  };

  const handleChainChanged = (chainId) => {
    setChainId(parseInt(chainId, 16));
    toast.info('Network changed');
    window.location.reload();
  };

  const disconnectWallet = () => {
    setAccount(null);
    setContract(null);
    toast.success('Wallet disconnected');
  };

  const verifyFileOnBlockchain = async (fileId, fileHash, options = {}) => {
    const { notifyOnError = true } = options;

    if (!contract || !account) {
      if (notifyOnError) {
        toast.error('Please connect your wallet first');
      }
      return null;
    }

    try {
      setLoading(true);
      const details = await contract.methods.getFileDetails(fileId).call();

      const blockchainHash = details.fileHash || details[1];
      const owner = details.fileOwner || details[4];
      const timestampRaw = details.timestamp || details[5];
      const isActive = details.isActive ?? details[6];
      const matches = blockchainHash === fileHash;
      
      return {
        success: true,
        matches,
        isValid: matches,
        blockchainHash,
        owner,
        timestamp: new Date(Number(timestampRaw) * 1000).toLocaleString(),
        isActive
      };
    } catch (error) {
      console.error('Error verifying file:', error);
      if (notifyOnError) {
        toast.error('Failed to verify file on blockchain');
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logAccess = async (fileId, action) => {
    if (!contract || !account) {
      toast.error('Please connect your wallet first');
      return false;
    }

    try {
      await contract.methods.logFileAccess(fileId, action).send({
        from: account
      });
      return true;
    } catch (error) {
      console.error('Error logging access:', error);
      return false;
    }
  };

  const value = {
    web3,
    account,
    chainId,
    contract,
    loading,
    isMetaMaskInstalled,
    connectWallet,
    disconnectWallet,
    verifyFileOnBlockchain,
    logAccess
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};
