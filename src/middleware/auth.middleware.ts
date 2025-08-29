import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { User, IUser, BlacklistedToken } from '../models';

// Extend Express Request interface to include user
declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}

// JWT secret from environment variables
const getJWTSecret = (): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET environment variable is required');
    }
    return secret;
};

// Interface for JWT payload
interface JWTPayload {
    userId: string;
    email: string;
    name: string;
}

// Authentication middleware
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
            return;
        }

        // Check if token is blacklisted
        const isBlacklisted = await BlacklistedToken.isBlacklisted(token);
        if (isBlacklisted) {
            res.status(401).json({
                success: false,
                message: 'Token has been invalidated (logged out)'
            });
            return;
        }

        // Verify token
        const decoded = jwt.verify(token, getJWTSecret()) as JWTPayload;

        // Find user in database
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid token - user not found'
            });
            return;
        }

        // Attach user to request object
        req.user = user;
        next();

    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        } else if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        } else {
            console.error('Authentication error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during authentication'
            });
        }
    }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, getJWTSecret()) as JWTPayload;
            const user = await User.findById(decoded.userId).select('-password');

            if (user) {
                req.user = user;
            }
        }

        next();
    } catch (error) {
        // Continue without authentication if token is invalid
        next();
    }
};

// Protect middleware - alias for authenticateToken
export const protect = authenticateToken;
