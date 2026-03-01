import dotenv from 'dotenv';
// Load environment variables as early as possible
dotenv.config();


// IMPORTANT: Import Sentry instrumentation after loading environment variables
import './instrument';
import * as Sentry from '@sentry/node';
import express from 'express';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import fs from 'fs';
import swaggerOptions from './config/swagger';
import corsMiddleware from './config/cors';
import authRoutes from './routes/auth.routes';
import bookmarkRoutes from './routes/bookmark.routes';
import noteRoutes from './routes/note.routes';
import highlightRoutes from './routes/highlight.routes';
import progressRoutes from './routes/progress.routes';
import topicRoutes from './routes/topic.routes';
import dataRoutes from './routes/data.routes';
import readingPlanRoutes from './routes/readingPlan.routes';
import { cleanupExpiredTokens } from './utils/tokenCleanup';
import { emailService } from './utils/emailService';
import { connectRedis, disconnectRedis, isRedisConnected } from './utils/cache';

// Environment variable validation
const NODE_ENV = process.env.NODE_ENV;
const PORT = process.env.PORT || (process.env.NODE_ENV === 'test' ? '5000' : undefined);
const DB_NAME = process.env.DB_NAME || (process.env.NODE_ENV === 'test' ? 'EOTCBIBLE_TEST' : undefined);
const MONGODB_URI = process.env.MONGODB_URI;

// Validate required environment variables
if (!NODE_ENV) {
    console.error('❌ NODE_ENV environment variable is required');
    process.exit(1);
}

if (!PORT) {
    console.error('❌ PORT environment variable is required');
    process.exit(1);
}

if (!DB_NAME) {
    console.error('❌ DB_NAME environment variable is required');
    process.exit(1);
}

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is required');
    process.exit(1);
}

const app = express();


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
        await disconnectRedis();
        console.log('✅ MongoDB and Redis connections closed through app termination');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during connection closure:', error);
        process.exit(1);
    }
});

// Middleware
app.use(corsMiddleware); // Enable CORS for frontend integration (Next.js, React, etc.)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static serving for uploaded files (e.g., profile avatars)
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));



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

// Mount reading plan routes
app.use('/api/v1/reading-plans', readingPlanRoutes);

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
    const redisConnected = isRedisConnected();
    const status = isConnected && redisConnected ? 'OK' : 'DEGRADED';

    res.json({
        status,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: {
            status: isConnected ? 'Connected' : 'Disconnected',
            configuredName: DB_NAME,
            actualName: isConnected ? mongoose.connection.name : null,
            host: isConnected ? mongoose.connection.host : null,
            port: isConnected ? mongoose.connection.port : null
        },
        redis: {
            status: redisConnected ? 'Connected' : 'Disconnected'
        }
    });
});

// Test route for Sentry error tracking
app.get('/debug-sentry', function mainHandler(req, res) {
    throw new Error('My first Sentry error!');
});

// The Sentry error handler must be registered before any other error middleware and after all controllers
Sentry.setupExpressErrorHandler(app);

// Optional fallthrough error handler
app.use(function onError(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
    // The error id is attached to `res.sentry` to be returned
    // and optionally displayed to the user for support.
    console.error('❌ Error:', err);
    res.statusCode = 500;
    res.json({
        success: false,
        message: 'Internal server error',
        errorId: (res as any).sentry // Sentry error ID for tracking
    });
});

// Start server function
const startServer = async (): Promise<void> => {
    try {
        // Connect to MongoDB first
        await connectToDatabase();

        // Connect to Redis
        await connectRedis();

        // Verify email service connection
        const emailServiceWorking = await emailService.verifyConnection();
        if (!emailServiceWorking) {
            console.warn('⚠️  Email service connection failed. OTP functionality may not work properly.');
        }

        // Start the Express server
        app.listen(PORT, () => {
            console.log(`🚀 Server running at: http://localhost:${PORT}`);
        });

        // Setup token cleanup job (run every 24 hours)
        setInterval(async () => {
            await cleanupExpiredTokens();
        }, 24 * 60 * 60 * 1000); // 24 hours

        // Run initial cleanup
        await cleanupExpiredTokens();
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
