const express = require('express');
const router = express.Router();
const Banner = require('../models/Banner');
const { protect } = require('../middleware/authMiddleware');

// Get all banners for provider
router.get('/', protect, async (req, res) => {
    try {
        const banners = await Banner.find({ provider: req.user._id }).sort({ display_order: 1, createdAt: -1 });
        res.json(banners);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Create banner
router.post('/', protect, async (req, res) => {
    try {
        const { title, subtitle, discount_text, background_color, text_color, link_url } = req.body;
        if (!title) return res.status(400).json({ message: 'Title is required' });
        const banner = await Banner.create({
            provider: req.user._id,
            title, subtitle: subtitle || '', discount_text: discount_text || '',
            background_color: background_color || '#3b82f6', text_color: text_color || '#ffffff',
            link_url: link_url || ''
        });
        res.status(201).json(banner);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Update banner
router.put('/:id', protect, async (req, res) => {
    try {
        const banner = await Banner.findOne({ _id: req.params.id, provider: req.user._id });
        if (!banner) return res.status(404).json({ message: 'Not found' });
        const updated = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Delete banner
router.delete('/:id', protect, async (req, res) => {
    try {
        const banner = await Banner.findOneAndDelete({ _id: req.params.id, provider: req.user._id });
        if (!banner) return res.status(404).json({ message: 'Not found' });
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
