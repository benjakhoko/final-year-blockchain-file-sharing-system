const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const calculateFileHash = (filePath) => {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);

        stream.on('error', (err) => reject(err));
        stream.on('data', (chunk) => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
    });
};

const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const generateUniqueFileName = (originalName) => {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = originalName.split('.').pop();
    return `${timestamp}-${randomString}.${extension}`;
};

const getProtectedFileName = (file) => {
    const extension = path.extname(file.originalName || file.fileName || '');

    if (file.blockchainFileId) {
        return `bc-${file.blockchainFileId}${extension}`;
    }

    const normalizedHash = String(file.fileHash || '').replace(/[^a-zA-Z0-9]/g, '');
    const fallback = normalizedHash.slice(0, 16) || String(file._id || 'file');
    return `enc-${fallback}${extension}`;
};

module.exports = {
    calculateFileHash,
    formatBytes,
    generateUniqueFileName,
    getProtectedFileName
};
