const CryptoJS = require('crypto-js');
const crypto = require('crypto');

class EncryptionService {
    constructor() {
        // You can get this from environment variable or generate per user
        // For now, we'll use a master key from .env
        this.masterKey = process.env.ENCRYPTION_KEY || 'your-256-bit-secret-key-here-must-be-32-chars';
    }

    /**
     * Generate a random encryption key for a file
     */
    generateFileKey() {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Encrypt file buffer using AES-256
     * @param {Buffer} fileBuffer - The file data to encrypt
     * @param {string} encryptionKey - The key to use for encryption
     * @returns {Object} - Encrypted data and metadata
     */
    encryptFile(fileBuffer, encryptionKey) {
        try {
            // Generate random initialization vector
            const iv = crypto.randomBytes(16);
            
            // Create cipher with AES-256-CBC
            const cipher = crypto.createCipheriv(
                'aes-256-cbc',
                Buffer.from(encryptionKey, 'hex'),
                iv
            );
            
            // Encrypt the file
            let encrypted = cipher.update(fileBuffer);
            encrypted = Buffer.concat([encrypted, cipher.final()]);
            
            // Return encrypted data along with IV (needed for decryption)
            return {
                encryptedData: encrypted,
                iv: iv.toString('hex'),
                encryptionKey: encryptionKey
            };
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Failed to encrypt file');
        }
    }

    /**
     * Decrypt file buffer using AES-256
     * @param {Buffer} encryptedData - The encrypted file data
     * @param {string} iv - Initialization vector
     * @param {string} encryptionKey - The key used for encryption
     * @returns {Buffer} - Decrypted file data
     */
    decryptFile(encryptedData, iv, encryptionKey) {
        try {
            const decipher = crypto.createDecipheriv(
                'aes-256-cbc',
                Buffer.from(encryptionKey, 'hex'),
                Buffer.from(iv, 'hex')
            );
            
            let decrypted = decipher.update(encryptedData);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            
            return decrypted;
        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Failed to decrypt file');
        }
    }

    /**
     * Hash file content for integrity verification
     * @param {Buffer} fileBuffer - The file data to hash
     * @returns {string} - SHA-256 hash
     */
    hashFile(fileBuffer) {
        const hash = crypto.createHash('sha256');
        hash.update(fileBuffer);
        return hash.digest('hex');
    }

    /**
     * Encrypt file metadata (optional)
     * @param {Object} metadata - File metadata to encrypt
     * @returns {string} - Encrypted metadata
     */
    encryptMetadata(metadata) {
        const metadataStr = JSON.stringify(metadata);
        return CryptoJS.AES.encrypt(metadataStr, this.masterKey).toString();
    }

    /**
     * Decrypt file metadata
     * @param {string} encryptedMetadata - Encrypted metadata string
     * @returns {Object} - Decrypted metadata
     */
    decryptMetadata(encryptedMetadata) {
        const bytes = CryptoJS.AES.decrypt(encryptedMetadata, this.masterKey);
        const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
        return JSON.parse(decryptedStr);
    }
}

module.exports = new EncryptionService();