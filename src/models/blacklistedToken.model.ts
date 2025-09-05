import mongoose, { Document, Schema, Model } from 'mongoose';

// TypeScript interface for BlacklistedToken
export interface IBlacklistedToken extends Document {
    token: string;
    userId: string;
    blacklistedAt: Date;
    expiresAt: Date;
}

// Interface for static methods
export interface IBlacklistedTokenModel extends Model<IBlacklistedToken> {
    isBlacklisted(token: string): Promise<boolean>;
    blacklistToken(token: string, userId: string, expiresAt: Date): Promise<void>;
    cleanupExpiredTokens(): Promise<void>;
}

// BlacklistedToken schema
const blacklistedTokenSchema = new Schema<IBlacklistedToken>({
    token: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    blacklistedAt: {
        type: Date,
        default: Date.now,
        expires: 0 // No automatic expiration
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

// Index for automatic cleanup of expired tokens
blacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to check if token is blacklisted
blacklistedTokenSchema.statics.isBlacklisted = async function(token: string): Promise<boolean> {
    const blacklistedToken = await this.findOne({ token });
    return !!blacklistedToken;
};

// Static method to blacklist a token
blacklistedTokenSchema.statics.blacklistToken = async function(token: string, userId: string, expiresAt: Date): Promise<void> {
    await this.create({
        token,
        userId,
        expiresAt
    });
};

// Static method to cleanup expired tokens
blacklistedTokenSchema.statics.cleanupExpiredTokens = async function(): Promise<void> {
    await this.deleteMany({ expiresAt: { $lt: new Date() } });
};


export const BlacklistedToken = mongoose.model<IBlacklistedToken, IBlacklistedTokenModel>('BlacklistedToken', blacklistedTokenSchema);

