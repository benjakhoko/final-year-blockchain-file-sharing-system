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
  const [activeContractAddress, setActiveContractAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || '0x9f9276F6541881CAE49a7010131Cb3058eA46733';
  const knownLocalAddresses = [
    '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'
  ];
  
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
    },
    {
      "inputs": [],
      "name": "getFileCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "files",
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
          "name": "owner",
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
    }
  ];

  const normalizeFileId = (value) => {
    if (value === undefined || value === null) return null;
    const normalized = String(value).trim();
    if (!/^\d+$/.test(normalized)) return null;
    try {
      return BigInt(normalized) > 0n ? normalized : null;
    } catch {
      return null;
    }
  };

  const getErrorMessage = (error) => {
    return (
      error?.reason ||
      error?.message ||
      error?.data?.message ||
      error?.data?.originalError?.message ||
      'Unknown blockchain error'
    );
  };

  const isMissingFileError = (message) => {
    const normalized = String(message || '').toLowerCase();
    return (
      normalized.includes('file does not exist') ||
      normalized.includes('execution reverted') ||
      normalized.includes('missing revert data')
    );
  };

  const isInvalidContractCallError = (message) => {
    const normalized = String(message || '').toLowerCase();
    return (
      normalized.includes("returned values aren't valid") ||
      normalized.includes('could not decode result data') ||
      normalized.includes('invalid response')
    );
  };

  const toLocaleTimestamp = (timestampRaw) => {
    const value = Number(timestampRaw || 0);
    if (!Number.isFinite(value) || value <= 0) {
      return null;
    }
    return new Date(value * 1000).toLocaleString();
  };

  const resolveContractInstance = async (web3Instance, preferredAddress = null) => {
    if (!web3Instance) return null;

    const candidates = [preferredAddress, contractAddress, ...knownLocalAddresses]
      .filter((address) => typeof address === 'string' && address.trim().length > 0);

    const uniqueCandidates = candidates.filter((address, index) => {
      return candidates.findIndex((item) => item.toLowerCase() === address.toLowerCase()) === index;
    });

    for (const address of uniqueCandidates) {
      if (!web3Instance.utils.isAddress(address)) {
        continue;
      }

      try {
        const code = await web3Instance.eth.getCode(address);
        if (code && code !== '0x') {
          return {
            instance: new web3Instance.eth.Contract(contractABI, address),
            address
          };
        }
      } catch (error) {
        console.error(`Error checking contract code at ${address}:`, error);
      }
    }

    return null;
  };

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
      const resolvedContract = await resolveContractInstance(web3Instance, contractAddress);
      if (!resolvedContract) {
        setContract(null);
        setActiveContractAddress(null);
        toast.error('No deployed FileSharing contract found on this network');
      } else {
        setContract(resolvedContract.instance);
        setActiveContractAddress(resolvedContract.address);
      }

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
      setActiveContractAddress(null);
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
    setActiveContractAddress(null);
    toast.success('Wallet disconnected');
  };

  const verifyFileOnBlockchain = async (fileId, fileHash, options = {}) => {
    const { notifyOnError = true } = options;

    if (!account) {
      if (notifyOnError) {
        toast.error('Please connect your wallet first');
      }
      return null;
    }

    if (!contract) {
      if (notifyOnError) {
        toast.error('Blockchain contract is not available on this network');
      }
      return null;
    }

    try {
      setLoading(true);
      const normalizedFileId = normalizeFileId(fileId);
      if (!normalizedFileId) {
        if (notifyOnError) {
          toast.error('Invalid blockchain file ID');
        }
        return null;
      }

      let activeContract = contract;
      let resolvedAddress = activeContractAddress || activeContract?.options?.address || contractAddress;

      if (web3 && resolvedAddress) {
        const deployedCode = await web3.eth.getCode(resolvedAddress);
        if (!deployedCode || deployedCode === '0x') {
          const resolvedContract = await resolveContractInstance(web3, resolvedAddress);
          if (resolvedContract) {
            activeContract = resolvedContract.instance;
            resolvedAddress = resolvedContract.address;
            setContract(activeContract);
            setActiveContractAddress(resolvedAddress);
          }
        }
      }

      if (activeContract?.methods?.getFileCount) {
        try {
          const totalFiles = await activeContract.methods.getFileCount().call();
          if (BigInt(normalizedFileId) > BigInt(totalFiles)) {
            return {
              success: false,
              exists: false,
              matches: false,
              isValid: false,
              message: 'File is not present on the current blockchain contract'
            };
          }
        } catch (countError) {
          // Continue with direct record lookup if count endpoint is unavailable.
        }
      }

      let details;
      try {
        details = await activeContract.methods.getFileDetails(normalizedFileId).call();
      } catch (detailsError) {
        const detailsErrorMessage = getErrorMessage(detailsError);
        if (activeContract?.methods?.files) {
          try {
            details = await activeContract.methods.files(normalizedFileId).call();
          } catch (mappingError) {
            const mappingErrorMessage = getErrorMessage(mappingError);
            if (isMissingFileError(mappingErrorMessage)) {
              return {
                success: false,
                exists: false,
                matches: false,
                isValid: false,
                message: 'File not found on blockchain'
              };
            }
            if (isInvalidContractCallError(mappingErrorMessage)) {
              return {
                success: false,
                exists: false,
                matches: false,
                isValid: false,
                message: 'No deployed FileSharing contract found on current wallet network'
              };
            }
            throw mappingError;
          }
        } else if (isMissingFileError(detailsErrorMessage)) {
          return {
            success: false,
            exists: false,
            matches: false,
            isValid: false,
            message: 'File not found on blockchain'
          };
        } else if (isInvalidContractCallError(detailsErrorMessage)) {
          return {
            success: false,
            exists: false,
            matches: false,
            isValid: false,
            message: 'No deployed FileSharing contract found on current wallet network'
          };
        } else {
          throw detailsError;
        }
      }

      const blockchainHash = details.fileHash || details[1];
      const owner = details.fileOwner || details.owner || details[4];
      const timestampRaw = details.timestamp || details[5];
      const isActive = details.isActive ?? details[6];

      if (!blockchainHash || Number(timestampRaw || 0) === 0) {
        return {
          success: false,
          exists: false,
          matches: false,
          isValid: false,
          message: 'File not found on blockchain'
        };
      }

      const matches = blockchainHash === fileHash;
      
      return {
        success: true,
        exists: true,
        matches,
        isValid: matches,
        blockchainHash,
        owner,
        timestamp: toLocaleTimestamp(timestampRaw),
        isActive
      };
    } catch (error) {
      console.error('Error verifying file:', error);
      const errorMessage = getErrorMessage(error);

      if (isMissingFileError(errorMessage)) {
        return {
          success: false,
          exists: false,
          matches: false,
          isValid: false,
          message: 'File not found on blockchain'
        };
      }

      if (isInvalidContractCallError(errorMessage)) {
        return {
          success: false,
          exists: false,
          matches: false,
          isValid: false,
          message: 'No deployed FileSharing contract found on current wallet network'
        };
      }

      if (notifyOnError) {
        toast.error('Failed to verify file on blockchain');
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logAccess = async (fileId, action) => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return false;
    }

    if (!contract) {
      toast.error('Blockchain contract is not available on this network');
      return false;
    }

    try {
      const normalizedFileId = normalizeFileId(fileId);
      if (!normalizedFileId) {
        return false;
      }

      let activeContract = contract;
      let resolvedAddress = activeContractAddress || activeContract?.options?.address || contractAddress;

      if (web3 && resolvedAddress) {
        const deployedCode = await web3.eth.getCode(resolvedAddress);
        if (!deployedCode || deployedCode === '0x') {
          const resolvedContract = await resolveContractInstance(web3, resolvedAddress);
          if (resolvedContract) {
            activeContract = resolvedContract.instance;
            setContract(activeContract);
            setActiveContractAddress(resolvedContract.address);
          }
        }
      }

      await activeContract.methods.logFileAccess(normalizedFileId, action).send({
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
    activeContractAddress,
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
