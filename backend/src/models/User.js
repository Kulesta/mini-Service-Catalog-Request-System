const mongoose = require('mongoose');

function slugify(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/['"]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

const userSchema = new mongoose.Schema({
    full_name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    company_name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        trim: true,
        unique: true,
        index: true
    },
    license_number: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        enum: ['provider'],
        default: 'provider'
    },
    about: {
        type: String,
        default: ''
    },
    cover_photo: {
        type: String,
        default: ''
    },
    business_hours: {
        type: Object,
        default: {}
    },
    social_links: {
        type: Object,
        default: {}
    }
}, { timestamps: true });

userSchema.pre('validate', function () {
    if (!this.slug && this.company_name) {
        this.slug = slugify(this.company_name);
    }
});

module.exports = mongoose.model('User', userSchema);
