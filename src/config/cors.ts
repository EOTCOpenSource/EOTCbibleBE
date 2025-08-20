import cors from 'cors';

// CORS configuration
export const corsOptions: cors.CorsOptions = {
    origin: function (origin, callback) {
        // Allow requests from these origins
        const allowedOrigins = [
            'http://localhost:3000',  // Next.js dev server
            'http://localhost:3001',  // Alternative Next.js port
            'http://localhost:5173',  // Vite dev server
            'http://localhost:4173',  // Vite preview
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:4173',
            // production domains here
            // 'https://your-app.vercel.app',
            // 'https://your-domain.com',
        ];

        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        // Check if the origin is allowed
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Allow cookies to be sent
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control',
        'X-API-Version'
    ],
    exposedHeaders: ['X-API-Version'],
    maxAge: 86400, // 24 hours
};

// Development CORS (more permissive)
export const devCorsOptions: cors.CorsOptions = {
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control',
        'X-API-Version'
    ],
    exposedHeaders: ['X-API-Version'],
};

// Export the appropriate CORS configuration based on environment
const isDevelopment = process.env.NODE_ENV !== 'production';
export const corsMiddleware = cors(isDevelopment ? devCorsOptions : corsOptions);

export default corsMiddleware;