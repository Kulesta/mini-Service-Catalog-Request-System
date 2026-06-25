const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');

// Get reviews for a provider (public)
router.get('/provider/:providerId', async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page || '1', 10), 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 50);
        const skip = (page - 1) * limit;

        const [total, avgResult, reviews] = await Promise.all([
            Review.countDocuments({ provider: req.params.providerId }),
            Review.aggregate([
                { $match: { provider: require('mongoose').Types.ObjectId.createFromHexString(req.params.providerId) } },
                { $group: { _id: null, avgRating: { $avg: '$rating' } } }
            ]),
            Review.find({ provider: req.params.providerId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
        ]);

        const avgRating = avgResult.length > 0 ? Math.round(avgResult[0].avgRating * 10) / 10 : 0;

        res.json({
            data: reviews,
            avgRating,
            total,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Submit a review (public)
router.post('/', async (req, res) => {
    try {
        const { providerId, customer_name, customer_email, rating, comment } = req.body;

        if (!providerId || !customer_name || !rating) {
            return res.status(400).json({ message: 'Provider, name, and rating are required' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        const provider = await User.findById(providerId);
        if (!provider) {
            return res.status(404).json({ message: 'Provider not found' });
        }

        const review = await Review.create({
            provider: providerId,
            customer_name,
            customer_email: customer_email || '',
            rating,
            comment: comment || ''
        });

        await Notification.create({
            provider: providerId,
            type: 'review',
            title: 'New Review Received',
            message: `${customer_name} left a ${rating}-star review${comment ? ': "' + comment.substring(0, 80) + (comment.length > 80 ? '...' : '') + '"' : ''}`,
            relatedReview: review._id
        });

        res.status(201).json(review);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get reviews for logged-in provider (protected)
router.get('/my-reviews', protect, async (req, res) => {
    try {
        const reviews = await Review.find({ provider: req.user._id }).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
