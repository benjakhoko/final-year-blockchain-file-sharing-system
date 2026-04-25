const Feedback = require('../models/Feedback');

// @desc    Submit feedback
// @route   POST /api/feedback
// @access  Private
exports.submitFeedback = async (req, res, next) => {
    try {
        const { type, subject, message, rating } = req.body;

        const feedback = await Feedback.create({
            user: req.user._id,
            type,
            subject,
            message,
            rating
        });

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            feedback: {
                id: feedback._id,
                type: feedback.type,
                subject: feedback.subject,
                status: feedback.status,
                createdAt: feedback.createdAt
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get user's feedback
// @route   GET /api/feedback
// @access  Private
exports.getUserFeedback = async (req, res, next) => {
    try {
        const feedback = await Feedback.find({ user: req.user._id })
            .sort('-createdAt');

        res.json({
            success: true,
            count: feedback.length,
            feedback
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get feedback details
// @route   GET /api/feedback/:feedbackId
// @access  Private
exports.getFeedbackDetails = async (req, res, next) => {
    try {
        const feedback = await Feedback.findOne({
            _id: req.params.feedbackId,
            user: req.user._id
        });

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found'
            });
        }

        res.json({
            success: true,
            feedback
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete feedback
// @route   DELETE /api/feedback/:feedbackId
// @access  Private
exports.deleteFeedback = async (req, res, next) => {
    try {
        const feedback = await Feedback.findOne({
            _id: req.params.feedbackId,
            user: req.user._id
        });

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found'
            });
        }

        await feedback.deleteOne();

        res.json({
            success: true,
            message: 'Feedback deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};