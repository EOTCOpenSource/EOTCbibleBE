import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import dayjs from 'dayjs';
import { User, IUser, Progress, Bookmark, Note, Highlight, Topic, BlacklistedToken, OTP } from '../models';
import { emailService } from '../utils/emailService';
import { generateOTP, validateOTPFormat, calculateOTPExpiration, isOTPExpired } from '../utils/otpUtils';
import axios from 'axios';
import cloudinary from '../config/cloudinary.config';





// JWT configuration from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || '';
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || '';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

// Interface for registration request body
interface RegisterRequest {
    name: string;
    email: string;
    password: string;
}

// Interface for verify OTP request body
interface VerifyOTPRequest {
    email: string;
    otp: string;
}

// Interface for JWT payload
interface JWTPayload {
    userId: string;
    email: string;
    name: string;
}

// Generate JWT token
const generateToken = (payload: JWTPayload): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
};

// Detailed password validation function
const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push('at least 8 characters');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('at least 1 lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('at least 1 uppercase letter');
    }

    if (!/\d/.test(password)) {
        errors.push('at least 1 number');
    }

    if (!/[@$!%*?&]/.test(password)) {
        errors.push('at least 1 special character (@$!%*?&)');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};



// Forgot password
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    const { email }: { email: string } = req.body;

    if (!email) {
        res.status(400).json({
            success: false,
            message: "Email is required",
        });
        return;
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(email)) {
        res.status(400).json({
            success: false,
            message: "Please enter a valid email address"
        });
        return;
    }

    try {
        const user = await User.findOne({ email });

        // Security measure: don't reveal if email exists
        if (!user) {
            res.status(200).json({
                success: true,
                message: "Password reset email sent."
            });
            return;
        }

        //  Cooldown check (10 minutes)
        if (user.lastResetRequest && dayjs().diff(user.lastResetRequest, "minute") < 10) {
            res.status(429).json({
                success: false,
                message: "Please wait 10 minutes before requesting another reset email",
            });
            return;
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenExp = dayjs().add(15, "minute").toDate(); // expires in 15 minutes

        // Save token + expiry in DB
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExp;
        user.lastResetRequest = dayjs().toDate();

        await user.save();

        // Reset link with safe FRONTEND_URL fallback
        const frontendBaseUrl = (process.env.FRONTEND_URL && process.env.FRONTEND_URL.trim())
            || (process.env.APP_URL && process.env.APP_URL.trim())
            || 'http://localhost:3000';
        const resetUrl = `${frontendBaseUrl}/reset-password/${encodeURIComponent(resetToken)}`;

        // Send password reset email using the new template
        await emailService.sendPasswordResetEmail(user.email, resetUrl, user.name);

        res.status(200).json({ success: true, message: "Password reset email sent." });
    } catch (err: any) {
        console.error("Forgot password error:", err.message);
        res.status(500).json({
            success: false,
            message: "Something went wrong. Please try again later.",
        });
    }
};


//rest Password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    const { token, newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
        res.status(400).json({
            success: false,
            message: 'Both password fields are required'
        });
        return;
    }

    if (newPassword !== confirmPassword) {
        res.status(400).json({
            success: false,
            message: "Passwords do not match"
        })
        return;
    }

    // Validate password strength with detailed feedback
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
        res.status(400).json({
            success: false,
            message: `Password must contain ${passwordValidation.errors.join(', ')}`
        });
        return;
    }

    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: dayjs().toDate() }, // check not expired
        });

        if (!user) {
            res.status(400).json({
                success: false,
                message: "Invalid or expired token"
            });
            return;
        }

        user.password = newPassword; // will be hashed by pre-save hook
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.json({ success: true, message: "Password reset successful" });
    } catch (err: any) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
};


// Register new user

// Register new user (sends OTP)


