import mongoose, { Document, Schema } from 'mongoose';

// TypeScript interface for OTP
export interface IOTP extends Document {
    email: string;
    otp: string;
    expiresAt: Date;
    isUsed: boolean;
    registrationData?: {
        name: string;
        password: string;
    };
    createdAt: Date;
    isExpired(): boolean;
}

// OTP schema
const otpSchema = new Schema<IOTP>({
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true
    },
    otp: {
        type: String,
        required: [true, 'OTP is required'],
        length: 6
    },
    expiresAt: {
        type: Date,
        required: [true, 'Expiration time is required'],
        index: { expireAfterSeconds: 0 } // MongoDB TTL index
    },
    isUsed: {
        type: Boolean,
        default: false
    },
    registrationData: {
        name: {
            type: String,
            required: false,
            trim: true
        },
        password: {
            type: String,
            required: false
        }
    }
}, {
    timestamps: true
});

// Method to check if OTP is expired
otpSchema.methods.isExpired = function (): boolean {
    return new Date() > this.expiresAt;
};

// Create indexes for better performance
otpSchema.index({ email: 1, createdAt: -1 });
otpSchema.index({ email: 1, otp: 1 });

export const OTP = mongoose.model<IOTP>('OTP', otpSchema);