const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const feedbackController = require('../controllers/feedbackController');
const { protect } = require('../middleware/auth');

const feedbackValidation = [
    body('type').isIn(['bug', 'feature', 'improvement', 'general']).withMessage('Invalid feedback type'),
    body('subject').notEmpty().withMessage('Subject is required').trim(),
    body('message').notEmpty().withMessage('Message is required').trim(),
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
];

// All routes require authentication
router.use(protect);

// Feedback routes
router.post('/', feedbackValidation, feedbackController.submitFeedback);
router.get('/', feedbackController.getUserFeedback);
router.get('/:feedbackId', feedbackController.getFeedbackDetails);
router.delete('/:feedbackId', feedbackController.deleteFeedback);

module.exports = router;