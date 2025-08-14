import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { User, IUser } from '../models';

// JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Interface for register request body
interface RegisterRequest {
    name: string;
    email: string;
    password: string;
}

// Interface for JWT payload
interface JWTPayload {
    userId: string;
    email: string;
    name: string;
}

// Generate JWT token
const generateToken = (payload: JWTPayload): string => {
    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
    }
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
    } as jwt.SignOptions);
};

// Register new user
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password }: RegisterRequest = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            res.status(400).json({
                success: false,
                message: 'Name, email, and password are required'
            });
            return;
        }

        // Validate email format
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
            return;
        }

        // Validate password length
        if (password.length < 6) {
            res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
            return;
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
            return;
        }

        // Create new user
        const newUser = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password
        });

        // Save user to database (password will be hashed by pre-save hook)
        const savedUser = await newUser.save();

        // Generate JWT token
        const token = generateToken({
            userId: (savedUser._id as any).toString(),
            email: savedUser.email,
            name: savedUser.name
        });

        // Return success response with token
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: savedUser._id,
                    name: savedUser.name,
                    email: savedUser.email,
                    settings: savedUser.settings,
                    streak: savedUser.streak
                },
                token
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during registration'
        });
    }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password }: { email: string; password: string } = req.body;

        // Validate required fields
        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
            return;
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
            return;
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
            return;
        }

        // Generate JWT token
        const token = generateToken({
            userId: (user._id as any).toString(),
            email: user.email,
            name: user.name
        });

        // Return success response with token
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    settings: user.settings,
                    streak: user.streak
                },
                token
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during login'
        });
    }
};

// Get current user profile
export const getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        // User is already attached to req by authentication middleware
        const user = req.user;

        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Profile retrieved successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    settings: user.settings,
                    streak: user.streak
                }
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
