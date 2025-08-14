const request = require('supertest');
const app = require('../server');

// Mock environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_EXPIRE = '24h';

describe('API Endpoints', () => {
    describe('Health Check', () => {
        it('should return health status', async () => {
            const response = await request(app)
                .get('/api/v1/health')
                .expect(200);

            expect(response.body).toHaveProperty('status', 'OK');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('database');
        }, 10000);
    });

    describe('Welcome Route', () => {
        it('should return welcome message', async () => {
            const response = await request(app)
                .get('/')
                .expect(200);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('Bible Backend API');
        }, 10000);
    });

    describe('Authentication Endpoints', () => {
        describe('POST /api/v1/auth/register', () => {
            it('should return 400 for missing required fields', async () => {
                const response = await request(app)
                    .post('/api/v1/auth/register')
                    .send({ name: 'Test User' })
                    .expect(400);

                expect(response.body).toHaveProperty('success', false);
                expect(response.body).toHaveProperty('message', 'Please provide name, email, and password');
            }, 10000);

            it('should return 400 for empty request body', async () => {
                const response = await request(app)
                    .post('/api/v1/auth/register')
                    .send({})
                    .expect(400);

                expect(response.body).toHaveProperty('success', false);
                expect(response.body).toHaveProperty('message', 'Please provide name, email, and password');
            }, 10000);
        });

        describe('POST /api/v1/auth/login', () => {
            it('should return 400 for missing credentials', async () => {
                const response = await request(app)
                    .post('/api/v1/auth/login')
                    .send({ email: 'test@example.com' })
                    .expect(400);

                expect(response.body).toHaveProperty('success', false);
                expect(response.body).toHaveProperty('message', 'Please provide email and password');
            }, 10000);

            it('should return 400 for empty request body', async () => {
                const response = await request(app)
                    .post('/api/v1/auth/login')
                    .send({})
                    .expect(400);

                expect(response.body).toHaveProperty('success', false);
                expect(response.body).toHaveProperty('message', 'Please provide email and password');
            }, 10000);
        });

        describe('GET /api/v1/auth/me', () => {
            it('should return 401 without authentication token', async () => {
                const response = await request(app)
                    .get('/api/v1/auth/me')
                    .expect(401);

                expect(response.body).toHaveProperty('success', false);
                expect(response.body).toHaveProperty('message', 'Access token required');
            }, 10000);

            it('should return 401 with invalid token', async () => {
                const response = await request(app)
                    .get('/api/v1/auth/me')
                    .set('Authorization', 'Bearer invalid-token')
                    .expect(401);

                expect(response.body).toHaveProperty('success', false);
                expect(response.body).toHaveProperty('message', 'Invalid token');
            }, 10000);
        });
    });

    describe('404 Handler', () => {
        it('should return 404 for non-existent routes', async () => {
            const response = await request(app)
                .get('/non-existent-route')
                .expect(404);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error', 'Route not found');
        }, 10000);
    });
});
