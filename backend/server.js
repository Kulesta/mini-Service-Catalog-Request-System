require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
// Allow base64 images (data URLs) in JSON payloads
app.use(express.json({ limit: '10mb' }));

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/salon_db')
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/categories', require('./src/routes/categoryRoutes'));
app.use('/api/services', require('./src/routes/serviceRoutes'));
app.use('/api/public', require('./src/routes/publicRoutes'));
app.use('/api/requests', require('./src/routes/requestRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));
app.use('/api/reviews', require('./src/routes/reviewRoutes'));
app.use('/api/analytics', require('./src/routes/analyticsRoutes'));
app.use('/api/banners', require('./src/routes/bannerRoutes'));
app.use('/api/profile', require('./src/routes/profileRoutes'));

// Email status check (protected)
const { protect } = require('./src/middleware/authMiddleware');
app.get('/api/settings/email-status', protect, (req, res) => {
    const configured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    res.json({
        configured,
        host: configured ? process.env.SMTP_HOST : null,
        port: configured ? process.env.SMTP_PORT : null,
        from: configured ? (process.env.SMTP_FROM || process.env.SMTP_USER) : null,
    });
});

app.get('/', (req, res) => {
    res.send('Salon Mini Catalog API is running');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
