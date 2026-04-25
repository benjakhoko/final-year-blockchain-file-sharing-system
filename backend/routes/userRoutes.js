const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// User routes
router.get('/shared-files', userController.getSharedFiles);
router.get('/activity-logs', userController.getActivityLogs);
router.get('/files', userController.getUserFiles);
router.get('/files/:fileId/integrity', userController.checkFileIntegrity);
router.get('/stats', userController.getUserStats);

module.exports = router;