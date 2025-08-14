const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth.routes');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection Function
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 5000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return true;
    } catch (error) {
        console.warn('⚠️  Warning: Could not connect to MongoDB. Server will start without database connection.');
        console.warn('   This is normal for development/testing without a MongoDB instance.');
        console.warn('   Error details:', error.message);
        return false;
    }
};

// Basic route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Bible Backend API',
        version: 'v1',
        baseUrl: '/api/v1',
        endpoints: {
            auth: '/api/v1/auth',
            health: '/api/v1/health'
        }
    });
});

// Health check route
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});

// API v1 routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);

    // Handle database connection errors
    if (err.name === 'MongooseError' || err.message.includes('MongoDB')) {
        return res.status(503).json({
            success: false,
            error: 'Database service unavailable',
            message: 'The database is currently not available. Please try again later.'
        });
    }

    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong on the server.'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        message: 'The requested endpoint does not exist.'
    });
});

// Start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Try to connect to MongoDB (but don't fail if it doesn't work)
        const dbConnected = await connectDB();

        // Start Express server
        app.listen(PORT, () => {
            console.log('🚀 Server is running on port', PORT);
            console.log('📡 API Base URL: http://localhost:' + PORT);
            console.log('🔗 Health Check: http://localhost:' + PORT + '/api/v1/health');
            if (dbConnected) {
                console.log('✅ Database: Connected');
            } else {
                console.log('⚠️  Database: Not connected (some features may not work)');
            }
            console.log('📝 Available endpoints:');
            console.log('   POST /api/v1/auth/register - Register a new user');
            console.log('   POST /api/v1/auth/login - Login user');
            console.log('   GET  /api/v1/auth/me - Get user profile (requires token)');
            console.log('   GET  /api/v1/health - Health check');
            console.log('');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Export app for testing
module.exports = app;

// Only start server if this file is run directly
if (require.main === module) {
    startServer();
}
