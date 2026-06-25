const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
        index: true // Requirement: Add index on category
    },
    service_name: {
        type: String,
        required: true,
        trim: true
    },
    base_price: {
        type: Number,
        required: true
    },
    vat_percent: {
        type: Number,
        default: 0
    },
    discount_amount: {
        type: Number,
        default: 0
    },
    image: {
        type: String,
        default: ''
    },
    images: {
        type: [String],
        default: []
    },
    tags: {
        type: [String],
        default: []
    },
    availability: {
        days: {
            type: [String],
            enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
            default: ['mon', 'tue', 'wed', 'thu', 'fri']
        },
        start_time: {
            type: String,
            default: '09:00'
        },
        end_time: {
            type: String,
            default: '17:00'
        },
        slot_duration: {
            type: Number,
            default: 60,
            min: 15,
            max: 480
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Computed Property: total_price
serviceSchema.virtual('total_price').get(function () {
    return (this.base_price + (this.base_price * this.vat_percent / 100)) - this.discount_amount;
});

module.exports = mongoose.model('Service', serviceSchema);
