const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    subtitle: {
        type: String,
        default: ''
    },
    discount_text: {
        type: String,
        default: ''
    },
    background_color: {
        type: String,
        default: '#3b82f6'
    },
    text_color: {
        type: String,
        default: '#ffffff'
    },
    link_url: {
        type: String,
        default: ''
    },
    is_active: {
        type: Boolean,
        default: true
    },
    display_order: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);
