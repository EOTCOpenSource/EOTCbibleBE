import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import bookmarkRoutes from './routes/bookmark.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tsbackend';

// MongoDB connection function
const connectToDatabase = async (): Promise<void> => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// Handle MongoDB connection events
mongoose.connection.on('error', (error) => {
    console.error('❌ MongoDB connection error:', error);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️  MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed through app termination');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during MongoDB connection closure:', error);
        process.exit(1);
    }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API v1 routes
app.use('/api/v1', (req, res, next) => {
    // Add API version info to response headers
    res.setHeader('X-API-Version', 'v1');
    next();
});

// Mount auth routes
app.use('/api/v1/auth', authRoutes);

// Mount bookmark routes
app.use('/api/v1/bookmarks', bookmarkRoutes);

// Basic route
app.get('/', (req, res) => {
    res.json({
        message: 'TypeScript Backend is running!',
        timestamp: new Date().toISOString(),
        apiVersion: 'v1',
        endpoints: {
            health: '/api/v1/health',
            auth: {
                register: '/api/v1/auth/register',
                login: '/api/v1/auth/login',
                profile: '/api/v1/auth/profile'
            },
            bookmarks: {
                getAll: '/api/v1/bookmarks',
                getById: '/api/v1/bookmarks/:id',
                create: '/api/v1/bookmarks',
                update: '/api/v1/bookmarks/:id',
                delete: '/api/v1/bookmarks/:id'
            }
        }
    });
});

// Combined health and database status route
app.get('/api/v1/health', (req, res) => {
    const isConnected = mongoose.connection.readyState === 1;
    res.json({
        status: 'OK',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: {
            status: isConnected ? 'Connected' : 'Disconnected',
            name: isConnected ? mongoose.connection.name : null,
            host: isConnected ? mongoose.connection.host : null,
            port: isConnected ? mongoose.connection.port : null
        }
    });
});

// Start server function
const startServer = async (): Promise<void> => {
    try {
        // Connect to MongoDB first
        await connectToDatabase();

        // Start the Express server
        app.listen(PORT, () => {
            console.log(`🚀 Server running at: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Start the application only if not in test environment
if (!process.env.JEST_WORKER_ID) {
    startServer();
}

export default app;
