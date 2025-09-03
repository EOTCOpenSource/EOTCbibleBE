import mongoose from 'mongoose';
import { OTP } from '../models/otp.model';
import { generateOTP, validateOTPFormat, calculateOTPExpiration, isOTPExpired } from '../utils/otpUtils';

describe('OTP Utilities', () => {
    test('should generate a 6-digit OTP', () => {
        const otp = generateOTP();
        expect(otp).toMatch(/^\d{6}$/);
        expect(otp.length).toBe(6);
    });

    test('should validate correct OTP format', () => {
        expect(validateOTPFormat('123456')).toBe(true);
        expect(validateOTPFormat('000000')).toBe(true);
        expect(validateOTPFormat('999999')).toBe(true);
    });

    test('should reject invalid OTP format', () => {
        expect(validateOTPFormat('12345')).toBe(false);  // too short
        expect(validateOTPFormat('1234567')).toBe(false); // too long
        expect(validateOTPFormat('abcdef')).toBe(false);  // letters
        expect(validateOTPFormat('12 345')).toBe(false);  // spaces
        expect(validateOTPFormat('')).toBe(false);        // empty
    });

    test('should calculate OTP expiration time', () => {
        const now = new Date();
        const expiration = calculateOTPExpiration();

        expect(expiration.getTime()).toBeGreaterThan(now.getTime());

        // Should be approximately 10 minutes from now
        const timeDiff = expiration.getTime() - now.getTime();
        const minutesDiff = timeDiff / (1000 * 60);
        expect(minutesDiff).toBeCloseTo(10, 0);
    });

    test('should check if OTP is expired', () => {
        const now = new Date();
        const future = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
        const past = new Date(now.getTime() - 5 * 60 * 1000);   // 5 minutes ago

        expect(isOTPExpired(future)).toBe(false);
        expect(isOTPExpired(past)).toBe(true);
    });
});

describe('OTP Model', () => {
    test('should create OTP with required fields', async () => {
        const otpData = {
            email: 'test@example.com',
            otp: '123456',
            expiresAt: calculateOTPExpiration()
        };

        const otp = new OTP(otpData);
        const savedOTP = await otp.save();

        expect(savedOTP.email).toBe(otpData.email);
        expect(savedOTP.otp).toBe(otpData.otp);
        expect(savedOTP.isUsed).toBe(false);
        expect(savedOTP.createdAt).toBeDefined();

        // Clean up
        await OTP.findByIdAndDelete(savedOTP._id);
    });

    test('should check if OTP is expired using model method', async () => {
        const pastDate = new Date();
        pastDate.setMinutes(pastDate.getMinutes() - 5); // 5 minutes ago

        const otp = new OTP({
            email: 'test@example.com',
            otp: '123456',
            expiresAt: pastDate
        });

        expect(otp.isExpired()).toBe(true);
    });

    test('should find OTP by email and OTP code', async () => {
        const otpData = {
            email: 'test@example.com',
            otp: '123456',
            expiresAt: calculateOTPExpiration()
        };

        const savedOTP = await new OTP(otpData).save();

        const foundOTP = await OTP.findOne({
            email: 'test@example.com',
            otp: '123456',
            isUsed: false
        });

        expect(foundOTP).toBeDefined();
        expect(foundOTP?.email).toBe(otpData.email);
        expect(foundOTP?.otp).toBe(otpData.otp);

        // Clean up
        await OTP.findByIdAndDelete(savedOTP._id);
    });

    test('should mark OTP as used', async () => {
        const otp = new OTP({
            email: 'test@example.com',
            otp: '123456',
            expiresAt: calculateOTPExpiration()
        });

        await otp.save();
        expect(otp.isUsed).toBe(false);

        otp.isUsed = true;
        await otp.save();

        const updatedOTP = await OTP.findById(otp._id);
        expect(updatedOTP?.isUsed).toBe(true);

        // Clean up
        await OTP.findByIdAndDelete(otp._id);
    });
});
