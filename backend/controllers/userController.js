const User = require('../models/User');
const File = require('../models/File');
const ActivityLog = require('../models/ActivityLog');
const { formatBytes } = require('../utils/fileUtils');

// @desc    Get files shared with user
// @route   GET /api/users/shared-files
// @access  Private
exports.getSharedFiles = async (req, res, next) => {
    try {
        const files = await File.find({
            'sharedWith.user': req.user._id,
            status: 'active'
        })
        .populate('owner', 'name email');

        const sharedFiles = files.map((file) => {
            const sharedAccess = file.sharedWith.find(
                (entry) => entry.user.toString() === req.user._id.toString()
            );

            return {
                id: file._id,
                fileName: file.originalName || file.fileName,
                fileSize: formatBytes(file.fileSize),
                mimeType: file.mimeType,
                owner: file.owner,
                createdAt: file.createdAt,
                accessType: sharedAccess?.accessType || 'view',
                blockchainFileId: file.blockchainFileId || null
            };
        });

        res.json({
            success: true,
            count: sharedFiles.length,
            files: sharedFiles
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get user's activity logs
// @route   GET /api/users/activity-logs
// @access  Private
exports.getActivityLogs = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const logs = await ActivityLog.find({ user: req.user._id })
            .sort('-createdAt')
            .skip(skip)
            .limit(limit);

        const total = await ActivityLog.countDocuments({ user: req.user._id });

        res.json({
            success: true,
            logs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get user's files
// @route   GET /api/users/files
// @access  Private
exports.getUserFiles = async (req, res, next) => {
    try {
        const files = await File.find({ 
            owner: req.user._id,
            status: 'active'
        }).sort('-createdAt');

        res.json({
            success: true,
            count: files.length,
            files
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Check file integrity
// @route   GET /api/users/files/:fileId/integrity
// @access  Private
exports.checkFileIntegrity = async (req, res, next) => {
    try {
        const file = await File.findOne({
            _id: req.params.fileId,
            owner: req.user._id
        });

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Here you would verify the file hash with blockchain
        // For now, return the stored hash
        res.json({
            success: true,
            fileId: file._id,
            fileName: file.fileName,
            storedHash: file.fileHash,
            verified: file.integrityVerified,
            lastVerified: file.lastVerified
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private
exports.getUserStats = async (req, res, next) => {
    try {
        const totalFiles = await File.countDocuments({ 
            owner: req.user._id,
            status: 'active'
        });

        const sharedFiles = await File.countDocuments({
            owner: req.user._id,
            'sharedWith.0': { $exists: true },
            status: 'active'
        });

        const totalDownloads = await File.aggregate([
            { $match: { owner: req.user._id } },
            { $group: { _id: null, total: { $sum: '$downloads' } } }
        ]);

        const recentActivities = await ActivityLog.find({ user: req.user._id })
            .sort('-createdAt')
            .limit(5);

        res.json({
            success: true,
            stats: {
                totalFiles,
                sharedFiles,
                totalDownloads: totalDownloads[0]?.total || 0,
                recentActivities
            }
        });
    } catch (error) {
        next(error);
    }
};
