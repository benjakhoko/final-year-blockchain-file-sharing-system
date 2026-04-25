const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    fileName: {
        type: String,
        required: [true, 'Please provide a file name'],
        trim: true
    },
    originalName: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    fileHash: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    // Encryption fields (backward-compatible with legacy unencrypted records)
    isEncrypted: {
        type: Boolean,
        default: false
    },
    encryptionKey: {
        type: String,
        required: function() {
            return this.isEncrypted === true;
        },
        select: false // Don't return by default for security
    },
    encryptionIV: {
        type: String,
        required: function() {
            return this.isEncrypted === true;
        },
        select: false // Don't return by default for security
    },
    ipfsHash: {
        type: String,
        default: null
    },
    blockchainFileId: {
        type: String,
        default: null
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    sharedWith: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        accessType: {
            type: String,
            enum: ['view', 'download'],
            default: 'view'
        },
        sharedAt: {
            type: Date,
            default: Date.now
        }
    }],
    integrityVerified: {
        type: Boolean,
        default: true
    },
    lastVerified: {
        type: Date,
        default: Date.now
    },
    downloads: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'deleted', 'compromised'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Index for faster queries
fileSchema.index({ owner: 1, createdAt: -1 });
fileSchema.index({ 'sharedWith.user': 1 });
fileSchema.index({ fileHash: 1 });

module.exports = mongoose.model('File', fileSchema);
