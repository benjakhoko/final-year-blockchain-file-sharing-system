const File = require('../models/File');
const ActivityLog = require('../models/ActivityLog');
const AIAlert = require('../models/AIAlert');
const mlService = require('../services/mlService');
const crypto = require('crypto');
const fs = require('fs').promises;

// Helper: Calculate Shannon entropy of a file
const calculateEntropy = (buffer) => {
    const frequencies = {};
    const length = buffer.length;

    for (let i = 0; i < length; i++) {
        const byte = buffer[i];
        frequencies[byte] = (frequencies[byte] || 0) + 1;
    }

    let entropy = 0;
    for (const freq of Object.values(frequencies)) {
        const p = freq / length;
        entropy -= p * Math.log2(p);
    }

    return entropy;
};

// Helper: Determine file type flags
const getFileTypeFlags = (extension) => {
    const ext = extension.toLowerCase();
    return {
        is_executable: ['.exe', '.dll', '.jar', '.js', '.vbs', '.bat', '.cmd', '.ps1', '.sh'].includes(ext) ? 1 : 0,
        is_archive: ['.zip', '.rar', '.7z', '.tar', '.gz'].includes(ext) ? 1 : 0,
        is_doc: ['.docx', '.pdf', '.xlsx', '.txt', '.csv', '.doc', '.xls'].includes(ext) ? 1 : 0
    };
};

