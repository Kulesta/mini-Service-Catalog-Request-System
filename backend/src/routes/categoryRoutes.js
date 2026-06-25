const express = require('express');
const router = express.Router();
const {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getCategories)
    .post(protect, createCategory);

router.route('/bulk-delete')
    .post(protect, async (req, res) => {
        try {
            const { ids } = req.body;
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ message: 'No IDs provided' });
            }
            const result = await Category.deleteMany({ _id: { $in: ids }, provider: req.user._id });
            res.json({ message: `${result.deletedCount} categories deleted`, deletedCount: result.deletedCount });
        } catch (error) {
            res.status(500).json({ message: 'Server Error' });
        }
    });

router.route('/:id')
    .get(protect, getCategory)
    .put(protect, updateCategory)
    .delete(protect, deleteCategory);

module.exports = router;
