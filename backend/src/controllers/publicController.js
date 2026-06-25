const User = require('../models/User');
const Category = require('../models/Category');
const Service = require('../models/Service');
const Request = require('../models/Request');
const Notification = require('../models/Notification');
const Review = require('../models/Review');
const Banner = require('../models/Banner');
const { sendRequestNotification } = require('../services/emailService');
const { getAvailableDates, getEarliestTimeSlot } = require('../utils/timeSlots');

exports.getProviderServices = async (req, res) => {
    try {
        const { providerId } = req.params;
        const provider = await User.findById(providerId).select('full_name company_name email phone slug');
        if (!provider) {
            return res.status(404).json({ message: 'Provider not found' });
        }
        const [categories, services, reviews, avgResult, banners] = await Promise.all([
            Category.find({ provider: providerId, status: 'active' }),
            Service.find({ provider: providerId }),
            Review.find({ provider: providerId }).sort({ createdAt: -1 }).limit(5),
            Review.aggregate([
                { $match: { provider: provider._id } },
                { $group: { _id: null, avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
            ]),
            Banner.find({ provider: providerId, is_active: true }).sort({ display_order: 1 })
        ]);

        const catalog = categories.map(cat => {
            const catServices = services.filter(s => s.category.toString() === cat._id.toString());
            return { ...cat.toObject(), services: catServices };
        });
        const avgRating = avgResult.length > 0 ? Math.round(avgResult[0].avgRating * 10) / 10 : 0;
        const totalReviews = avgResult.length > 0 ? avgResult[0].totalReviews : 0;
        const availableDates = getAvailableDates(services);

        res.json({ provider, catalog, reviews, avgRating, totalReviews, availableDates, banners });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getProviderServicesBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const provider = await User.findOne({ slug }).select('full_name company_name email phone slug');
        if (!provider) {
            return res.status(404).json({ message: 'Provider not found' });
        }
        const [categories, services, reviews, avgResult, banners] = await Promise.all([
            Category.find({ provider: provider._id, status: 'active' }),
            Service.find({ provider: provider._id }),
            Review.find({ provider: provider._id }).sort({ createdAt: -1 }).limit(5),
            Review.aggregate([
                { $match: { provider: provider._id } },
                { $group: { _id: null, avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
            ]),
            Banner.find({ provider: provider._id, is_active: true }).sort({ display_order: 1 })
        ]);

        const catalog = categories.map(cat => {
            const catServices = services.filter(s => s.category.toString() === cat._id.toString());
            return { ...cat.toObject(), services: catServices };
        });
        const avgRating = avgResult.length > 0 ? Math.round(avgResult[0].avgRating * 10) / 10 : 0;
        const totalReviews = avgResult.length > 0 ? avgResult[0].totalReviews : 0;
        const availableDates = getAvailableDates(services);

        res.json({ provider, catalog, reviews, avgRating, totalReviews, availableDates, banners });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getAvailableSlots = async (req, res) => {
    try {
        const { providerId } = req.params;
        const { date, serviceIds } = req.query;

        if (!date) {
            return res.status(400).json({ message: 'Date is required' });
        }

        const selectedIds = serviceIds ? serviceIds.split(',') : [];
        let services;
        if (selectedIds.length > 0) {
            services = await Service.find({ _id: { $in: selectedIds }, provider: providerId });
        } else {
            services = await Service.find({ provider: providerId });
        }

        const bookedRequests = await Request.find({
            provider: providerId,
            booking_date: date,
            status: { $in: ['pending'] }
        }).select('booking_time');

        const bookedSlots = bookedRequests.map(r => r.booking_time).filter(Boolean);
        const slots = getEarliestTimeSlot(services, {});

        const availableSlots = slots.map(slot => ({
            ...slot,
            available: !bookedSlots.includes(slot.time)
        }));

        res.json({ date, slots: availableSlots });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.submitRequest = async (req, res) => {
    try {
        const { providerId, serviceIds, customerName, customerPhone, customerEmail, customerNote, bookingDate, bookingTime } = req.body;

        if (!providerId || !customerName || !customerPhone) {
            return res.status(400).json({ message: 'Provider, name, and phone are required' });
        }

        const [services, provider] = await Promise.all([
            serviceIds && serviceIds.length > 0
                ? Service.find({ _id: { $in: serviceIds } }).select('service_name base_price vat_percent discount_amount total_price')
                : [],
            User.findById(providerId).select('full_name email company_name')
        ]);

        if (bookingDate && bookingTime) {
            const conflict = await Request.findOne({
                provider: providerId,
                booking_date: bookingDate,
                booking_time: bookingTime,
                status: 'pending'
            });
            if (conflict) {
                return res.status(409).json({ message: 'This time slot is already booked. Please choose another.' });
            }
        }

        const newRequest = await Request.create({
            provider: providerId,
            customer_name: customerName,
            customer_phone: customerPhone,
            customer_email: customerEmail || '',
            customer_note: customerNote,
            services: serviceIds,
            booking_date: bookingDate || '',
            booking_time: bookingTime || ''
        });

        await Notification.create({
            provider: providerId,
            type: 'new_request',
            title: 'New Service Request',
            message: `${customerName} requested ${services.length} service${services.length !== 1 ? 's' : ''}${bookingDate ? ' for ' + bookingDate + (bookingTime ? ' at ' + bookingTime : '') : ''}`,
            relatedRequest: newRequest._id
        });

        if (provider && provider.email) {
            const emailServices = services.map(s => ({
                name: s.service_name,
                total: Number(s.total_price) || ((Number(s.base_price) || 0) + (Number(s.base_price || 0) * Number(s.vat_percent || 0) / 100) - (Number(s.discount_amount) || 0))
            }));

            sendRequestNotification({
                providerEmail: provider.email,
                providerName: provider.full_name || provider.company_name,
                customerName,
                services: emailServices,
                serviceNames: services.map(s => s.service_name).join(', '),
                requestNote: customerNote
            }).catch(err => console.error('Email notification failed:', err.message));
        }

        res.json({ message: 'Request submitted successfully!', requestId: newRequest._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
