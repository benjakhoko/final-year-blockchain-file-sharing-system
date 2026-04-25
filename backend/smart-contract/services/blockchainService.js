const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');
const blockchainConfig = require('../config/blockchain');

class BlockchainService {
    constructor() {
        this.web3 = null;
        this.contract = null;
        this.account = null;
        this.initialized = false;
    }

    normalizeFileId(value) {
        if (value === undefined || value === null) {
            return null;
        }

        try {
            const normalized = typeof value === 'bigint'
                ? value.toString()
                : String(value).trim();

            if (!/^\d+$/.test(normalized)) {
                return null;
            }

            const parsed = BigInt(normalized);
            if (parsed <= 0n) {
                return null;
            }

            return parsed.toString();
        } catch (error) {
            return null;
        }
    }

    async resolveLatestFileId() {
        const fallbackMethods = ['getFileCount', 'fileCounter'];

        for (const methodName of fallbackMethods) {
            if (!this.contract?.methods?.[methodName]) {
                continue;
            }

            try {
                const value = await this.contract.methods[methodName]().call();
                const resolved = this.normalizeFileId(value);
                if (resolved) {
                    return resolved;
                }
            } catch (error) {
                // Try next fallback method
            }
        }

        return null;
    }

    getGasWithBuffer(gasEstimate) {
        const gas = typeof gasEstimate === 'bigint'
            ? gasEstimate
            : BigInt(Math.ceil(Number(gasEstimate)));

        return ((gas * 120n) / 100n).toString();
    }

    async initialize() {
        try {
            // Read contract ABI from known build output locations
            const contractPaths = [
                path.join(__dirname, '../smart-contract/FileSharing.json'),
                path.join(__dirname, '../../artifacts/contracts/FileSharing.sol/FileSharing.json'),
                path.join(__dirname, '../build/contracts/FileSharing.json')
            ];

            let contractJson;
            for (const contractPath of contractPaths) {
                if (fs.existsSync(contractPath)) {
                    contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
                    console.log(`✅ Found contract ABI at: ${contractPath}`);
                    break;
                }
            }

            if (contractJson?.abi) {
                blockchainConfig.contractABI = contractJson.abi;
            } else {
                console.error('❌ Contract ABI not found');
                return false;
            }

            // Initialize Web3
            const network = blockchainConfig.development.network;
            this.web3 = new Web3(network);
            
            // Check connection
            const isConnected = await this.web3.eth.net.isListening();
            if (!isConnected) {
                throw new Error('Unable to connect to Ethereum network');
            }

            // Set up account from private key
            if (blockchainConfig.development.privateKey) {
                const privateKey = blockchainConfig.development.privateKey.startsWith('0x') 
                    ? blockchainConfig.development.privateKey 
                    : '0x' + blockchainConfig.development.privateKey;
                
                const account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
                this.web3.eth.accounts.wallet.add(account);
                this.account = account.address;
            }

            // Initialize contract
            if (blockchainConfig.development.contractAddress && blockchainConfig.contractABI.length > 0) {
                this.contract = new this.web3.eth.Contract(
                    blockchainConfig.contractABI,
                    blockchainConfig.development.contractAddress
                );
                // Validate that CONTRACT_ADDRESS points to deployed contract bytecode.
                const deployedCode = await this.web3.eth.getCode(blockchainConfig.development.contractAddress);
                if (!deployedCode || deployedCode === '0x') {
                    throw new Error(
                        `No contract bytecode found at CONTRACT_ADDRESS ${blockchainConfig.development.contractAddress}`
                    );
                }
                console.log(`✅ Contract initialized at: ${blockchainConfig.development.contractAddress}`);
            } else {
                console.error('❌ Contract address or ABI missing');
                return false;
            }

            this.initialized = true;
            console.log('✅ Blockchain service initialized successfully');
            console.log(`📡 Network: ${network}`);
            console.log(`👤 Account: ${this.account || 'Not set'}`);
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize blockchain service:', error.message);
            this.initialized = false;
            return false;
        }
    }

