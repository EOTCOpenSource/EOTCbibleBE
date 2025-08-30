import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { User, IUser, Progress, Bookmark, Note, Highlight, Topic } from '../models';
import crypto from 'crypto';
import { sendEmail } from "../utils/sendEmail";
import dayjs from 'dayjs'

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
  
    try {
      const user = await User.findOne({ email });
  
      // Security measure: don't reveal if email exists
      if (!user) {
        res.json({
          success: true,
          message: "If an account exists, you will receive a reset email.",
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
  
      // Reset link
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  
      // Send email
      await sendEmail({
        to: user.email,
        subject: "Password Reset Request",
        html: `
          <h1>Reset your password</h1>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <a href="${resetUrl}" target="_blank">${resetUrl}</a>
          <p>This link will expire in 15 minutes.</p>
          <p>If you did not request this, you can safely ignore this email.</p>
          <h2>EOTC Team</h2>
        `,
      });
  
      res.json({ success: true, message: "Password reset email sent" });
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

    if(!newPassword || !confirmPassword){
        res.status(400).json({
            success: false,
            messsage: 'Both password fields are required'
        });
        return;
    }

    if(newPassword !== confirmPassword){
        res.status(400).json({
            success: false,
            message: "Passwords do not match"
        })
        return;
    }
  
    try {
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: dayjs().valueOf() }, // check not expired
      });
  
      if (!user) {
        res.status(400).json({
             success: false,
             message: "Invalid or expired token" });
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
        message: "Something went wrong" });
    }
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

// Logout user (placeholder implementation)
export const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        // In a stateless JWT implementation, logout is typically handled client-side
        // by removing the token from storage. This endpoint can be used for:
        // - Logging logout events
        // - Future implementation of token blacklisting
        // - Analytics tracking

        res.status(200).json({
            success: true,
            message: 'Logout successful'
        });

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
