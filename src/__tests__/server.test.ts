import request from 'supertest';
import app from '../index';

describe('Server Routes', () => {
    describe('GET /', () => {
        it('should return server status', async () => {
            const response = await request(app).get('/');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('apiVersion');
            expect(response.body).toHaveProperty('endpoints');
            expect(response.body.message).toBe('TypeScript Backend is running!');
            expect(response.body.apiVersion).toBe('v1');
        });
    });

    describe('GET /api/v1/health', () => {
        it('should return combined health and database status', async () => {
            const response = await request(app).get('/api/v1/health');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('uptime');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('database');
            expect(['OK', 'DEGRADED']).toContain(response.body.status);
            expect(response.body.database).toHaveProperty('status');
            expect(['Connected', 'Disconnected']).toContain(response.body.database.status);
            expect(response.body).toHaveProperty('redis');
            expect(['Connected', 'Disconnected']).toContain(response.body.redis.status);
        });

        it('should include API version header', async () => {
            const response = await request(app).get('/api/v1/health');

            expect(response.headers['x-api-version']).toBe('v1');
        });
    });
});
