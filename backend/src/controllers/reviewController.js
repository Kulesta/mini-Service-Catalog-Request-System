const Review = require('../models/Review');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendReviewNotification } = require('../services/emailService');

exports.submitReview = async (req, res) => {
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

        // Send email notification to provider
        const fullProvider = await User.findById(providerId).select('email full_name company_name');
        if (fullProvider && fullProvider.email) {
            sendReviewNotification({
                providerEmail: fullProvider.email,
                providerName: fullProvider.full_name || fullProvider.company_name,
                customerName: customer_name,
                rating,
                comment
            }).catch(err => console.error('Review email failed:', err.message));
        }

        res.status(201).json(review);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getProviderReviews = async (req, res) => {
    try {
        const { providerId } = req.params;
        const page = Math.max(parseInt(req.query.page || '1', 10), 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 50);
        const skip = (page - 1) * limit;

        const [total, avgResult, reviews] = await Promise.all([
            Review.countDocuments({ provider: providerId }),
            Review.aggregate([
                { $match: { provider: require('mongoose').Types.ObjectId.createFromHexString(providerId) } },
                { $group: { _id: null, avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
            ]),
            Review.find({ provider: providerId })
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
};
