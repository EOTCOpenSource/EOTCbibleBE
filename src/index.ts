import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerOptions from './config/swagger';
import corsMiddleware from './config/cors';
import authRoutes from './routes/auth.routes';
import bookmarkRoutes from './routes/bookmark.routes';
import noteRoutes from './routes/note.routes';
import highlightRoutes from './routes/highlight.routes';
import progressRoutes from './routes/progress.routes';
import topicRoutes from './routes/topic.routes';
import dataRoutes from './routes/data.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_NAME = process.env.DB_NAME || 'tsbackend';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://eyobgeremew618_db_user:MzpppYuRcRRYGMhd@eotc.afontvn.mongodb.net/?retryWrites=true&w=majority&appName=EOTC'; //mongodb+srv://eyobgeremew618:hs6klQA9FEvEOupa@eotc.svgojfe.mongodb.net/?retryWrites=true&w=majority&appName=EOTC

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
app.use(corsMiddleware); // Enable CORS for frontend integration (Next.js, React, etc.)
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

// Mount note routes
app.use('/api/v1/notes', noteRoutes);

// Mount highlight routes
app.use('/api/v1/highlights', highlightRoutes);

// Mount progress routes
app.use('/api/v1/progress', progressRoutes);

// Mount topic routes
app.use('/api/v1/topics', topicRoutes);

// Mount data routes
app.use('/api/v1/data', dataRoutes);

// Handle preflight requests
app.options('*', corsMiddleware);

// Swagger documentation
const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'TypeScript Backend API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true
    }
}));

// Basic route
app.get('/', (req, res) => {
    res.json({
        message: 'TypeScript Backend is running!',
        timestamp: new Date().toISOString(),
        apiVersion: 'v1',
        documentation: '/api-docs',
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
            },
            notes: {
                getAll: '/api/v1/notes',
                getById: '/api/v1/notes/:id',
                create: '/api/v1/notes',
                update: '/api/v1/notes/:id',
                delete: '/api/v1/notes/:id'
            },
            highlights: {
                getAll: '/api/v1/highlights',
                getById: '/api/v1/highlights/:id',
                create: '/api/v1/highlights',
                update: '/api/v1/highlights/:id',
                delete: '/api/v1/highlights/:id'
            },
            progress: {
                logReading: '/api/v1/progress/log-reading',
                getAll: '/api/v1/progress',
                getByBook: '/api/v1/progress/:bookId'
            },
            topics: {
                create: '/api/v1/topics',
                getAll: '/api/v1/topics',
                getById: '/api/v1/topics/:id',
                update: '/api/v1/topics/:id',
                delete: '/api/v1/topics/:id',
                addVerses: '/api/v1/topics/:id/verses',
                removeVerses: '/api/v1/topics/:id/verses',
                getByVerse: '/api/v1/topics/verse',
                getStats: '/api/v1/topics/stats'
            },
            data: {
                deleteAll: '/api/v1/data/all',
                deleteByType: '/api/v1/data/:type'
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
            configuredName: DB_NAME,
            actualName: isConnected ? mongoose.connection.name : null,
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
