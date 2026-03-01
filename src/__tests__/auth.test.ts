import request from 'supertest';
import app from '../index';
import * as jwt from 'jsonwebtoken';
import { User, Progress, Bookmark, Note, Highlight, Topic } from '../models';

// Mock the models to avoid database operations in tests
jest.mock('../models', () => ({
    User: {
        findOne: jest.fn(),
        findById: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue(null)
        }),
        findByIdAndDelete: jest.fn(),
        deleteMany: jest.fn(),
    },
    Progress: {
        deleteMany: jest.fn(),
    },
    Bookmark: {
        deleteMany: jest.fn(),
    },
    Note: {
        deleteMany: jest.fn(),
    },
    Highlight: {
        deleteMany: jest.fn(),
    },
    Topic: {
        deleteMany: jest.fn(),
    },
    BlacklistedToken: {
        isBlacklisted: jest.fn().mockResolvedValue(false),
        blacklistToken: jest.fn(),
        cleanupExpiredTokens: jest.fn(),
    },
}));

// Mock JWT secret for testing - use same default as application
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

describe('Auth Routes', () => {
    // Note: These tests are basic endpoint tests
    // Full integration tests would require a test database setup

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    describe('POST /api/v1/auth/register', () => {
        it('should return 400 for missing required fields', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    name: 'John Doe',
                    email: 'john@example.com'
                    // missing password
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Name, email, and password are required');
        });

        it('should return 400 for invalid email format', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    name: 'John Doe',
                    email: 'invalid-email',
                    password: 'Password123!'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Please enter a valid email address');

        });

        it('should return 400 for short password', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    name: 'John Doe',
                    email: 'john@example.com',
                    password: '123'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Password must contain at least 8 characters, at least 1 lowercase letter, at least 1 uppercase letter, at least 1 special character (@$!%*?&)');
        });
    });

    describe('POST /api/v1/auth/login', () => {
        it('should return 400 for missing credentials', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'john@example.com'
                    // missing password
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Email and password are required');
        });
    });

    describe('GET /api/v1/auth/profile', () => {
        it('should return 401 when no token is provided', async () => {
            const response = await request(app)
                .get('/api/v1/auth/profile');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token is required');
        });

        it('should return 401 when invalid token is provided', async () => {
            const response = await request(app)
                .get('/api/v1/auth/profile')
                .set('Authorization', 'Bearer invalid-token');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid token');
        });
    });

    describe('POST /api/v1/auth/logout', () => {
        it('should return 401 when no token is provided', async () => {
            const response = await request(app)
                .post('/api/v1/auth/logout');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token is required');
        });

        it('should return 401 when invalid token is provided', async () => {
            const response = await request(app)
                .post('/api/v1/auth/logout')
                .set('Authorization', 'Bearer invalid-token');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid token');
        });

        it('should return 401 when expired token is provided', async () => {
            // Create an expired token by using a very short expiration
            const expiredToken = jwt.sign(
                {
                    userId: '123',
                    email: 'test@example.com',
                    name: 'Test User'
                },
                JWT_SECRET,
                { expiresIn: '0.001s' } // 1 millisecond - will expire immediately
            );

            // Wait a bit to ensure token expires
            await new Promise(resolve => setTimeout(resolve, 10));

            const response = await request(app)
                .post('/api/v1/auth/logout')
                .set('Authorization', `Bearer ${expiredToken}`);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid token');
        });

        it('should return 401 when user not found in database', async () => {
            // Create a valid token
            const validToken = jwt.sign(
                { userId: '123', email: 'test@example.com', name: 'Test User' },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            // Mock User.findById().select() to return null (user not found)
            const mockSelect = jest.fn().mockResolvedValue(null);
            (User.findById as jest.Mock).mockReturnValue({
                select: mockSelect
            });

            const response = await request(app)
                .post('/api/v1/auth/logout')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid token - user not found');
            expect(User.findById).toHaveBeenCalledWith('123');
            expect(mockSelect).toHaveBeenCalledWith('-password');
        });

        it('should return 200 and success message when valid token is provided', async () => {
            // Create a valid token
            const validToken = jwt.sign(
                { userId: '123', email: 'test@example.com', name: 'Test User' },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            // Mock user data
            const mockUser = {
                _id: '123',
                name: 'Test User',
                email: 'test@example.com',
                settings: {},
                streak: 0
            };

            // Mock User.findById().select() to return user
            const mockSelect = jest.fn().mockResolvedValue(mockUser);
            (User.findById as jest.Mock).mockReturnValue({
                select: mockSelect
            });

            const response = await request(app)
                .post('/api/v1/auth/logout')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Logout successful - token invalidated');
            expect(User.findById).toHaveBeenCalledWith('123');
            expect(mockSelect).toHaveBeenCalledWith('-password');
        });

        it('should return 500 when database error occurs', async () => {
            // Create a valid token
            const validToken = jwt.sign(
                { userId: '123', email: 'test@example.com', name: 'Test User' },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            // Mock User.findById().select() to throw an error
            const mockSelect = jest.fn().mockRejectedValue(new Error('Database error'));
            (User.findById as jest.Mock).mockReturnValue({
                select: mockSelect
            });

            const response = await request(app)
                .post('/api/v1/auth/logout')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Internal server error during authentication');
        });
    });

    describe('DELETE /api/v1/auth/account', () => {
        it('should return 401 when no token is provided', async () => {
            const response = await request(app)
                .delete('/api/v1/auth/account');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token is required');
        });

        it('should return 401 when invalid token is provided', async () => {
            const response = await request(app)
                .delete('/api/v1/auth/account')
                .set('Authorization', 'Bearer invalid-token');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid token');
        });

        it('should return 401 when expired token is provided', async () => {
            // Create an expired token by using a very short expiration
            const expiredToken = jwt.sign(
                {
                    userId: '123',
                    email: 'test@example.com',
                    name: 'Test User'
                },
                JWT_SECRET,
                { expiresIn: '0.001s' } // 1 millisecond - will expire immediately
            );

            // Wait a bit to ensure token expires
            await new Promise(resolve => setTimeout(resolve, 10));

            const response = await request(app)
                .delete('/api/v1/auth/account')
                .set('Authorization', `Bearer ${expiredToken}`);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid token');
        });

        it('should return 401 when user not found in database', async () => {
            // Create a valid token
            const validToken = jwt.sign(
                { userId: '123', email: 'test@example.com', name: 'Test User' },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            // Mock User.findById().select() to return null (user not found)
            const mockSelect = jest.fn().mockResolvedValue(null);
            (User.findById as jest.Mock).mockReturnValue({
                select: mockSelect
            });

            const response = await request(app)
                .delete('/api/v1/auth/account')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid token - user not found');
            expect(User.findById).toHaveBeenCalledWith('123');
            expect(mockSelect).toHaveBeenCalledWith('-password');
        });

        it('should successfully delete user account and all associated data', async () => {
            // Create a valid token
            const validToken = jwt.sign(
                { userId: '123', email: 'test@example.com', name: 'Test User' },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            // Mock user data
            const mockUser = {
                _id: '123',
                name: 'Test User',
                email: 'test@example.com',
                settings: {},
                streak: 0
            };

            // Mock User.findById().select() to return user
            const mockSelect = jest.fn().mockResolvedValue(mockUser);
            (User.findById as jest.Mock).mockReturnValue({
                select: mockSelect
            });

            // Mock all delete operations to return success
            (Progress.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 5 });
            (Bookmark.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 3 });
            (Note.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 10 });
            (Highlight.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 8 });
            (Topic.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 2 });
            (User.findByIdAndDelete as jest.Mock).mockResolvedValue(mockUser);

            const response = await request(app)
                .delete('/api/v1/auth/account')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Account and all associated data deleted successfully');

            // Verify all delete operations were called with correct userId
            expect(Progress.deleteMany).toHaveBeenCalledWith({ userId: '123' });
            expect(Bookmark.deleteMany).toHaveBeenCalledWith({ userId: '123' });
            expect(Note.deleteMany).toHaveBeenCalledWith({ userId: '123' });
            expect(Highlight.deleteMany).toHaveBeenCalledWith({ userId: '123' });
            expect(Topic.deleteMany).toHaveBeenCalledWith({ userId: '123' });
            expect(User.findByIdAndDelete).toHaveBeenCalledWith('123');
        });

        it('should return 500 when database error occurs during deletion', async () => {
            // Create a valid token
            const validToken = jwt.sign(
                { userId: '123', email: 'test@example.com', name: 'Test User' },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            // Mock user data
            const mockUser = {
                _id: '123',
                name: 'Test User',
                email: 'test@example.com',
                settings: {},
                streak: 0
            };

            // Mock User.findById().select() to return user
            const mockSelect = jest.fn().mockResolvedValue(mockUser);
            (User.findById as jest.Mock).mockReturnValue({
                select: mockSelect
            });

            // Mock Progress.deleteMany to throw an error
            (Progress.deleteMany as jest.Mock).mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .delete('/api/v1/auth/account')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Internal server error during account deletion');
        });

        it('should handle case where user has no associated data', async () => {
            // Create a valid token
            const validToken = jwt.sign(
                { userId: '123', email: 'test@example.com', name: 'Test User' },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            // Mock user data
            const mockUser = {
                _id: '123',
                name: 'Test User',
                email: 'test@example.com',
                settings: {},
                streak: 0
            };

            // Mock User.findById().select() to return user
            const mockSelect = jest.fn().mockResolvedValue(mockUser);
            (User.findById as jest.Mock).mockReturnValue({
                select: mockSelect
            });

            // Mock all delete operations to return 0 deleted records
            (Progress.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 0 });
            (Bookmark.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 0 });
            (Note.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 0 });
            (Highlight.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 0 });
            (Topic.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 0 });
            (User.findByIdAndDelete as jest.Mock).mockResolvedValue(mockUser);

            const response = await request(app)
                .delete('/api/v1/auth/account')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Account and all associated data deleted successfully');

            // Verify all delete operations were still called
            expect(Progress.deleteMany).toHaveBeenCalledWith({ userId: '123' });
            expect(Bookmark.deleteMany).toHaveBeenCalledWith({ userId: '123' });
            expect(Note.deleteMany).toHaveBeenCalledWith({ userId: '123' });
            expect(Highlight.deleteMany).toHaveBeenCalledWith({ userId: '123' });
            expect(Topic.deleteMany).toHaveBeenCalledWith({ userId: '123' });
            expect(User.findByIdAndDelete).toHaveBeenCalledWith('123');
        });
    });
});