    async uploadFile(fileHash, fileName, fileSize, isPublic = false) {
        try {
            if (!this.initialized || !this.contract) {
                throw new Error('Blockchain service not initialized');
            }

            const gas = await this.contract.methods.uploadFile(fileHash, fileName, fileSize, isPublic)
                .estimateGas({ from: this.account });

            const result = await this.contract.methods.uploadFile(fileHash, fileName, fileSize, isPublic)
                .send({
                    from: this.account,
                    gas: this.getGasWithBuffer(gas),
                    gasPrice: blockchainConfig.development.gasPrice
                });

            // Get fileId from event - handle different event structures
            const fileUploadedEvent = result.events?.FileUploaded;
            const eventCandidates = [
                fileUploadedEvent?.returnValues?.fileId,
                fileUploadedEvent?.returnValues?.id,
                fileUploadedEvent?.returnValues?.[0],
                fileUploadedEvent?.returnValues?.['0']
            ];

            let fileId = null;
            for (const candidate of eventCandidates) {
                const resolved = this.normalizeFileId(candidate);
                if (resolved) {
                    fileId = resolved;
                    break;
                }
            }

            if (!fileId) {
                fileId = await this.resolveLatestFileId();
            }

            if (!fileId) {
                return {
                    success: false,
                    error: 'Transaction mined but could not resolve blockchain file ID',
                    transactionHash: result.transactionHash,
                    blockNumber: result.blockNumber
                };
            }

            return {
                success: true,
                transactionHash: result.transactionHash,
                fileId: fileId,
                blockNumber: result.blockNumber
            };
        } catch (error) {
            console.error('Error uploading file to blockchain:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // FIXED: Enhanced getFileDetails with better error handling and multiple return format support
    async getFileDetails(fileId) {
        try {
            if (!this.initialized || !this.contract) {
                throw new Error('Blockchain service not initialized');
            }

            const normalizedFileId = this.normalizeFileId(fileId);
            if (!normalizedFileId) {
                return {
                    success: false,
                    error: `Invalid blockchain file ID: ${fileId}`
                };
            }

            console.log(`Getting file details for ID: ${normalizedFileId}`);
            
            // Try different method names that might exist in your contract
            let result;
            let methodUsed = null;
            
            // Try getFileDetails first
            try {
                result = await this.contract.methods.getFileDetails(normalizedFileId).call();
                methodUsed = 'getFileDetails';
                console.log('Using getFileDetails method');
            } catch (error) {
                console.log('getFileDetails failed, trying getFile...');
                // Try getFile if getFileDetails doesn't exist
                try {
                    result = await this.contract.methods.getFile(normalizedFileId).call();
                    methodUsed = 'getFile';
                    console.log('Using getFile method');
                } catch (error2) {
                    console.log('getFile failed, trying files mapping...');
                    // Try accessing the files mapping directly
                    try {
                        result = await this.contract.methods.files(normalizedFileId).call();
                        methodUsed = 'files';
                        console.log('Using files mapping');
                    } catch (error3) {
                        throw new Error(`No compatible method found to get file details: ${error.message}`);
                    }
                }
            }
            
            // Handle different return formats
            let fileDetails;
            
            if (methodUsed === 'getFileDetails') {
                // Handle getFileDetails return format (might be array or object)
                if (Array.isArray(result)) {
                    fileDetails = {
                        id: result[0] || normalizedFileId,
                        fileHash: result[1] || '',
                        fileName: result[2] || '',
                        fileSize: result[3] || '0',
                        owner: result[4] || '',
                        timestamp: result[5] ? new Date(Number(result[5]) * 1000) : new Date(),
                        isActive: result[6] || true,
                        isPublic: result[7] || false
                    };
                } else if (typeof result === 'object' && result !== null) {
                    // Handle object return
                    fileDetails = {
                        id: result.id || result.fileId || normalizedFileId,
                        fileHash: result.fileHash || result[1] || '',
                        fileName: result.fileName || result[2] || '',
                        fileSize: result.fileSize || result[3] || '0',
                        owner: result.owner || result[4] || '',
                        timestamp: result.timestamp ? new Date(Number(result.timestamp) * 1000) : 
                                   (result[5] ? new Date(Number(result[5]) * 1000) : new Date()),
                        isActive: result.isActive !== undefined ? result.isActive : 
                                 (result[6] !== undefined ? result[6] : true),
                        isPublic: result.isPublic !== undefined ? result.isPublic : 
                                 (result[7] !== undefined ? result[7] : false)
                    };
                }
            } else if (methodUsed === 'getFile') {
                // Handle getFile return format
                if (Array.isArray(result)) {
                    fileDetails = {
                        id: result[0] || normalizedFileId,
                        fileHash: result[1] || '',
                        fileName: result[2] || '',
                        fileSize: result[3] || '0',
                        owner: result[4] || '',
                        timestamp: result[5] ? new Date(Number(result[5]) * 1000) : new Date(),
                        isActive: result[6] || true,
                        isPublic: result[7] || false
                    };
                } else {
                    fileDetails = {
                        id: result.id || result.fileId || normalizedFileId,
                        fileHash: result.fileHash || '',
                        fileName: result.fileName || '',
                        fileSize: result.fileSize || '0',
                        owner: result.owner || '',
                        timestamp: result.timestamp ? new Date(Number(result.timestamp) * 1000) : new Date(),
                        isActive: result.isActive !== undefined ? result.isActive : true,
                        isPublic: result.isPublic !== undefined ? result.isPublic : false
                    };
                }
            } else if (methodUsed === 'files') {
                // Handle files mapping (struct return)
                fileDetails = {
                    id: normalizedFileId,
                    fileHash: result.fileHash || result[0] || '',
                    fileName: result.fileName || result[1] || '',
                    fileSize: result.fileSize || result[2] || '0',
                    owner: result.owner || result[3] || '',
                    timestamp: result.timestamp ? new Date(Number(result.timestamp) * 1000) : 
                               (result[4] ? new Date(Number(result[4]) * 1000) : new Date()),
                    isActive: result.isActive !== undefined ? result.isActive : 
                             (result[5] !== undefined ? result[5] : true),
                    isPublic: result.isPublic !== undefined ? result.isPublic : 
                             (result[6] !== undefined ? result[6] : false)
                };
            }
            
            console.log('File details retrieved successfully:', {
                id: fileDetails.id,
                fileName: fileDetails.fileName,
                owner: fileDetails.owner
            });
            
            return {
                success: true,
                file: fileDetails
            };
        } catch (error) {
            console.error('Error getting file details:', error);
            return {
                success: false,
                error: error.message,
                details: error.data || error
            };
        }
    }

    // FIXED: Enhanced verifyFile method for file integrity verification
    async verifyFile(fileId, fileHash) {
        try {
            if (!this.initialized || !this.contract) {
                throw new Error('Blockchain service not initialized');
            }

            const normalizedFileId = this.normalizeFileId(fileId);
            if (!normalizedFileId) {
                return {
                    isValid: false,
                    message: 'Invalid blockchain file ID',
                    exists: false
                };
            }

            const fileCountResult = await this.getFileCount();
            if (fileCountResult.success) {
                try {
                    if (BigInt(normalizedFileId) > BigInt(fileCountResult.count)) {
                        return {
                            isValid: false,
                            message: `File ID ${normalizedFileId} is not present on blockchain`,
                            exists: false
                        };
                    }
                } catch (error) {
                    // Continue if count comparison fails unexpectedly
                }
            }

            console.log(`Verifying file on blockchain - ID: ${normalizedFileId}, Hash: ${fileHash}`);
            
            // First, check if the file exists on blockchain
            const fileDetails = await this.getFileDetails(normalizedFileId);
            
            if (!fileDetails.success) {
                console.log('File not found on blockchain');
                return {
                    isValid: false,
                    message: 'File not found on blockchain',
                    exists: false
                };
            }
            
            // Check if the file exists and is active
            if (!fileDetails.file || !fileDetails.file.isActive) {
                console.log('File is not active on blockchain');
                return {
                    isValid: false,
                    message: 'File is not active on blockchain',
                    exists: false
                };
            }
            
            // Compare the stored hash with the provided hash
            const storedHash = fileDetails.file.fileHash;
            const isValid = storedHash === fileHash;
            
            console.log(`Blockchain verification result: ${isValid ? 'VALID' : 'INVALID'}`);
            console.log(`Stored hash: ${storedHash}`);
            console.log(`Provided hash: ${fileHash}`);
            
            return {
                isValid,
                message: isValid ? 'File matches blockchain record' : 'File does not match blockchain record',
                fileId: fileDetails.file.id,
                fileName: fileDetails.file.fileName,
                fileSize: fileDetails.file.fileSize,
                owner: fileDetails.file.owner,
                timestamp: fileDetails.file.timestamp,
                exists: true
            };
        } catch (error) {
            console.error('Error verifying file on blockchain:', error);
            return {
                isValid: false,
                message: 'Blockchain verification failed',
                error: error.message,
                exists: false
            };
        }
    }

    async shareFile(fileId, sharedWithAddress, accessType = 0) {
        try {
            if (!this.initialized || !this.contract) {
                throw new Error('Blockchain service not initialized');
            }

            const gas = await this.contract.methods.shareFile(fileId, sharedWithAddress, accessType)
                .estimateGas({ from: this.account });

            const result = await this.contract.methods.shareFile(fileId, sharedWithAddress, accessType)
                .send({
                    from: this.account,
                    gas: this.getGasWithBuffer(gas)
                });

            const fileSharedEvent = result.events?.FileShared;
            let returnedFileId = fileId;

            if (fileSharedEvent?.returnValues?.fileId !== undefined) {
                returnedFileId = fileSharedEvent.returnValues.fileId;
            } else if (fileSharedEvent?.returnValues?.[0] !== undefined) {
                returnedFileId = fileSharedEvent.returnValues[0];
            }

            return {
                success: true,
                transactionHash: result.transactionHash,
                fileId: returnedFileId
            };
        } catch (error) {
            console.error('Error sharing file on blockchain:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async revokeAccess(fileId, userAddress) {
        try {
            if (!this.initialized || !this.contract) {
                throw new Error('Blockchain service not initialized');
            }

            const gas = await this.contract.methods.revokeAccess(fileId, userAddress)
                .estimateGas({ from: this.account });

            const result = await this.contract.methods.revokeAccess(fileId, userAddress)
                .send({
                    from: this.account,
                    gas: this.getGasWithBuffer(gas)
                });

            const accessRevokedEvent = result.events?.AccessRevoked;
            let returnedFileId = fileId;

            if (accessRevokedEvent?.returnValues?.fileId !== undefined) {
                returnedFileId = accessRevokedEvent.returnValues.fileId;
            } else if (accessRevokedEvent?.returnValues?.[0] !== undefined) {
                returnedFileId = accessRevokedEvent.returnValues[0];
            }

            return {
                success: true,
                transactionHash: result.transactionHash,
                fileId: returnedFileId
            };
        } catch (error) {
            console.error('Error revoking access on blockchain:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async logFileAccess(fileId, action) {
        try {
            if (!this.initialized || !this.contract) {
                throw new Error('Blockchain service not initialized');
            }

            const gas = await this.contract.methods.logFileAccess(fileId, action)
                .estimateGas({ from: this.account });

            const result = await this.contract.methods.logFileAccess(fileId, action)
                .send({
                    from: this.account,
                    gas: this.getGasWithBuffer(gas)
                });

            return {
                success: true,
                transactionHash: result.transactionHash
            };
        } catch (error) {
            console.error('Error logging file access:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async checkAccess(fileId, userAddress) {
        try {
            if (!this.initialized || !this.contract) {
                throw new Error('Blockchain service not initialized');
            }

            const hasAccess = await this.contract.methods.checkAccess(fileId, userAddress).call();
            
            return {
                success: true,
                hasAccess
            };
        } catch (error) {
            console.error('Error checking access:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async deleteFile(fileId) {
        try {
            if (!this.initialized || !this.contract) {
                throw new Error('Blockchain service not initialized');
            }

            const gas = await this.contract.methods.deleteFile(fileId)
                .estimateGas({ from: this.account });

            const result = await this.contract.methods.deleteFile(fileId)
                .send({
                    from: this.account,
                    gas: this.getGasWithBuffer(gas)
                });

            const fileDeletedEvent = result.events?.FileDeleted;
            let returnedFileId = fileId;

            if (fileDeletedEvent?.returnValues?.fileId !== undefined) {
                returnedFileId = fileDeletedEvent.returnValues.fileId;
            } else if (fileDeletedEvent?.returnValues?.[0] !== undefined) {
                returnedFileId = fileDeletedEvent.returnValues[0];
            }

            return {
                success: true,
                transactionHash: result.transactionHash,
                fileId: returnedFileId
            };
        } catch (error) {
            console.error('Error deleting file on blockchain:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getUserFiles(userAddress) {
        try {
            if (!this.initialized || !this.contract) {
                throw new Error('Blockchain service not initialized');
            }

            const fileIds = await this.contract.methods.getUserFiles(userAddress).call();
            
            return {
                success: true,
                fileIds: fileIds.map(id => id.toString())
            };
        } catch (error) {
            console.error('Error getting user files:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getFileSharedWith(fileId) {
        try {
            if (!this.initialized || !this.contract) {
                throw new Error('Blockchain service not initialized');
            }

            const sharedWith = await this.contract.methods.getFileSharedWith(fileId).call();
            
            return {
                success: true,
                sharedWith
            };
        } catch (error) {
            console.error('Error getting file shared with list:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async setFilePublic(fileId, isPublic) {
        try {
            if (!this.initialized || !this.contract) {
                throw new Error('Blockchain service not initialized');
            }

            const gas = await this.contract.methods.setFilePublic(fileId, isPublic)
                .estimateGas({ from: this.account });

            const result = await this.contract.methods.setFilePublic(fileId, isPublic)
                .send({
                    from: this.account,
                    gas: this.getGasWithBuffer(gas)
                });

            return {
                success: true,
                transactionHash: result.transactionHash
            };
        } catch (error) {
            console.error('Error setting file public status:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getFileCount() {
        try {
            if (!this.initialized || !this.contract) {
                throw new Error('Blockchain service not initialized');
            }

            const count = await this.contract.methods.getFileCount().call();
            
            return {
                success: true,
                count: count.toString()
            };
        } catch (error) {
            console.error('Error getting file count:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new BlockchainService();