// Register new user (sends OTP)

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
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        if (!emailRegex.test(email)) {
            res.status(400).json({
                success: false,
                message: 'Please enter a valid email address'
            });
            return;
        }

        // Validate password strength with detailed feedback
        const passwordValidation = validatePasswordStrength(password);
        if (!passwordValidation.isValid) {
            res.status(400).json({
                success: false,
                message: `Password must contain ${passwordValidation.errors.join(', ')}`
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

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = calculateOTPExpiration();

        // Save OTP to database with registration data
        const newOTP = new OTP({
            email: email.toLowerCase().trim(),
            otp,
            expiresAt,
            registrationData: {
                name: name.trim(),
                password: password // This will be hashed when user is created
            }
        });

        await newOTP.save();

        // Send OTP email
        try {
            await emailService.sendOTPEmail(email, otp, name);
        } catch (emailError) {
            // If email fails, delete the OTP and return error
            await OTP.findByIdAndDelete(newOTP._id);
            res.status(500).json({
                success: false,
                message: 'Failed to send OTP email. Please try again.'
            });
            return;
        }

        // Return success response
        res.status(200).json({
            success: true,
            message: 'OTP sent successfully. Please check your email to complete registration.',
            data: {
                email: email.toLowerCase().trim(),
                expiresIn: '10 minutes'
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

// Verify OTP and complete registration
export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, otp }: VerifyOTPRequest = req.body;

        // Validate required fields
        if (!email || !otp) {
            res.status(400).json({
                success: false,
                message: 'Email and OTP are required'
            });
            return;
        }

        // Validate OTP format
        if (!validateOTPFormat(otp)) {
            res.status(400).json({
                success: false,
                message: 'Invalid OTP format. Please enter a 6-digit code.'
            });
            return;
        }

        // Find the OTP record
        const otpRecord = await OTP.findOne({
            email: email.toLowerCase().trim(),
            otp,
            isUsed: false
        }).sort({ createdAt: -1 });

        if (!otpRecord) {
            res.status(400).json({
                success: false,
                message: 'Invalid OTP or email combination'
            });
            return;
        }

        // Check if OTP is expired
        if (isOTPExpired(otpRecord.expiresAt)) {
            res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new one.'

            });
            return;
        }

        // Check if registration data exists
        if (!otpRecord.registrationData) {
            res.status(400).json({
                success: false,
                message: 'Registration data not found. Please register again.'

            });
            return;
        }

        // Mark OTP as used
        otpRecord.isUsed = true;
        await otpRecord.save();

        // Create new user using stored registration data
        const newUser = new User({
            name: otpRecord.registrationData.name,
            email: email.toLowerCase().trim(),
            password: otpRecord.registrationData.password,
            isEmailVerified: true,
            emailVerifiedAt: new Date()
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
            message: 'Email verified and account created successfully',
            data: {
                user: {
                    id: savedUser._id,
                    name: savedUser.name,
                    email: savedUser.email,
                    isEmailVerified: savedUser.isEmailVerified,
                    emailVerifiedAt: savedUser.emailVerifiedAt
                },
                token
            }
        });

    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during OTP verification'
        });
    }
};

// Resend OTP
export const resendOTP = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email }: { email: string } = req.body;

        // Validate required fields
        if (!email) {
            res.status(400).json({
                success: false,
                message: 'Email is required'
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

        // Find existing OTP record
        const existingOTP = await OTP.findOne({
            email: email.toLowerCase().trim(),
            isUsed: false
        });

        if (!existingOTP) {
            res.status(400).json({
                success: false,
                message: 'No pending registration found for this email. Please register first.'
            });
            return;
        }

        // Generate new OTP
        const otp = generateOTP();
        const expiresAt = calculateOTPExpiration();

        // Update existing OTP record
        existingOTP.otp = otp;
        existingOTP.expiresAt = expiresAt;
        await existingOTP.save();

        // Send OTP email
        try {
            await emailService.sendOTPEmail(email, otp, existingOTP.registrationData?.name || 'User');
        } catch (emailError) {
            res.status(500).json({
                success: false,
                message: 'Failed to send OTP email. Please try again.'
            });
            return;
        }

        // Return success response
        res.status(200).json({
            success: true,
            message: 'New OTP sent successfully. Please check your email.',
            data: {
                email: email.toLowerCase().trim(),
                expiresIn: '10 minutes'
            }
        });

    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while resending OTP'
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
                    avatarUrl: user.avatarUrl,
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
                    avatarUrl: user.avatarUrl,
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


// Update user profile
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user;

        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }

        const { name, email, password } = req.body;

        // Find user freshly to ensure consistent state
        const userToUpdate = await User.findById(user._id);
        if (!userToUpdate) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }

        // Validate email format if provided
        if (email && email !== userToUpdate.email) {
            const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
            if (!emailRegex.test(email)) {
                res.status(400).json({
                    success: false,
                    message: 'Please enter a valid email address'
                });
                return;
            }

            // Check if email is taken
            const existingUser = await User.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                res.status(409).json({
                    success: false,
                    message: 'Email already in use'
                });
                return;
            }
            userToUpdate.email = email.toLowerCase();
        }

        // Update name if provided
        if (name) {
            userToUpdate.name = name;
        }

        // Update password if provided
        if (password) {
            // Validate password strength
            const passwordValidation = validatePasswordStrength(password);
            if (!passwordValidation.isValid) {
                res.status(400).json({
                    success: false,
                    message: `Password must contain ${passwordValidation.errors.join(', ')}`
                });
                return;
            }
            userToUpdate.password = password; // Pre-save hook will hash this
        }

        await userToUpdate.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: {
                    id: userToUpdate._id,
                    name: userToUpdate.name,
                    email: userToUpdate.email,
                    avatarUrl: userToUpdate.avatarUrl,
                    settings: userToUpdate.settings,
                    streak: userToUpdate.streak
                }
            }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating profile'
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

