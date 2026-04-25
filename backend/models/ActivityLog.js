const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        enum: [
            'LOGIN',
            'LOGOUT',
            'REGISTER',
            'UPLOAD_FILE',
            'DOWNLOAD_FILE',
            'DELETE_FILE',
            'SHARE_FILE',
            'REVOKE_ACCESS',
            'VERIFY_INTEGRITY',
            'UPDATE_PROFILE',
            'CHANGE_PASSWORD',
            'TAMPER_DETECTED'
        ],
        required: true
    },
    resourceType: {
        type: String,
        enum: ['file', 'user', 'system'],
        default: 'system'
    },
    resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'resourceType'
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    status: {
        type: String,
        enum: ['success', 'failure'],
        default: 'success'
    }
}, {
    timestamps: true
});

// Index for faster queries
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);