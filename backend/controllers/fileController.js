// backend/controllers/fileController.js
const File = require('../models/File');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { calculateFileHash, formatBytes } = require('../utils/fileUtils');
const blockchainService = require('../services/blockchainService');
const encryptionService = require('../utils/encryption');
const mlService = require('../services/mlService'); // <-- ML service
const riskAssessmentService = require('../services/riskAssessmentService'); // <-- access risk service
const fs = require('fs').promises;
const path = require('path');
const { sendEmail } = require('../config/email');
const emailTemplates = require('../utils/emailTemplates');

// Helper: compute Shannon entropy of a buffer
function calculateEntropy(buffer) {
    if (!buffer || buffer.length === 0) return 0;
    const byteCount = new Array(256).fill(0);
    for (const byte of buffer) {
        byteCount[byte] += 1;
    }
    const len = buffer.length;
    let entropy = 0;
    for (let i = 0; i < 256; i++) {
        if (byteCount[i] === 0) continue;
        const p = byteCount[i] / len;
        entropy -= p * Math.log2(p);
    }
    return entropy;
}

// Initialize blockchain service on startup (handle gracefully)
const initBlockchain = async () => {
    try {
        await blockchainService.initialize();
    } catch (error) {
        console.error('Blockchain initialization failed:', error.message);
    }
};
initBlockchain();

