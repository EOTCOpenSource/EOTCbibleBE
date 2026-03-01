import rateLimit from 'express-rate-limit';

// Rate limiter for login attempts
export const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    skip: (req) => {
        const isTest = process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID;
        const enableLimit = req.headers['x-test-enable-rate-limit'] === 'true';
        if (isTest && enableLimit) {
            console.log(`[RateLimit] Enabling for ${req.path}`);
        }
        return isTest && !enableLimit;
    },

    message: {
        success: false,
        message: 'Too many login attempts from this IP, please try again after 15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many login attempts from this IP, please try again after 15 minutes'
        });
    }
});

// Rate limiter for registration attempts
export const registerRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 registration attempts per hour
    skip: (req) => {
        const isTest = process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID;
        const enableLimit = req.headers['x-test-enable-rate-limit'] === 'true';
        return isTest && !enableLimit;
    },
    message: {
        success: false,
        message: 'Too many registration attempts from this IP, please try again after 1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many registration attempts from this IP, please try again after 1 hour'
        });
    }

});


