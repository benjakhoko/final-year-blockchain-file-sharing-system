const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/:userId', adminController.getUserDetails);
router.put('/users/:userId/status', adminController.toggleUserStatus);
router.delete('/users/:userId', adminController.deleteUser);

// File management
router.get('/files', adminController.getAllFiles);
router.get('/files/tampered', adminController.getTamperedFiles);
router.get('/files/:fileId', adminController.getFileDetails);
router.delete('/files/:fileId', adminController.deleteFile);

// System monitoring
router.get('/logs', adminController.getSystemLogs);
router.get('/logs/activity', adminController.getActivityLogs);
router.get('/stats', adminController.getSystemStats);

// Feedback management
router.get('/feedback', adminController.getAllFeedback);
router.put('/feedback/:feedbackId/respond', adminController.respondToFeedback);
router.delete('/feedback/:feedbackId', adminController.deleteFeedback);

module.exports = router;