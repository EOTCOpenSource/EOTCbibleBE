import request from 'supertest';
import app from '../index';

describe('Auth Routes', () => {
    // Note: These tests are basic endpoint tests
    // Full integration tests would require a test database setup

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
                    password: 'password123'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Please provide a valid email address');
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
            expect(response.body.message).toBe('Password must be at least 6 characters long');
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
});