// Helper to delete an avatar file from Cloudinary or disk
const deleteAvatarFileIfExists = async (avatarUrl?: string | null): Promise<void> => {
    if (!avatarUrl) return;

    // Check if it's a Cloudinary URL
    if (avatarUrl.includes('cloudinary.com')) {
        try {
            // Extract public_id from URL (e.g., avatars/public_id)
            const parts = avatarUrl.split('/');
            const uploadIndex = parts.indexOf('upload');
            if (uploadIndex !== -1 && parts.length > uploadIndex + 2) {
                // Join the parts after version (e.g., v123/avatars/id -> avatars/id)
                const publicIdWithExtension = parts.slice(uploadIndex + 2).join('/');
                const publicId = publicIdWithExtension.split('.')[0];

                if (publicId) {
                    const result = await cloudinary.uploader.destroy(publicId);
                    console.log(`🗑️ Cloudinary file deleted: ${publicId}`, result);
                }
            }
        } catch (error) {
            console.error('Error deleting Cloudinary avatar:', error);
        }
        return;
    }

    // Fallback for local disk storage (legacy)
    const segment = '/uploads/avatars/';
    const segmentIndex = avatarUrl.indexOf(segment);
    if (segmentIndex === -1) return;

    const filename = avatarUrl.substring(segmentIndex + segment.length);
    if (!filename) return;

    const avatarsDir = path.join(__dirname, '..', '..', 'uploads', 'avatars');
    const filePath = path.join(avatarsDir, filename);

    fs.unlink(filePath, (err) => {
        if (err && (err as any).code !== 'ENOENT') {
            console.error('Error deleting local avatar file:', err);
        }
    });
};

// Upload or update user profile avatar
export const uploadAvatar = async (
    // Handle avatar upload
    req: Request & { file?: any; files?: any },
    res: Response
): Promise<void> => {
    try {
        const user = req.user;

        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }

        // Handle both .single('avatar') and .fields([{ name: 'avatar' }, { name: 'Avatar' }])
        let file = req.file;

        if (!file && req.files) {
            // Check for avatar or Avatar fields when using .fields()
            const avatarFiles = req.files.avatar || req.files.Avatar;
            if (avatarFiles && avatarFiles.length > 0) {
                file = avatarFiles[0];
            }
        }

        if (!file) {
            res.status(400).json({
                success: false,
                message: 'No image file uploaded'
            });
            return;
        }

        // Remove previous avatar file if present
        if (user.avatarUrl) {
            await deleteAvatarFileIfExists(user.avatarUrl);
        }

        // When using Cloudinary storage, file.path contains the full secure URL
        // We log it for debugging, but we strictly use the path provided by Cloudinary.
        console.log('🖼️ Upload File Info:', JSON.stringify(file, null, 2));

        // In multer-storage-cloudinary, 'path' is usually the HTTPS URL.
        // But some versions or configs might use 'secure_url' or 'url'.
        const avatarUrl = file.path || file.secure_url || file.url;

        if (!avatarUrl) {
            console.error('❌ Cloudinary did not return a path/url');
            console.error('📄 File object structure:', JSON.stringify(file, null, 2));
            res.status(500).json({
                success: false,
                message: 'Image upload failed: no URL returned'
            });
            return;
        }

        user.avatarUrl = avatarUrl;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile image updated successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    avatarUrl: user.avatarUrl,
                    settings: user.settings,
                    streak: user.streak
                }
            }
        });
    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while uploading avatar'
        });
    }
};

