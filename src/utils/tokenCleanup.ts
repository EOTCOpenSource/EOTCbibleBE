import { BlacklistedToken } from '../models';

/**
 * Cleanup expired blacklisted tokens
 * This function should be called periodically (e.g., daily) to clean up expired tokens
 */
export const cleanupExpiredTokens = async (): Promise<void> => {
    try {
        const result = await BlacklistedToken.cleanupExpiredTokens();
        console.log('✅ Cleaned up expired blacklisted tokens');
    } catch (error) {
        console.error('❌ Error cleaning up expired tokens:', error);
    }
};

/**
 * Get count of blacklisted tokens
 */
export const getBlacklistedTokenCount = async (): Promise<number> => {
    try {
        return await BlacklistedToken.countDocuments();
    } catch (error) {
        console.error('❌ Error getting blacklisted token count:', error);
        return 0;
    }
};
