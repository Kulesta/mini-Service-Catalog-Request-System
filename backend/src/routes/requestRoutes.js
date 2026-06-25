const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const Category = require('../models/Category');
const Service = require('../models/Service');
const { protect } = require('../middleware/authMiddleware');
const { sendRequestStatusEmail } = require('../services/emailService');

// Dashboard stats
router.get('/stats', protect, async (req, res) => {
    try {
        const providerId = req.user._id;

        const [
            totalRequests,
            pendingRequests,
            completedRequests,
            cancelledRequests,
            totalCategories,
            activeCategories,
            totalServices,
            revenueResult
        ] = await Promise.all([
            Request.countDocuments({ provider: providerId }),
            Request.countDocuments({ provider: providerId, status: 'pending' }),
            Request.countDocuments({ provider: providerId, status: 'completed' }),
            Request.countDocuments({ provider: providerId, status: 'cancelled' }),
            Category.countDocuments({ provider: providerId }),
            Category.countDocuments({ provider: providerId, status: 'active' }),
            Service.countDocuments({ provider: providerId }),
            Request.aggregate([
                { $match: { provider: providerId, status: 'completed' } },
                { $unwind: '$services' },
                {
                    $lookup: {
                        from: 'services',
                        localField: 'services',
                        foreignField: '_id',
                        as: 'serviceDoc'
                    }
                },
                { $unwind: '$serviceDoc' },
                {
                    $addFields: {
                        computed_total: {
                            $subtract: [
                                {
                                    $add: [
                                        '$serviceDoc.base_price',
                                        { $multiply: ['$serviceDoc.base_price', { $divide: ['$serviceDoc.vat_percent', 100] }] }
                                    ]
                                },
                                '$serviceDoc.discount_amount'
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$computed_total' }
                    }
                }
            ])
        ]);

        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

        res.json({
            totalRequests,
            pendingRequests,
            completedRequests,
            cancelledRequests,
            totalCategories,
            activeCategories,
            totalServices,
            totalRevenue: Math.round(totalRevenue * 100) / 100
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Export requests as CSV
router.get('/export', protect, async (req, res) => {
    try {
        const { status } = req.query;
        let query = { provider: req.user._id };
        if (status && ['pending', 'completed', 'cancelled'].includes(status)) {
            query.status = status;
        }

        const requests = await Request.find(query)
            .populate('services', 'service_name base_price vat_percent discount_amount total_price')
            .sort({ createdAt: -1 });

        const csvRows = [
            ['Customer Name', 'Phone', 'Note', 'Services', 'Total', 'Status', 'Date'].join(',')
        ];

        for (const req of requests) {
            const serviceNames = req.services.map(s => s.service_name).join('; ');
            const total = req.services.reduce((sum, s) => {
                return sum + (Number(s.total_price) || ((Number(s.base_price) || 0) + (Number(s.base_price || 0) * Number(s.vat_percent || 0) / 100) - (Number(s.discount_amount) || 0)));
            }, 0);
            const date = new Date(req.createdAt).toLocaleDateString('en-US');
            const row = [
                `"${req.customer_name}"`,
                `"${req.customer_phone}"`,
                `"${(req.customer_note || '').replace(/"/g, '""')}"`,
                `"${serviceNames}"`,
                total.toFixed(2),
                req.status,
                date
            ].join(',');
            csvRows.push(row);
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=requests-export.csv');
        res.send(csvRows.join('\n'));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get all requests for logged in provider (with pagination, search, status filter)
router.get('/', protect, async (req, res) => {
    try {
        const { search, status } = req.query;
        const page = Math.max(parseInt(req.query.page || '1', 10), 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
        const skip = (page - 1) * limit;

        let query = { provider: req.user._id };

        if (status && ['pending', 'completed', 'cancelled'].includes(status)) {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { customer_name: { $regex: search, $options: 'i' } },
                { customer_phone: { $regex: search, $options: 'i' } }
            ];
        }

        const [total, requests] = await Promise.all([
            Request.countDocuments(query),
            Request.find(query)
                .populate('services')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
        ]);

        res.json({
            data: requests,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Update status
router.put('/:id', protect, async (req, res) => {
    try {
        const request = await Request.findOne({ _id: req.params.id, provider: req.user._id });
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const oldStatus = request.status;
        request.status = req.body.status;
        await request.save();

        // Send email if status changed to completed or cancelled
        if (req.body.status !== oldStatus && (req.body.status === 'completed' || req.body.status === 'cancelled')) {
            sendRequestStatusEmail({
                customerEmail: request.customer_email || '',
                customerName: request.customer_name,
                providerName: req.user.full_name || req.user.company_name || 'Your provider',
                status: req.body.status
            }).catch(err => console.error('Status email failed:', err.message));
        }

        res.json(request);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
