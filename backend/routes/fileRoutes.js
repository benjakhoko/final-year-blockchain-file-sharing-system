const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fileController = require('../controllers/fileController');
const { protect } = require('../middleware/auth');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, process.env.UPLOAD_PATH || 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Allow all file types for now, you can restrict if needed
    cb(null, true);
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB default
    },
    fileFilter: fileFilter
});

const handleSingleUpload = (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (!err) return next();

        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'File is too large. Maximum allowed size is 10MB'
                });
            }
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        return next(err);
    });
};

// All routes require authentication
router.use(protect);

// File routes
router.post('/upload', handleSingleUpload, fileController.uploadFile);
router.get('/', fileController.getAllFiles);
router.get('/:fileId', fileController.getFileDetails);
router.delete('/:fileId', fileController.deleteFile);
router.post('/:fileId/share', fileController.shareFile);
router.post('/:fileId/revoke/:userId', fileController.revokeAccess);
router.get('/:fileId/download', fileController.downloadFile);
router.get('/:fileId/verify', fileController.verifyFileIntegrity);

module.exports = router;