// Delete the current user's avatar
export const deleteAvatar = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user;

        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }

        if (!user.avatarUrl) {
            res.status(400).json({
                success: false,
                message: 'No avatar to delete'
            });
            return;
        }

        // Delete file from disk or Cloudinary
        await deleteAvatarFileIfExists(user.avatarUrl);

        user.avatarUrl = null as any;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile image deleted successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    avatarUrl: user.avatarUrl,
                    settings: user.settings,
                    streak: user.streak
                }
            }
        });
    } catch (error) {
        console.error('Delete avatar error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while deleting avatar'
        });
    }
};

// Social login: Google (expects id_token from client)
export const loginWithGoogle = async (req: Request, res: Response): Promise<void> => {
    try {
        const { idToken } = req.body as { idToken: string };
        if (!idToken) {
            res.status(400).json({ success: false, message: 'idToken is required' });
            return;
        }

        // Verify token with Google tokeninfo endpoint
        const tokenInfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
        const { data } = await axios.get(tokenInfoUrl, { timeout: 10000 });

        if (GOOGLE_CLIENT_ID && data.aud !== GOOGLE_CLIENT_ID) {
            res.status(401).json({ success: false, message: 'Invalid Google token (aud mismatch)' });
            return;
        }

        const googleId: string = data.sub;
        const email: string | undefined = data.email;
        const name: string | undefined = data.name || data.given_name || 'User';
        const avatarUrl: string | undefined = data.picture;

        if (!googleId) {
            res.status(401).json({ success: false, message: 'Invalid Google token' });
            return;
        }

        // Find or create user
        let user = await User.findOne({ $or: [{ googleId }, email ? { email: email.toLowerCase() } : {}] }).exec();
        if (!user) {
            user = new User({
                name,
                email: email ? email.toLowerCase() : `${googleId}@google.local`,
                password: undefined,
                googleId,
                authProvider: 'google',
                isEmailVerified: !!data.email_verified,
                emailVerifiedAt: data.email_verified ? new Date() : null,
                avatarUrl
            } as any);
        } else {
            user.googleId = user.googleId || googleId;
            user.authProvider = user.authProvider || 'google';
            if (avatarUrl && !user.avatarUrl) user.avatarUrl = avatarUrl;
            if (email && !user.email) user.email = email.toLowerCase();
        }

        const saved = await user.save();
        const token = generateToken({ userId: (saved._id as any).toString(), email: saved.email, name: saved.name });

        res.status(200).json({
            success: true,
            message: 'Login with Google successful',
            data: {
                user: { id: saved._id, name: saved.name, email: saved.email, avatarUrl: saved.avatarUrl },
                token
            }
        });
    } catch (error: any) {
        console.error('Google login error:', error?.response?.data || error?.message || error);
        res.status(401).json({ success: false, message: 'Google token verification failed' });
    }
};

