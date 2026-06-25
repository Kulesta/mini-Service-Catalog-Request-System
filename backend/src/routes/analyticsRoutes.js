const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const Service = require('../models/Service');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, async (req, res) => {
    try {
        const providerId = req.user._id;
        const { period = '30' } = req.query;
        const daysBack = parseInt(period, 10);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysBack);

        const [
            revenueByDay,
            requestsByDay,
            requestsByStatus,
            popularServices,
            recentRequests
        ] = await Promise.all([
            Request.aggregate([
                { $match: { provider: providerId, status: 'completed', createdAt: { $gte: startDate } } },
                { $unwind: '$services' },
                { $lookup: { from: 'services', localField: 'services', foreignField: '_id', as: 'serviceDoc' } },
                { $unwind: '$serviceDoc' },
                {
                    $addFields: {
                        total: {
                            $subtract: [
                                { $add: ['$serviceDoc.base_price', { $multiply: ['$serviceDoc.base_price', { $divide: ['$serviceDoc.vat_percent', 100] }] }] },
                                '$serviceDoc.discount_amount'
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        revenue: { $sum: '$total' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),

            Request.aggregate([
                { $match: { provider: providerId, createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        total: { $sum: 1 },
                        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                        cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
                    }
                },
                { $sort: { _id: 1 } }
            ]),

            Request.aggregate([
                { $match: { provider: providerId, createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]),

            Request.aggregate([
                { $match: { provider: providerId, createdAt: { $gte: startDate } } },
                { $unwind: '$services' },
                { $lookup: { from: 'services', localField: 'services', foreignField: '_id', as: 'serviceDoc' } },
                { $unwind: '$serviceDoc' },
                {
                    $group: {
                        _id: '$serviceDoc.service_name',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]),

            Request.find({ provider: providerId })
                .populate('services', 'service_name')
                .sort({ createdAt: -1 })
                .limit(5)
                .select('customer_name services status booking_date booking_time createdAt')
        ]);

        const revenueData = revenueByDay.map(d => ({
            date: d._id,
            revenue: Math.round(d.revenue * 100) / 100,
            orders: d.count
        }));

        const requestData = requestsByDay.map(d => ({
            date: d._id,
            total: d.total,
            pending: d.pending,
            completed: d.completed,
            cancelled: d.cancelled
        }));

        const statusData = requestsByStatus.map(d => ({
            name: d._id.charAt(0).toUpperCase() + d._id.slice(1),
            value: d.count
        }));

        const serviceData = popularServices.map(d => ({
            name: d._id || 'Unknown',
            orders: d.count
        }));

        const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0);
        const totalRequests = requestData.reduce((sum, d) => sum + d.total, 0);

        res.json({
            revenueData,
            requestData,
            statusData,
            serviceData,
            recentRequests,
            summary: {
                totalRevenue: Math.round(totalRevenue * 100) / 100,
                totalRequests,
                period: daysBack
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
