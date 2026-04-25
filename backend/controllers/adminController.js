const User = require('../models/User');
const File = require('../models/File');
const ActivityLog = require('../models/ActivityLog');
const Feedback = require('../models/Feedback');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const users = await User.find().select('-password').skip(skip).limit(limit);
        const total = await User.countDocuments();

        res.json({
            success: true,
            count: users.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            users
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get user details
// @route   GET /api/admin/users/:userId
// @access  Private/Admin
exports.getUserDetails = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get user stats
        const fileCount = await File.countDocuments({ owner: user._id });
        const sharedCount = await File.countDocuments({ 
            owner: user._id,
            'sharedWith.0': { $exists: true }
        });

        res.json({
            success: true,
            user: {
                ...user.toObject(),
                stats: {
                    totalFiles: fileCount,
                    sharedFiles: sharedCount
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Toggle user status
// @route   PUT /api/admin/users/:userId/status
// @access  Private/Admin
exports.toggleUserStatus = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.json({
            success: true,
            message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
            isActive: user.isActive
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:userId
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Don't allow deleting your own account
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }

        await user.deleteOne();

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all files
// @route   GET /api/admin/files
// @access  Private/Admin
exports.getAllFiles = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const files = await File.find()
            .populate('owner', 'name email')
            .sort('-createdAt')
            .skip(skip)
            .limit(limit);

        const total = await File.countDocuments();

        res.json({
            success: true,
            count: files.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            files
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get tampered files
// @route   GET /api/admin/files/tampered
// @access  Private/Admin
exports.getTamperedFiles = async (req, res, next) => {
    try {
        const files = await File.find({ 
            status: 'compromised',
            integrityVerified: false
        }).populate('owner', 'name email');

        res.json({
            success: true,
            count: files.length,
            files
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get file details (admin)
// @route   GET /api/admin/files/:fileId
// @access  Private/Admin
exports.getFileDetails = async (req, res, next) => {
    try {
        const file = await File.findById(req.params.fileId)
            .populate('owner', 'name email')
            .populate('sharedWith.user', 'name email');

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        res.json({
            success: true,
            file
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete file (admin)
// @route   DELETE /api/admin/files/:fileId
// @access  Private/Admin
exports.deleteFile = async (req, res, next) => {
    try {
        const file = await File.findById(req.params.fileId);

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Hard delete for admin
        await file.deleteOne();

        // Log activity
        await ActivityLog.create({
            user: req.user._id,
            action: 'DELETE_FILE',
            resourceType: 'file',
            resourceId: file._id,
            details: {
                fileName: file.fileName,
                deletedBy: 'admin'
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

// @desc    Get system logs
// @route   GET /api/admin/logs
// @access  Private/Admin
exports.getSystemLogs = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const logs = await ActivityLog.find()
            .populate('user', 'name email')
            .sort('-createdAt')
            .skip(skip)
            .limit(limit);

        const total = await ActivityLog.countDocuments();

        res.json({
            success: true,
            count: logs.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            logs
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get activity logs
// @route   GET /api/admin/logs/activity
// @access  Private/Admin
exports.getActivityLogs = async (req, res, next) => {
    try {
        const { action, userId, from, to } = req.query;
        let query = {};

        if (action) query.action = action;
        if (userId) query.user = userId;
        if (from || to) {
            query.createdAt = {};
            if (from) query.createdAt.$gte = new Date(from);
            if (to) query.createdAt.$lte = new Date(to);
        }

        const logs = await ActivityLog.find(query)
            .populate('user', 'name email')
            .sort('-createdAt')
            .limit(100);

        res.json({
            success: true,
            count: logs.length,
            logs
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get system statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getSystemStats = async (req, res, next) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isActive: true });
        const totalFiles = await File.countDocuments();
        const activeFiles = await File.countDocuments({ status: 'active' });
        const tamperedFiles = await File.countDocuments({ status: 'compromised' });
        const totalDownloads = await File.aggregate([
            { $group: { _id: null, total: { $sum: '$downloads' } } }
        ]);

        // Recent activities
        const recentActivities = await ActivityLog.find()
            .populate('user', 'name email')
            .sort('-createdAt')
            .limit(10);

        res.json({
            success: true,
            stats: {
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    inactive: totalUsers - activeUsers
                },
                files: {
                    total: totalFiles,
                    active: activeFiles,
                    tampered: tamperedFiles,
                    deleted: totalFiles - activeFiles - tamperedFiles
                },
                downloads: totalDownloads[0]?.total || 0,
                recentActivities
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all feedback
// @route   GET /api/admin/feedback
// @access  Private/Admin
exports.getAllFeedback = async (req, res, next) => {
    try {
        const { status, type } = req.query;
        let query = {};

        if (status) query.status = status;
        if (type) query.type = type;

        const feedback = await Feedback.find(query)
            .populate('user', 'name email')
            .sort('-createdAt');

        res.json({
            success: true,
            count: feedback.length,
            feedback
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Respond to feedback
// @route   PUT /api/admin/feedback/:feedbackId/respond
// @access  Private/Admin
exports.respondToFeedback = async (req, res, next) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a response message'
            });
        }

        const feedback = await Feedback.findById(req.params.feedbackId);
        
        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found'
            });
        }

        feedback.adminResponse = {
            message,
            respondedBy: req.user._id,
            respondedAt: Date.now()
        };
        feedback.status = 'resolved';

        await feedback.save();

        res.json({
            success: true,
            message: 'Response submitted successfully',
            feedback
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete feedback
// @route   DELETE /api/admin/feedback/:feedbackId
// @access  Private/Admin
exports.deleteFeedback = async (req, res, next) => {
    try {
        const feedback = await Feedback.findById(req.params.feedbackId);
        
        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found'
            });
        }

        await feedback.deleteOne();

        res.json({
            success: true,
            message: 'Feedback deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};