// @desc    Upload file with encryption + ML classification
// @route   POST /api/files/upload
// @access  Private
exports.uploadFile = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a file'
            });
        }

        // Read the uploaded file
        const fileBuffer = await fs.readFile(req.file.path);

        // Generate encryption key for this file
        const encryptionKey = encryptionService.generateFileKey();

        // Encrypt the file
        const { encryptedData, iv } = encryptionService.encryptFile(fileBuffer, encryptionKey);

        // Calculate hash of the encrypted file (for integrity)
        const fileHash = encryptionService.hashFile(encryptedData);

        // Save encrypted file
        const encryptedFilePath = req.file.path + '.enc';
        await fs.writeFile(encryptedFilePath, encryptedData);

        // Delete original unencrypted file
        await fs.unlink(req.file.path);

        // Check if file already exists (duplicate by hash)
        const existingFile = await File.findOne({
            fileHash,
            owner: req.user._id,
            status: 'active'
        });

        if (existingFile) {
            // Remove the encrypted file if it's a duplicate
            await fs.unlink(encryptedFilePath);

            return res.status(400).json({
                success: false,
                message: 'File already exists in your storage'
            });
        }

        // Try blockchain registration, but don't block upload if blockchain is unavailable
        let blockchainResult = { success: false, error: 'Blockchain registration skipped' };
        try {
            if (blockchainService.initialized) {
                blockchainResult = await blockchainService.uploadFile(
                    fileHash,
                    req.file.originalname,
                    req.file.size,
                    false // isPublic
                );
            } else {
                blockchainResult = { success: false, error: 'Blockchain service not initialized' };
            }
        } catch (blockchainError) {
            console.error('Blockchain upload error:', blockchainError);
            blockchainResult = {
                success: false,
                error: blockchainError.message
            };
        }

        const blockchainRegistered = !!blockchainResult.success;

        // Create file record with encryption details
        const file = await File.create({
            fileName: req.file.originalname,
            originalName: req.file.originalname,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            fileHash,
            filePath: encryptedFilePath,
            isEncrypted: true,
            encryptionKey: encryptionKey,
            encryptionIV: iv,
            blockchainFileId: blockchainRegistered ? blockchainResult.fileId : null,
            owner: req.user._id
        });

        // Log blockchain access only when registration succeeded
        if (blockchainRegistered && file.blockchainFileId && blockchainService.initialized) {
            try {
                await blockchainService.logFileAccess(
                    file.blockchainFileId,
                    'UPLOAD'
                );
            } catch (logAccessError) {
                console.error('Blockchain access log failed:', logAccessError.message);
            }
        }

        // ========== ML FILE CLASSIFICATION AND ACCESS RISK DETECTION (NEW) ==========
        try {
            const entropy = calculateEntropy(fileBuffer);
            const ext = path.extname(req.file.originalname).toLowerCase();

            const fileStats = {
                size: req.file.size / 1024,
                file_size_kb: req.file.size / 1024,
                entropy: entropy,
                is_executable: ['.exe', '.dll', '.jar', '.js', '.vbs'].includes(ext) ? 1 : 0,
                is_archive: ['.zip', '.rar', '.7z', '.tar'].includes(ext) ? 1 : 0,
                is_doc: ['.docx', '.pdf', '.xlsx', '.txt', '.csv'].includes(ext) ? 1 : 0,
                extension: ext.slice(1).toLowerCase()
            };

            const mlResult = await mlService.classifyFile(fileStats);
            file.riskScore = mlResult.probability * 100;
            file.riskLevel = file.riskScore > 66 ? 'high' : file.riskScore > 33 ? 'medium' : 'low';
            file.lastRiskAssessment = new Date();
            await file.save();

            if (mlResult.malicious === 1 && mlResult.probability > 0.7) {
                await ActivityLog.create({
                    user: req.user._id,
                    action: 'MALICIOUS_FILE_DETECTED',
                    resourceType: 'file',
                    resourceId: file._id,
                    details: {
                        fileName: file.fileName,
                        probability: mlResult.probability,
                        recommendation: 'Review file'
                    }
                });
                console.warn(`⚠️ Suspicious file uploaded: ${file.fileName} (prob: ${mlResult.probability})`);
                // Optionally send admin alert email here
            }

            // Access-related risk assessment
            const accessContext = {
                fileId: file._id,
                userId: req.user._id,
                fileStats: {
                    size: file.fileSize / 1024,
                    entropy: entropy,
                    is_executable: ['.exe', '.dll', '.jar', '.js', '.vbs'].includes(ext) ? 1 : 0,
                    is_archive: ['.zip', '.rar', '.7z', '.tar'].includes(ext) ? 1 : 0,
                    is_doc: ['.docx', '.pdf', '.xlsx', '.txt', '.csv'].includes(ext) ? 1 : 0,
                    extension: ext.slice(1).toLowerCase()
                },
                sharingStats: null,
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                accessTime: new Date(),
                userDownloadCount: 0,
                fileDownloadCount: file.downloads,
                isFirstAccess: true,
                deviceNew: 0,
                sensitiveFile: (file.mimeType && (file.mimeType.includes('pdf') || file.mimeType.includes('doc'))) ? true : false
            };

            const riskResult = await riskAssessmentService.computeAccessRisk(accessContext);
            file.riskScore = riskResult.riskScore;
            file.riskLevel = riskResult.riskLevel;
            file.lastRiskAssessment = new Date();
            await file.save();
        } catch (mlError) {
            console.error('ML classification failed:', mlError.message);
            // Do not block upload
        }

        // Log activity
        try {
            await ActivityLog.create({
                user: req.user._id,
                action: 'UPLOAD_FILE',
                resourceType: 'file',
                resourceId: file._id,
                details: {
                    fileName: file.fileName,
                    fileSize: file.fileSize,
                    isEncrypted: true,
                    blockchainFileId: file.blockchainFileId,
                    transactionHash: blockchainResult.transactionHash || null,
                    blockchainRegistered,
                    blockchainError: blockchainRegistered ? null : blockchainResult.error
                },
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            });
        } catch (activityLogError) {
            console.error('Activity log failed:', activityLogError.message);
        }

        res.status(201).json({
            success: true,
            message: blockchainRegistered
                ? 'File uploaded, encrypted, and registered on blockchain successfully'
                : 'File uploaded and encrypted successfully (blockchain registration pending)',
            file: {
                id: file._id,
                fileName: file.fileName,
                fileSize: formatBytes(file.fileSize),
                fileHash: file.fileHash,
                isEncrypted: true,
                blockchainFileId: file.blockchainFileId,
                transactionHash: blockchainResult.transactionHash || null,
                createdAt: file.createdAt
            },
            blockchain: {
                registered: blockchainRegistered,
                error: blockchainRegistered ? null : blockchainResult.error
            }
        });
    } catch (error) {
        // Clean up file if error occurs
        if (req.file) {
            try {
                if (await fs.access(req.file.path).catch(() => false)) {
                    await fs.unlink(req.file.path);
                }
                if (await fs.access(req.file.path + '.enc').catch(() => false)) {
                    await fs.unlink(req.file.path + '.enc');
                }
            } catch (unlinkError) {
                console.error('Error deleting file:', unlinkError);
            }
        }
        next(error);
    }
};

