const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['new_request', 'request_completed', 'request_cancelled', 'review'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        default: false
    },
    relatedRequest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Request'
    },
    relatedReview: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review'
    }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
