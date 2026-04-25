const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['bug', 'feature', 'improvement', 'general'],
        required: true
    },
    subject: {
        type: String,
        required: [true, 'Please provide a subject'],
        trim: true,
        maxlength: [100, 'Subject cannot be more than 100 characters']
    },
    message: {
        type: String,
        required: [true, 'Please provide a message'],
        trim: true,
        maxlength: [1000, 'Message cannot be more than 1000 characters']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    status: {
        type: String,
        enum: ['pending', 'in-review', 'resolved', 'closed'],
        default: 'pending'
    },
    adminResponse: {
        message: String,
        respondedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        respondedAt: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Feedback', feedbackSchema);