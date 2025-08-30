import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// TypeScript interface for User
export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    googleId?: string;
    settings: {
        theme: string;
        fontSize: number;
    };
    streak: {
        current: number;
        longest: number;
        lastDate: Date;
    };
     
  resetPasswordToken?: string | undefined;
  resetPasswordExpires?: Date | undefined; 
  lastResetRequest?: Date;
    

    comparePassword(candidatePassword: string): Promise<boolean>;
}

// User schema
const userSchema = new Schema<IUser>({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },

    resetPasswordToken: { type: String, required: false },
    resetPasswordExpires: { type: Number, required: false },
    lastResetRequest: {type: Date},


    googleId: {
        type: String,
        sparse: true
    },
    settings: {
        theme: {
            type: String,
            default: 'light',
            enum: ['light', 'dark']
        },
        fontSize: {
            type: Number,
            default: 16,
            min: [12, 'Font size must be at least 12'],
            max: [24, 'Font size cannot exceed 24']
        }
    },
    streak: {
        current: {
            type: Number,
            default: 0,
            min: 0
        },
        longest: {
            type: Number,
            default: 0,
            min: 0
        },
        lastDate: {
            type: Date,
            default: null
        }
    }
}, {
    timestamps: true
});

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();

    try {
        // Hash password with cost of 12
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error as Error);
    }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

// Note: email index is already created by unique: true
// googleId index can be added later if needed for performance

export const User = mongoose.model<IUser>('User', userSchema);
