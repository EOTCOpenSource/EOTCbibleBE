import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { User, IUser, Progress, Bookmark, Note, Highlight, Topic, BlacklistedToken } from '../models';

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

        // Check if account is locked
        if (user.isAccountLocked()) {
            const lockTime = user.accountLockedUntil;
            const remainingTime = Math.ceil((lockTime!.getTime() - new Date().getTime()) / (1000 * 60)); // minutes

            res.status(423).json({
                success: false,
                message: `Account is locked due to too many failed login attempts. Please try again in ${remainingTime} minutes.`
            });
            return;
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            // Increment failed login attempts and get updated user
            const updatedUser = await user.incrementFailedAttempts();

            // Check if account should be locked after this failed attempt
            if (updatedUser.failedLoginAttempts >= 5) {
                res.status(423).json({
                    success: false,
                    message: 'Account locked due to too many failed login attempts. Please try again in 2 hours.'
                });
                return;
            }

            const remainingAttempts = 5 - updatedUser.failedLoginAttempts;
            res.status(401).json({
                success: false,
                message: `Invalid email or password. ${remainingAttempts} attempts remaining before account lock.`
            });
            return;
        }

        // Reset failed login attempts on successful login
        await user.resetFailedAttempts();

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

// Logout user
export const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            res.status(400).json({
                success: false,
                message: 'No token provided for logout'
            });
            return;
        }

        // Verify token to get user info and expiration
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

            // Calculate token expiration time
            const tokenExp = new Date();
            tokenExp.setDate(tokenExp.getDate() + 7); // 7 days from now (matching JWT_EXPIRES_IN)

            // Blacklist the token
            await BlacklistedToken.blacklistToken(token, decoded.userId, tokenExp);

            res.status(200).json({
                success: true,
                message: 'Logout successful - token invalidated'
            });
        } catch (jwtError) {
            // If token is invalid, still return success (client should clear token anyway)
            res.status(200).json({
                success: true,
                message: 'Logout successful'
            });
        }

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during logout'
        });
    }
};

// Delete user account and all associated data
export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
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

        const userId = user._id;

        // Delete all associated data from all collections
        const deletePromises = [
            // Delete user's progress records
            Progress.deleteMany({ userId }),

            // Delete user's bookmarks
            Bookmark.deleteMany({ userId }),

            // Delete user's notes
            Note.deleteMany({ userId }),

            // Delete user's highlights
            Highlight.deleteMany({ userId }),

            // Delete user's topics
            Topic.deleteMany({ userId }),

            // Finally, delete the user account
            User.findByIdAndDelete(userId)
        ];

        // Execute all deletions
        await Promise.all(deletePromises);

        res.status(200).json({
            success: true,
            message: 'Account and all associated data deleted successfully'
        });

    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during account deletion'
        });
    }
};
