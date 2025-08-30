import rateLimit from "express-rate-limit";

export const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 requests per windowMS
    message: {
        success: false,
        message: " Too many password reset requests. Try again later.",
    },
    
    standardHeaders: true,
    legacyHeaders: false,
})