// @desc    Analyze a single file with AI
// @route   GET /api/ai/analyze/:fileId
// @access  Private
exports.analyzeFile = async (req, res, next) => {
    try {
        const file = await File.findOne({
            _id: req.params.fileId,
            $or: [
                { owner: req.user._id },
                { 'sharedWith.user': req.user._id }
            ],
            status: 'active'
        });

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Read file for entropy calculation
        let entropy = 5.0;
        try {
            const fileBuffer = await fs.readFile(file.filePath);
            entropy = calculateEntropy(fileBuffer);
        } catch (err) {
            console.error('Error calculating entropy:', err.message);
        }

        const extension = file.originalName.split('.').pop() || 'txt';
        const typeFlags = getFileTypeFlags(`.${extension}`);

        // Prepare features for ML
        const fileStats = {
            file_size_kb: file.fileSize / 1024,
            entropy: parseFloat(entropy.toFixed(2)),
            extension: extension.toLowerCase(),
            is_executable: typeFlags.is_executable,
            is_archive: typeFlags.is_archive,
            is_doc: typeFlags.is_doc
        };

        // Call ML service
        const mlResult = await mlService.classifyFile(fileStats);

        // Determine risk level
        let riskLevel = 'safe';
        let recommendation = 'File appears safe';

        if (mlResult.malicious === 1) {
            if (mlResult.probability > 0.8) {
                riskLevel = 'critical';
                recommendation = '⚠️ HIGH RISK: This file is likely malicious. Do not open or share.';
            } else if (mlResult.probability > 0.6) {
                riskLevel = 'high';
                recommendation = '⚠️ WARNING: This file has suspicious characteristics. Review carefully.';
            } else {
                riskLevel = 'medium';
                recommendation = '⚡ Caution: This file may be suspicious. Verify the source.';
            }
        } else if (mlResult.probability > 0.3) {
            riskLevel = 'low';
            recommendation = 'File appears safe but proceed with normal caution.';
        }

        // Create an alert if the file is suspicious
        if (mlResult.malicious === 1 && mlResult.probability > 0.6) {
            const existingAlert = await AIAlert.findOne({
                file: file._id,
                user: req.user._id,
                type: 'malicious_file',
                status: 'active'
            });

            if (!existingAlert) {
                await AIAlert.create({
                    user: req.user._id,
                    file: file._id,
                    type: 'malicious_file',
                    severity: riskLevel,
                    title: 'Suspicious File Detected',
                    message: `File "${file.fileName}" flagged with ${(mlResult.probability * 100).toFixed(1)}% confidence`,
                    details: {
                        probability: mlResult.probability,
                        entropy: fileStats.entropy,
                        extension: extension,
                        fileSize: file.fileSize
                    },
                    status: 'active'
                });
            }
        }

        // Log the analysis
        await ActivityLog.create({
            user: req.user._id,
            action: 'VERIFY_INTEGRITY',
            resourceType: 'file',
            resourceId: file._id,
            details: {
                action: 'AI_ANALYSIS',
                malicious: mlResult.malicious,
                probability: mlResult.probability,
                riskLevel
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        res.json({
            success: true,
            file: {
                id: file._id,
                fileName: file.fileName,
                fileSize: file.fileSize,
                mimeType: file.mimeType,
                extension: extension
            },
            analysis: {
                malicious: mlResult.malicious === 1,
                probability: mlResult.probability,
                riskLevel,
                recommendation,
                features: fileStats,
                mlServiceAvailable: !mlResult.error
            }
        });
    } catch (error) {
        console.error('Analyze file error:', error);
        next(error);
    }
};

// @desc    Analyze all user's files
// @route   GET /api/ai/analyze-all
// @access  Private
exports.analyzeAllFiles = async (req, res, next) => {
    try {
        const files = await File.find({
            owner: req.user._id,
            status: 'active'
        }).limit(50); // Limit for performance

        const results = [];
        let safeCount = 0;
        let suspiciousCount = 0;
        let criticalCount = 0;

        for (const file of files) {
            let entropy = 5.0;
            try {
                const fileBuffer = await fs.readFile(file.filePath);
                entropy = calculateEntropy(fileBuffer);
            } catch (err) {
                console.error('Entropy error:', err.message);
            }

            const extension = file.originalName.split('.').pop() || 'txt';
            const typeFlags = getFileTypeFlags(`.${extension}`);

            const fileStats = {
                file_size_kb: file.fileSize / 1024,
                entropy: parseFloat(entropy.toFixed(2)),
                extension: extension.toLowerCase(),
                is_executable: typeFlags.is_executable,
                is_archive: typeFlags.is_archive,
                is_doc: typeFlags.is_doc
            };

            const mlResult = await mlService.classifyFile(fileStats);

            let riskLevel = 'safe';
            if (mlResult.malicious === 1 && mlResult.probability > 0.8) {
                riskLevel = 'critical';
                criticalCount++;
            } else if (mlResult.malicious === 1 && mlResult.probability > 0.6) {
                riskLevel = 'high';
                suspiciousCount++;
            } else if (mlResult.probability > 0.3) {
                riskLevel = 'low';
                safeCount++;
            } else {
                safeCount++;
            }

            results.push({
                id: file._id,
                fileName: file.fileName,
                fileSize: file.fileSize,
                extension: extension,
                malicious: mlResult.malicious === 1,
                probability: mlResult.probability,
                riskLevel,
                entropy: fileStats.entropy
            });
        }

        // Sort by risk (critical first)
        const riskOrder = { critical: 0, high: 1, medium: 2, low: 3, safe: 4 };
        results.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);

        res.json({
            success: true,
            summary: {
                totalAnalyzed: results.length,
                safe: safeCount,
                suspicious: suspiciousCount,
                critical: criticalCount
            },
            results
        });
    } catch (error) {
        console.error('Analyze all files error:', error);
        next(error);
    }
};

// @desc    Get user's AI alerts
// @route   GET /api/ai/alerts
// @access  Private
exports.getMyAlerts = async (req, res, next) => {
    try {
        const alerts = await AIAlert.find({
            user: req.user._id
        })
        .populate('file', 'fileName fileSize')
        .sort('-createdAt')
        .limit(50);

        const unreadCount = await AIAlert.countDocuments({
            user: req.user._id,
            status: 'active'
        });

        res.json({
            success: true,
            count: alerts.length,
            unreadCount,
            alerts
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get AI statistics for current user
// @route   GET /api/ai/stats
// @access  Private
exports.getAIStats = async (req, res, next) => {
    try {
        const totalAlerts = await AIAlert.countDocuments({ user: req.user._id });
        const activeAlerts = await AIAlert.countDocuments({
            user: req.user._id,
            status: 'active'
        });

        const byType = await AIAlert.aggregate([
            { $match: { user: req.user._id } },
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);

        const bySeverity = await AIAlert.aggregate([
            { $match: { user: req.user._id, status: 'active' } },
            { $group: { _id: '$severity', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            stats: {
                totalAlerts,
                activeAlerts,
                byType,
                bySeverity
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Check ML service health
// @route   GET /api/ai/health
// @access  Private
exports.checkHealth = async (req, res, next) => {
    try {
        const health = await mlService.checkHealth();
        res.json({
            success: true,
            mlService: health
        });
    } catch (error) {
        res.json({
            success: false,
            mlService: { status: 'unavailable' },
            error: error.message
        });
    }
};

// @desc    Admin: Get all alerts
// @route   GET /api/ai/admin/alerts
// @access  Private/Admin
exports.getAllAlerts = async (req, res, next) => {
    try {
        const { status, severity, type, page = 1, limit = 20 } = req.query;
        const query = {};

        if (status) query.status = status;
        if (severity) query.severity = severity;
        if (type) query.type = type;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const alerts = await AIAlert.find(query)
            .populate('user', 'name email')
            .populate('file', 'fileName fileSize')
            .sort('-createdAt')
            .skip(skip)
            .limit(parseInt(limit));

        const total = await AIAlert.countDocuments(query);

        res.json({
            success: true,
            count: alerts.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            alerts
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Admin: Resolve alert
// @route   PUT /api/ai/admin/alerts/:alertId/resolve
// @access  Private/Admin
exports.resolveAlert = async (req, res, next) => {
    try {
        const { resolution } = req.body;

        const alert = await AIAlert.findById(req.params.alertId);
        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }

        alert.status = 'resolved';
        alert.resolution = resolution || 'Reviewed by admin';
        alert.resolvedBy = req.user._id;
        alert.resolvedAt = new Date();
        await alert.save();

        res.json({
            success: true,
            message: 'Alert resolved successfully',
            alert
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Admin: Get suspicious files
// @route   GET /api/ai/admin/suspicious-files
// @access  Private/Admin
exports.getSuspiciousFiles = async (req, res, next) => {
    try {
        const alerts = await AIAlert.find({
            type: 'malicious_file',
            status: 'active'
        })
        .populate('user', 'name email')
        .populate('file', 'fileName fileSize filePath')
        .sort('-createdAt');

        res.json({
            success: true,
            count: alerts.length,
            alerts
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Admin: Get AI stats
// @route   GET /api/ai/admin/stats
// @access  Private/Admin
exports.getAdminAIStats = async (req, res, next) => {
    try {
        const totalAlerts = await AIAlert.countDocuments();
        const activeAlerts = await AIAlert.countDocuments({ status: 'active' });
        const resolvedAlerts = await AIAlert.countDocuments({ status: 'resolved' });

        const byType = await AIAlert.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);

        const bySeverity = await AIAlert.aggregate([
            { $match: { status: 'active' } },
            { $group: { _id: '$severity', count: { $sum: 1 } } }
        ]);

        const recentAlerts = await AIAlert.find()
            .populate('user', 'name email')
            .populate('file', 'fileName')
            .sort('-createdAt')
            .limit(10);

        res.json({
            success: true,
            stats: {
                total: totalAlerts,
                active: activeAlerts,
                resolved: resolvedAlerts,
                byType,
                bySeverity,
                recentAlerts
            }
        });
    } catch (error) {
        next(error);
    }
};