// Social login: Facebook (expects accessToken from client)
export const loginWithFacebook = async (req: Request, res: Response): Promise<void> => {
    try {
        const { accessToken } = req.body as { accessToken: string };
        if (!accessToken) {
            res.status(400).json({ success: false, message: 'accessToken is required' });
            return;
        }

        // Optionally validate token belongs to our app
        if (FACEBOOK_APP_ID && FACEBOOK_APP_SECRET) {
            const appToken = `${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`;
            const debugUrl = `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(appToken)}`;
            const debugRes = await axios.get(debugUrl, { timeout: 10000 });
            const isValid = debugRes.data?.data?.is_valid;
            const appId = debugRes.data?.data?.app_id;
            if (!isValid || (FACEBOOK_APP_ID && appId !== FACEBOOK_APP_ID)) {
                res.status(401).json({ success: false, message: 'Invalid Facebook token' });
                return;
            }
        }

        // Fetch user profile
        const profileUrl = `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${encodeURIComponent(accessToken)}`;
        const { data: fb } = await axios.get(profileUrl, { timeout: 10000 });
        const facebookId: string = fb.id;
        const name: string = fb.name || 'User';
        const email: string | undefined = fb.email;
        const avatarUrl: string | undefined = fb.picture?.data?.url;

        if (!facebookId) {
            res.status(401).json({ success: false, message: 'Invalid Facebook token' });
            return;
        }

        let user = await User.findOne({ $or: [{ facebookId }, email ? { email: email.toLowerCase() } : {}] }).exec();
        if (!user) {
            user = new User({
                name,
                email: email ? email.toLowerCase() : `${facebookId}@facebook.local`,
                password: undefined,
                facebookId,
                authProvider: 'facebook',
                isEmailVerified: !!email,
                emailVerifiedAt: email ? new Date() : null,
                avatarUrl
            } as any);
        } else {
            user.facebookId = user.facebookId || facebookId;
            user.authProvider = user.authProvider || 'facebook';
            if (avatarUrl && !user.avatarUrl) user.avatarUrl = avatarUrl;
            if (email && !user.email) user.email = email.toLowerCase();
        }

        const saved = await user.save();
        const token = generateToken({ userId: (saved._id as any).toString(), email: saved.email, name: saved.name });

        res.status(200).json({
            success: true,
            message: 'Login with Facebook successful',
            data: { user: { id: saved._id, name: saved.name, email: saved.email, avatarUrl: saved.avatarUrl }, token }
        });
    } catch (error: any) {
        console.error('Facebook login error:', error?.response?.data || error?.message || error);
        res.status(401).json({ success: false, message: 'Facebook token verification failed' });
    }
};

// Social login: Telegram (expects Telegram login widget payload)
export const loginWithTelegram = async (req: Request, res: Response): Promise<void> => {
    try {
        const payload = req.body as Record<string, any>;
        // Telegram sends id, first_name, last_name, username, photo_url, auth_date, hash
        const { id, first_name, last_name, username, photo_url, auth_date, hash } = payload as any;

        if (!id || !auth_date || !hash) {
            res.status(400).json({ success: false, message: 'Invalid Telegram payload' });
            return;
        }
        if (!TELEGRAM_BOT_TOKEN) {
            res.status(500).json({ success: false, message: 'Server is not configured for Telegram login' });
            return;
        }

        // Verify hash per Telegram docs
        const dataCheckArr = Object.keys(payload)
            .filter((k) => k !== 'hash' && payload[k] !== undefined && payload[k] !== null)
            .sort()
            .map((k) => `${k}=${payload[k]}`);
        const dataCheckString = dataCheckArr.join('\n');
        const secret = crypto.createHash('sha256').update(TELEGRAM_BOT_TOKEN).digest();
        const hmac = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
        if (hmac !== hash) {
            res.status(401).json({ success: false, message: 'Telegram hash verification failed' });
            return;
        }

        const telegramId = String(id);
        const name = [first_name, last_name].filter(Boolean).join(' ') || username || 'Telegram User';
        const avatarUrl = photo_url;
        // Telegram does not provide email
        let user = await User.findOne({ telegramId }).exec();
        if (!user) {
            user = new User({
                name,
                email: `${telegramId}@telegram.local`,
                password: undefined,
                telegramId,
                authProvider: 'telegram',
                isEmailVerified: false,
                avatarUrl
            } as any);
        } else {
            user.authProvider = user.authProvider || 'telegram';
            if (avatarUrl && !user.avatarUrl) user.avatarUrl = avatarUrl;
        }

        const saved = await user.save();
        const token = generateToken({ userId: (saved._id as any).toString(), email: saved.email, name: saved.name });

        res.status(200).json({
            success: true,
            message: 'Login with Telegram successful',
            data: { user: { id: saved._id, name: saved.name, email: saved.email, avatarUrl: saved.avatarUrl }, token }
        });
    } catch (error: any) {
        console.error('Telegram login error:', error?.message || error);
        res.status(401).json({ success: false, message: 'Telegram verification failed' });
    }
};
