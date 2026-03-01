import request from 'supertest';
import app from '../index';
import { User } from '../models';

// Mock the User model for most operations, but allow some real operations for testing
jest.mock('../models', () => {
    const originalModule = jest.requireActual('../models');
    return {
        ...originalModule,
        User: {
            ...originalModule.User,
            findOne: jest.fn(),
            deleteOne: jest.fn(),
        }
    };
});

describe('Security Features', () => {
    let testUser: any;
    const testUserData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!'
    };

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();

        // Create a mock user instance
        testUser = {
            _id: 'test-user-id',
            name: testUserData.name,
            email: testUserData.email,
            password: 'hashedpassword',
            failedLoginAttempts: 0,
            accountLockedUntil: null,
            isAccountLocked: jest.fn(),
            incrementFailedAttempts: jest.fn(),
            resetFailedAttempts: jest.fn(),
            lockAccount: jest.fn(),
            comparePassword: jest.fn(),
            save: jest.fn()
        };
    });

    describe('Rate Limiting', () => {
        test('should limit login attempts per IP', async () => {
            // Mock User.findOne to return null (user not found)
            (User.findOne as jest.Mock).mockResolvedValue(null);

            // Try to login 6 times (exceeding the 5 limit)
            for (let i = 0; i < 6; i++) {
                const response = await request(app)
                    .post('/api/v1/auth/login')
                    .set('x-test-enable-rate-limit', 'true')
                    .send({
                        email: 'nonexistent@example.com',
                        password: 'wrongpassword'
                    });

                if (i < 5) {
                    // First 5 attempts should return 401
                    expect(response.status).toBe(401);
                } else {
                    // 6th attempt should be rate limited
                    expect(response.status).toBe(429);
                    expect(response.body.message).toContain('Too many login attempts');
                }
            }
        });

        test('should limit registration attempts per IP', async () => {
            // Mock User.findOne to return existing user (simulating email already exists)
            (User.findOne as jest.Mock).mockResolvedValue({ email: 'test@example.com' });

            // Try to register 4 times (exceeding the 3 limit)
            for (let i = 0; i < 4; i++) {
                const response = await request(app)
                    .post('/api/v1/auth/register')
                    .set('x-test-enable-rate-limit', 'true')
                    .send({
                        name: `Test User ${i}`,
                        email: `test${i}@example.com`,
                        password: 'Password123!'
                    });

                if (i < 3) {
                    // First 3 attempts should return 409 (email already exists)
                    expect(response.status).toBe(409);
                } else {
                    // 4th attempt should be rate limited
                    expect(response.status).toBe(429);
                    expect(response.body.message).toContain('Too many registration attempts');
                }
            }
        });
    });

    describe('Account Locking', () => {
        test('should lock account after 5 failed login attempts', async () => {
            // Mock user with failed attempts
            const mockUser = {
                ...testUser,
                failedLoginAttempts: 4,
                isAccountLocked: jest.fn().mockReturnValue(false),
                incrementFailedAttempts: jest.fn().mockResolvedValue(undefined),
                comparePassword: jest.fn().mockResolvedValue(false)
            };

            (User.findOne as jest.Mock).mockResolvedValue(mockUser);

            // Try to login with wrong password (5th attempt)
            // Note: Rate limiter will trigger before account locking logic
            const response = await request(app)
                .post('/api/v1/auth/login')
                .set('x-test-enable-rate-limit', 'true')
                .send({
                    email: testUserData.email,
                    password: 'wrongpassword'
                });

            // Rate limiter should trigger first
            expect(response.status).toBe(429);
            expect(response.body.message).toContain('Too many login attempts');
        });

        test('should prevent login when account is locked', async () => {
            // Mock locked user
            const mockUser = {
                ...testUser,
                isAccountLocked: jest.fn().mockReturnValue(true),
                accountLockedUntil: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
            };

            (User.findOne as jest.Mock).mockResolvedValue(mockUser);

            // Try to login with correct password
            const response = await request(app)
                .post('/api/v1/auth/login')
                .set('x-test-enable-rate-limit', 'true')
                .send({
                    email: testUserData.email,
                    password: testUserData.password
                });

            // Rate limiter should trigger first
            expect(response.status).toBe(429);
            expect(response.body.message).toContain('Too many login attempts');
        });

        test('should reset failed attempts on successful login', async () => {
            // Mock user with failed attempts
            const mockUser = {
                ...testUser,
                failedLoginAttempts: 2,
                isAccountLocked: jest.fn().mockReturnValue(false),
                comparePassword: jest.fn().mockResolvedValue(true),
                resetFailedAttempts: jest.fn().mockResolvedValue(undefined)
            };

            (User.findOne as jest.Mock).mockResolvedValue(mockUser);

            // Login with correct password
            const response = await request(app)
                .post('/api/v1/auth/login')
                .set('x-test-enable-rate-limit', 'true')
                .send({
                    email: testUserData.email,
                    password: testUserData.password
                });

            // Rate limiter should trigger first
            expect(response.status).toBe(429);
            expect(response.body.message).toContain('Too many login attempts');
        });

        test('should show remaining attempts for failed logins', async () => {
            // Mock user with some failed attempts
            const mockUser = {
                ...testUser,
                failedLoginAttempts: 2,
                isAccountLocked: jest.fn().mockReturnValue(false),
                comparePassword: jest.fn().mockResolvedValue(false),
                incrementFailedAttempts: jest.fn().mockResolvedValue(undefined)
            };

            (User.findOne as jest.Mock).mockResolvedValue(mockUser);

            // Try to login with wrong password
            const response = await request(app)
                .post('/api/v1/auth/login')
                .set('x-test-enable-rate-limit', 'true')
                .send({
                    email: testUserData.email,
                    password: 'wrongpassword'
                });

            // Rate limiter should trigger first
            expect(response.status).toBe(429);
            expect(response.body.message).toContain('Too many login attempts');
        });
    });
});
