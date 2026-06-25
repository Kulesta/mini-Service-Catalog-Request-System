const Service = require('../models/Service');
const Category = require('../models/Category');

exports.getServices = async (req, res) => {
    try {
        const { search } = req.query;
        const categoryParam = req.query.category || req.query.category_id;
        const page = Math.max(parseInt(req.query.page || '1', 10), 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
        const skip = (page - 1) * limit;
        let query = { provider: req.user.id };

        if (search) {
            query.service_name = { $regex: search, $options: 'i' };
        }

        if (categoryParam) {
            query.category = categoryParam;
        }

        const [total, services] = await Promise.all([
            Service.countDocuments(query),
            Service.find(query)
                .populate('category', 'title')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
        ]);

        res.json({
            data: services,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
exports.createService = async (req, res) => {
    try {
        const { service_name, category_id, base_price, vat_percent, discount_amount, image, images, tags, availability } = req.body;

        if (!service_name || !category_id || !base_price) {
            return res.status(400).json({ message: 'Please fill required fields' });
        }

        const category = await Category.findById(category_id);
        if (!category || category.provider.toString() !== req.user.id) {
            return res.status(400).json({ message: 'Invalid category' });
        }

        const service = await Service.create({
            provider: req.user.id,
            category: category_id,
            service_name,
            base_price,
            vat_percent,
            discount_amount,
            image,
            images: images || [],
            tags: tags || [],
            availability: availability || { days: ['mon', 'tue', 'wed', 'thu', 'fri'], start_time: '09:00', end_time: '17:00', slot_duration: 60 }
        });

        res.status(201).json(service);
    } catch (error) {
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};

exports.updateService = async (req, res) => {
    try {
        let service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        if (service.provider.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Prepare updates: if frontend sent `category_id`, map it to `category`
        const updates = { ...req.body };



        if (updates.category_id) {
            const category = await Category.findById(updates.category_id);
            if (!category || category.provider.toString() !== req.user.id) {
                return res.status(400).json({ message: 'Invalid category' });
            }
            updates.category = updates.category_id;
            delete updates.category_id;
        }

        service = await Service.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true
        });



        res.json(service);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deleteService = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        if (service.provider.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await service.deleteOne();

        res.json({ message: 'Service removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};
