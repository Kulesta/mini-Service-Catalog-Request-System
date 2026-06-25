const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// Get provider profile (public)
router.get('/:providerId', async (req, res) => {
    try {
        const user = await User.findById(req.params.providerId)
            .select('full_name company_name email phone slug about cover_photo business_hours social_links');
        if (!user) return res.status(404).json({ message: 'Provider not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get provider profile by slug (public)
router.get('/slug/:slug', async (req, res) => {
    try {
        const user = await User.findOne({ slug: req.params.slug })
            .select('full_name company_name email phone slug about cover_photo business_hours social_links');
        if (!user) return res.status(404).json({ message: 'Provider not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Update own profile (protected)
router.put('/me', protect, async (req, res) => {
    try {
        const { about, cover_photo, business_hours, social_links, full_name, phone, company_name } = req.body;
        const updates = {};
        if (about !== undefined) updates.about = about;
        if (cover_photo !== undefined) updates.cover_photo = cover_photo;
        if (business_hours !== undefined) updates.business_hours = business_hours;
        if (social_links !== undefined) updates.social_links = social_links;
        if (full_name !== undefined) updates.full_name = full_name;
        if (phone !== undefined) updates.phone = phone;
        if (company_name !== undefined) updates.company_name = company_name;

        const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
            .select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
