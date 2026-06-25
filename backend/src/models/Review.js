const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    customer_name: {
        type: String,
        required: true,
        trim: true
    },
    customer_email: {
        type: String,
        trim: true,
        default: ''
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
