const express = require('express');
const router = express.Router();
const {
    getServices,
    createService,
    updateService,
    deleteService
} = require('../controllers/serviceController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getServices)
    .post(protect, createService);

router.route('/bulk-delete')
    .post(protect, async (req, res) => {
        try {
            const { ids } = req.body;
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ message: 'No IDs provided' });
            }
            const result = await Service.deleteMany({ _id: { $in: ids }, provider: req.user._id });
            res.json({ message: `${result.deletedCount} services deleted`, deletedCount: result.deletedCount });
        } catch (error) {
            res.status(500).json({ message: 'Server Error' });
        }
    });

router.route('/:id')
    .put(protect, updateService)
    .delete(protect, deleteService);

module.exports = router;
