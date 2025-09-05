import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendEmail } from "../utils/sendEmail";
import dayjs from 'dayjs';
import { User, IUser, Progress, Bookmark, Note, Highlight, Topic, BlacklistedToken, OTP } from '../models';
import { emailService } from '../utils/emailService';
import { generateOTP, validateOTPFormat, calculateOTPExpiration, isOTPExpired } from '../utils/otpUtils';




// JWT configuration from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

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
            message: 'Both password fields are required'
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
        resetPasswordExpires: { $gt: dayjs().toDate() }, // check not expired
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
