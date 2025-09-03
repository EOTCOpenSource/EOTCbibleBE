// Generate a random 6-digit OTP
export const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Validate OTP format (6 digits)
export const validateOTPFormat = (otp: string): boolean => {
    const otpRegex = /^\d{6}$/;
    return otpRegex.test(otp);
};

// Calculate OTP expiration time (10 minutes from now)
export const calculateOTPExpiration = (): Date => {
    const expiration = new Date();
    expiration.setMinutes(expiration.getMinutes() + 10);
    return expiration;
};

// Check if OTP is expired
export const isOTPExpired = (expiresAt: Date): boolean => {
    return new Date() > expiresAt;
};