// @desc    Get all files for user
// @route   GET /api/files
// @access  Private
exports.getAllFiles = async (req, res, next) => {
    try {
        const files = await File.find({
            owner: req.user._id,
            status: 'active'
        }).sort('-createdAt');

        res.json({
            success: true,
            count: files.length,
            files: files.map(file => ({
                id: file._id,
                fileName: file.fileName,
                fileSize: formatBytes(file.fileSize),
                mimeType: file.mimeType,
                isPublic: file.isPublic,
                isEncrypted: file.isEncrypted || false,
                integrityVerified: file.integrityVerified,
                fileHash: file.fileHash,
                blockchainFileId: file.blockchainFileId,
                downloads: file.downloads,
                createdAt: file.createdAt,
                sharedWith: file.sharedWith.length
            }))
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get file details
// @route   GET /api/files/:fileId
// @access  Private
exports.getFileDetails = async (req, res, next) => {
    try {
        const file = await File.findOne({
            _id: req.params.fileId,
            $or: [
                { owner: req.user._id },
                { 'sharedWith.user': req.user._id }
            ],
            status: 'active'
        }).populate('owner', 'name email')
          .populate('sharedWith.user', 'name email');

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        res.json({
            success: true,
            file: {
                id: file._id,
                fileName: file.fileName,
                originalName: file.originalName,
                fileSize: formatBytes(file.fileSize),
                mimeType: file.mimeType,
                fileHash: file.fileHash,
                owner: file.owner,
                isPublic: file.isPublic,
                isEncrypted: file.isEncrypted === true,
                sharedWith: file.sharedWith,
                downloads: file.downloads,
                createdAt: file.createdAt,
                updatedAt: file.updatedAt
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete file
// @route   DELETE /api/files/:fileId
// @access  Private
exports.deleteFile = async (req, res, next) => {
    try {
        const file = await File.findOne({
            _id: req.params.fileId,
            owner: req.user._id,
            status: 'active'
        });

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Optionally delete physical encrypted file
        try {
            if (file.filePath && await fs.access(file.filePath).catch(() => false)) {
                await fs.unlink(file.filePath);
            }
        } catch (unlinkError) {
            console.error('Error deleting physical file:', unlinkError);
        }

        // Soft delete - update status
        file.status = 'deleted';
        await file.save();

        // Log activity
        await ActivityLog.create({
            user: req.user._id,
            action: 'DELETE_FILE',
            resourceType: 'file',
            resourceId: file._id,
            details: {
                fileName: file.fileName,
                wasEncrypted: file.isEncrypted
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        res.json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Share file with user (with abnormal sharing detection)
// @route   POST /api/files/:fileId/share
// @access  Private
exports.shareFile = async (req, res, next) => {
    try {
        const { email, accessType } = req.body;
        const resolvedAccessType = accessType || 'view';
        const normalizedEmail = email?.trim().toLowerCase();

        if (!normalizedEmail) {
            return res.status(400).json({
                success: false,
                message: 'Please provide user email'
            });
        }

        // Find user to share with
        const userToShare = await User.findOne({ email: normalizedEmail });
        if (!userToShare) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Don't allow sharing with self
        if (userToShare._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot share file with yourself'
            });
        }

        const file = await File.findOne({
            _id: req.params.fileId,
            owner: req.user._id,
            status: 'active'
        });

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // ========== ML ABNORMAL SHARING DETECTION (NEW) ==========
        try {
            // Get recent shares in the last hour
            const recentShares = await ActivityLog.find({
                user: req.user._id,
                action: 'SHARE_FILE',
                createdAt: { $gte: new Date(Date.now() - 3600000) } // last hour
            });

            // Build sharing stats
            const sharingStats = {
                files_shared: recentShares.length + 1, // current share + previous
                recipients: 1, // only one recipient per share in this endpoint
                avg_size_kb: file.fileSize / 1024,
                sensitive: (file.mimeType && (file.mimeType.includes('pdf') || file.mimeType.includes('doc'))) ? 1 : 0,
                device_new: 0, // you can track based on IP/user-agent history
                time_anomaly: (new Date().getHours() < 6 || new Date().getHours() > 22) ? 1 : 0
            };

            const mlResult = await mlService.detectAbnormalSharing(sharingStats);
            if (mlResult.abnormal === 1 && mlResult.risk === 'high') {
                // Log alert
                await ActivityLog.create({
                    user: req.user._id,
                    action: 'ABNORMAL_SHARING_DETECTED',
                    resourceType: 'file',
                    resourceId: file._id,
                    details: {
                        fileName: file.fileName,
                        risk: mlResult.risk,
                        sharedWith: userToShare.email,
                        probability: mlResult.probability
                    }
                });
                console.warn(`⚠️ Abnormal sharing detected: ${file.fileName} -> ${userToShare.email} (risk: ${mlResult.risk})`);
                // Optionally block the share or ask for 2FA here
                // For now we proceed, but you could return an error.
            }
        } catch (mlError) {
            console.error('ML abnormal sharing detection failed:', mlError.message);
            // Do not block the share
        }

        // Check if already shared with user
        const alreadyShared = file.sharedWith.find(
            s => s.user.toString() === userToShare._id.toString()
        );

        if (alreadyShared) {
            return res.status(400).json({
                success: false,
                message: 'File already shared with this user'
            });
        }

        // Share on blockchain only if both users can be represented on-chain
        let blockchainResult = { success: false, skipped: true };
        if (userToShare.ethereumAddress && file.blockchainFileId && blockchainService.initialized) {
            const accessTypeMap = { view: 0, download: 1 };
            try {
                blockchainResult = await blockchainService.shareFile(
                    file.blockchainFileId,
                    userToShare.ethereumAddress,
                    accessTypeMap[resolvedAccessType] || 0
                );

                if (!blockchainResult.success) {
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to share file on blockchain',
                        error: blockchainResult.error
                    });
                }

                // Log blockchain access
                await blockchainService.logFileAccess(
                    file.blockchainFileId,
                    'SHARE'
                );
            } catch (blockchainError) {
                console.error('Blockchain share error:', blockchainError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to share file on blockchain',
                    error: blockchainError.message
                });
            }
        }

        // Add to shared list in database
        file.sharedWith.push({
            user: userToShare._id,
            accessType: resolvedAccessType
        });

        await file.save();

        // Log activity
        await ActivityLog.create({
            user: req.user._id,
            action: 'SHARE_FILE',
            resourceType: 'file',
            resourceId: file._id,
            details: {
                fileName: file.fileName,
                sharedWith: userToShare.email,
                accessType: resolvedAccessType,
                isEncrypted: file.isEncrypted,
                blockchainShared: blockchainResult.success,
                transactionHash: blockchainResult.success ? blockchainResult.transactionHash : null
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        // Send email notification
        try {
            if (userToShare.email) {
                const template = emailTemplates.fileShared(
                    file.fileName,
                    req.user.name,
                    resolvedAccessType
                );
                await sendEmail({
                    to: userToShare.email,
                    subject: template.subject,
                    html: template.html
                });
            }
        } catch (emailError) {
            console.error('Failed to send share notification email:', emailError);
            // Do not block response
        }

        res.json({
            success: true,
            message: 'File shared successfully',
            sharedWith: {
                email: userToShare.email,
                accessType: resolvedAccessType
            },
            blockchain: blockchainResult.success ? {
                transactionHash: blockchainResult.transactionHash
            } : null
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Revoke file access
// @route   POST /api/files/:fileId/revoke/:userId
// @access  Private
exports.revokeAccess = async (req, res, next) => {
    try {
        const file = await File.findOne({
            _id: req.params.fileId,
            owner: req.user._id,
            status: 'active'
        });

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Remove user from shared list
        file.sharedWith = file.sharedWith.filter(
            s => s.user.toString() !== req.params.userId
        );

        await file.save();

        // Log activity
        await ActivityLog.create({
            user: req.user._id,
            action: 'REVOKE_ACCESS',
            resourceType: 'file',
            resourceId: file._id,
            details: {
                fileName: file.fileName,
                revokedFrom: req.params.userId
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        res.json({
            success: true,
            message: 'Access revoked successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Download file with decryption
// @route   GET /api/files/:fileId/download
// @access  Private
exports.downloadFile = async (req, res, next) => {
    try {
        const file = await File.findOne({
            _id: req.params.fileId,
            $or: [
                { owner: req.user._id },
                { 'sharedWith.user': req.user._id }
            ],
            status: 'active'
        }).select('+encryptionKey +encryptionIV'); // Include encryption fields

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found or access denied'
            });
        }

        const isEncryptedFile = file.isEncrypted === true;

        // Check if user has download permission
        if (file.owner.toString() !== req.user._id.toString()) {
            const shareInfo = file.sharedWith.find(
                s => s.user.toString() === req.user._id.toString()
            );
            if (shareInfo && shareInfo.accessType !== 'download') {
                return res.status(403).json({
                    success: false,
                    message: 'You only have view permission, cannot download'
                });
            }
        }

        // Check if physical file exists
        let fileExists = true;
        try {
            await fs.access(file.filePath);
        } catch (err) {
            fileExists = false;
        }

        if (!fileExists) {
            file.status = 'compromised';
            file.integrityVerified = false;
            await file.save({ validateBeforeSave: false });

            return res.status(404).json({
                success: false,
                message: 'File not found on server'
            });
        }

        // Read encrypted file
        const encryptedData = await fs.readFile(file.filePath);

        // Verify integrity before decryption
        const currentHash = encryptionService.hashFile(encryptedData);
        if (currentHash !== file.fileHash) {
            // File has been tampered with
            file.integrityVerified = false;
            file.status = 'compromised';
            await file.save({ validateBeforeSave: false });

            await ActivityLog.create({
                user: req.user._id,
                action: 'TAMPER_DETECTED',
                resourceType: 'file',
                resourceId: file._id,
                details: {
                    fileName: file.fileName,
                    action: 'download_attempt',
                    originalHash: file.fileHash,
                    currentHash: currentHash
                },
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            });

            return res.status(409).json({
                success: false,
                message: 'File integrity compromised. Cannot download.'
            });
        }

        let filePayload = encryptedData;

        if (isEncryptedFile) {
            if (!file.encryptionIV || !file.encryptionKey) {
                return res.status(500).json({
                    success: false,
                    message: 'Encrypted file metadata is incomplete'
                });
            }

            // Decrypt encrypted file before download
            try {
                filePayload = encryptionService.decryptFile(
                    encryptedData,
                    file.encryptionIV,
                    file.encryptionKey
                );
            } catch (decryptError) {
                console.error('Decryption error:', decryptError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to decrypt file'
                });
            }
        }

        // Increment download count
        file.downloads += 1;
        await file.save({ validateBeforeSave: false });

        // Log activity
        await ActivityLog.create({
            user: req.user._id,
            action: 'DOWNLOAD_FILE',
            resourceType: 'file',
            resourceId: file._id,
            details: {
                fileName: file.fileName,
                wasEncrypted: isEncryptedFile,
                integrityVerified: true
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        // Send decrypted file
        res.setHeader('Content-Type', file.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
        res.send(filePayload);

    } catch (error) {
        console.error('Download error:', error);
        next(error);
    }
};

// @desc    Verify file integrity with encryption
// @route   GET /api/files/:fileId/verify
// @access  Private
exports.verifyFileIntegrity = async (req, res, next) => {
    try {
        const file = await File.findOne({
            _id: req.params.fileId,
            $or: [
                { owner: req.user._id },
                { 'sharedWith.user': req.user._id }
            ],
            status: { $in: ['active', 'compromised'] }
        }).select('+encryptionKey +encryptionIV');

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        const isEncryptedFile = file.isEncrypted === true;

        // Check if physical file exists
        let fileExists = true;
        try {
            await fs.access(file.filePath);
        } catch (err) {
            fileExists = false;
        }

        if (!fileExists) {
            // Update file status
            file.status = 'compromised';
            file.integrityVerified = false;
            await file.save({ validateBeforeSave: false });

            return res.status(200).json({
                success: true,
                fileId: file._id,
                fileName: file.fileName,
                isIntact: false,
                isEncrypted: isEncryptedFile,
                message: 'File not found on server',
                verification: {
                    local: false,
                    error: 'File missing from storage',
                    encryption: isEncryptedFile ? 'AES-256-CBC' : 'none',
                    blockchain: {
                        checked: false,
                        verified: null,
                        error: null
                    }
                }
            });
        }

        // Read encrypted file
        const encryptedData = await fs.readFile(file.filePath);

        // Calculate current hash
        const currentHash = encryptionService.hashFile(encryptedData);
        const localVerified = currentHash === file.fileHash;

        // Verify with blockchain if available
        let blockchainChecked = false;
        let blockchainVerified = null;
        let blockchainDetails = null;
        let blockchainError = null;

        if (file.blockchainFileId && blockchainService.initialized) {
            try {
                const blockchainResult = await blockchainService.verifyFile(
                    file.blockchainFileId,
                    file.fileHash
                );

                if (blockchainResult) {
                    if (blockchainResult.exists === false) {
                        // Treat missing blockchain records as unavailable metadata,
                        // not automatic tampering of local file content.
                        blockchainError = 'File not found on blockchain';
                        blockchainChecked = false;
                        blockchainVerified = null;
                    } else {
                        blockchainChecked = true;
                        blockchainVerified = blockchainResult.isValid;
                        blockchainDetails = {
                            blockchainHash: blockchainResult.storedHash,
                            timestamp: blockchainResult.timestamp,
                            owner: blockchainResult.owner,
                            fileName: blockchainResult.fileName
                        };
                    }
                } else {
                    blockchainError = 'Blockchain verification returned null';
                }
            } catch (error) {
                console.error('Blockchain verification error:', error);
                blockchainError = error.message || 'Blockchain verification failed';
                blockchainChecked = false;
            }
        } else if (file.blockchainFileId && !blockchainService.initialized) {
            blockchainError = 'Blockchain service not available';
        }

        // Determine if file is intact
        let isIntact;
        if (blockchainChecked) {
            isIntact = localVerified && blockchainVerified === true;
        } else {
            isIntact = localVerified;
        }

        // Update file integrity status
        file.integrityVerified = isIntact;
        file.lastVerified = new Date();

        if (isIntact && file.status !== 'active') {
            file.status = 'active';
        }

        if (!isIntact && file.status !== 'compromised') {
            file.status = 'compromised';

            // Log tamper detection
            await ActivityLog.create({
                user: req.user._id,
                action: 'TAMPER_DETECTED',
                resourceType: 'file',
                resourceId: file._id,
                details: {
                    fileName: file.fileName,
                    originalHash: file.fileHash,
                    currentHash,
                    isEncrypted: isEncryptedFile,
                    blockchainHash: blockchainDetails?.blockchainHash,
                    blockchainError: blockchainError
                },
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            });

            // Log on blockchain if available
            if (file.blockchainFileId && blockchainService.initialized) {
                try {
                    await blockchainService.logFileAccess(
                        file.blockchainFileId,
                        'TAMPER_DETECTED'
                    );
                } catch (logError) {
                    console.error('Failed to log tamper on blockchain:', logError);
                }
            }
        }

        await file.save({ validateBeforeSave: false });

        // Log verification activity
        try {
            await ActivityLog.create({
                user: req.user._id,
                action: 'VERIFY_INTEGRITY',
                resourceType: 'file',
                resourceId: file._id,
                details: {
                    fileName: file.fileName,
                    localVerified,
                    blockchainChecked,
                    blockchainVerified,
                    blockchainError,
                    isIntact,
                    isEncrypted: isEncryptedFile
                },
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            });
        } catch (activityLogError) {
            console.error('Activity log failed:', activityLogError.message);
        }

        // Prepare response message
        let message = '';
        if (isIntact) {
            if (blockchainChecked && blockchainVerified) {
                message = `File integrity verified on both local storage and blockchain (${isEncryptedFile ? 'AES-256 encrypted' : 'unencrypted'})`;
            } else if (!blockchainChecked) {
                message = `File integrity verified locally (blockchain verification not available) (${isEncryptedFile ? 'AES-256 encrypted' : 'unencrypted'})`;
            } else {
                message = 'File integrity verified';
            }
        } else {
            if (!localVerified) {
                message = 'File has been tampered with (hash mismatch)';
            } else if (blockchainChecked && !blockchainVerified) {
                message = 'File hash does not match blockchain record';
            } else {
                message = 'File integrity check failed';
            }
        }

        res.json({
            success: true,
            fileId: file._id,
            fileName: file.fileName,
            isIntact,
            isEncrypted: isEncryptedFile,
            message,
            verification: {
                local: {
                    verified: localVerified,
                    currentHash: currentHash,
                    storedHash: file.fileHash
                },
                blockchain: {
                    checked: blockchainChecked,
                    verified: blockchainVerified,
                    error: blockchainError,
                    details: blockchainDetails
                },
                encryption: isEncryptedFile ? {
                    algorithm: 'AES-256-CBC',
                    keyDerivation: 'PBKDF2'
                } : null
            },
            fileStatus: {
                integrityVerified: file.integrityVerified,
                status: file.status,
                lastVerified: file.lastVerified
            }
        });
    } catch (error) {
        console.error('Verification error:', error);
        if (error.code === 'ENOENT') {
            return res.status(404).json({
                success: false,
                message: 'Stored file not found on server'
            });
        }
        next(error);
    }
};