const mongoose = require('mongoose');

const aiAlertSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    file: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
        default: null
    },
    type: {
        type: String,
        enum: ['malicious_file', 'abnormal_sharing', 'risk_access', 'suspicious_activity'],
        required: true
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low'
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    status: {
        type: String,
        enum: ['active', 'acknowledged', 'resolved', 'dismissed'],
        default: 'active'
    },
    resolution: {
        type: String,
        default: null
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    resolvedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

aiAlertSchema.index({ user: 1, status: 1, createdAt: -1 });
aiAlertSchema.index({ type: 1, severity: 1 });

module.exports = mongoose.model('AIAlert', aiAlertSchema);