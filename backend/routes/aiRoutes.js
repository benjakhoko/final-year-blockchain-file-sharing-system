const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// User routes
router.get('/analyze/:fileId', aiController.analyzeFile);
router.get('/analyze-all', aiController.analyzeAllFiles);
router.get('/alerts', aiController.getMyAlerts);
router.get('/stats', aiController.getAIStats);
router.get('/health', aiController.checkHealth);

// Admin routes
router.get('/admin/alerts', authorize('admin'), aiController.getAllAlerts);
router.put('/admin/alerts/:alertId/resolve', authorize('admin'), aiController.resolveAlert);
router.get('/admin/suspicious-files', authorize('admin'), aiController.getSuspiciousFiles);
router.get('/admin/stats', authorize('admin'), aiController.getAdminAIStats);

module.exports = router;