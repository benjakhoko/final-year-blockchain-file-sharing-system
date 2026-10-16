const emailTemplates = {
    welcome: (name) => ({
        subject: 'Welcome to BlockShare!',
        html: `
            <h1>Welcome ${name}!</h1>
            <p>Thank you for joining BlockShare - the blockchain-based secure file sharing platform.</p>
            <p>Your files are encrypted and stored securely with blockchain verification.</p>
            <p>Get started by uploading your first file!</p>
            <a href="${process.env.FRONTEND_URL}/dashboard">Go to Dashboard</a>
        `
    }),
    fileShared: (fileName, sharerName, accessType) => ({
        subject: `File Shared: ${fileName}`,
        html: `
            <h1>File Shared with You</h1>
            <p><strong>${sharerName}</strong> has shared a file with you.</p>
            <ul>
                <li>File: ${fileName}</li>
                <li>Access: ${accessType}</li>
            </ul>
            <a href="${process.env.FRONTEND_URL}/shared">View Shared Files</a>
        `
    }),
    accessRevoked: (fileName, revokerName) => ({
        subject: `Access Revoked: ${fileName}`,
        html: `
            <h1>Access Revoked</h1>
            <p><strong>${revokerName}</strong> has revoked your access to the file: <strong>${fileName}</strong>.</p>
            <p>You can no longer view or download this file.</p>
        `
    }),
    tamperDetected: (fileName, ownerName) => ({
        subject: `⚠️ File Tampered: ${fileName}`,
        html: `
            <h1>⚠️ File Integrity Compromised</h1>
            <p>Dear ${ownerName},</p>
            <p>Your file <strong>${fileName}</strong> has been detected as tampered.</p>
            <p>Please verify the file immediately.</p>
            <a href="${process.env.FRONTEND_URL}/files">Check Your Files</a>
        `
    }),
    passwordReset: (resetLink) => ({
        subject: 'Password Reset Request',
        html: `
            <h1>Password Reset</h1>
            <p>Click the link below to reset your password:</p>
            <a href="${resetLink}">Reset Password</a>
            <p>This link expires in 1 hour.</p>
        `
    }),
    twoFactorEnabled: () => ({
        subject: 'Two-Factor Authentication Enabled',
        html: `
            <h1>2FA Enabled</h1>
            <p>Two-factor authentication has been enabled for your account.</p>
            <p>If this wasn't you, please contact support immediately.</p>
        `
    })
};

module.exports = emailTemplates;