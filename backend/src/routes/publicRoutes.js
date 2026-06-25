const express = require('express');
const router = express.Router();
const { getProviderServices, getProviderServicesBySlug, submitRequest, getAvailableSlots } = require('../controllers/publicController');
const { submitReview, getProviderReviews } = require('../controllers/reviewController');

router.get('/services/:slug', getProviderServicesBySlug);
router.get('/:providerId', getProviderServices);
router.get('/slots/:providerId', getAvailableSlots);
router.post('/request', submitRequest);
router.post('/review', submitReview);
router.get('/reviews/:providerId', getProviderReviews);

module.exports = router;
