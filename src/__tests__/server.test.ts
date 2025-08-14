import request from 'supertest';
import app from '../index';

describe('Server Routes', () => {
    describe('GET /', () => {
        it('should return server status', async () => {
            const response = await request(app).get('/');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('database');
            expect(response.body.message).toBe('TypeScript Backend is running!');
        });
    });

    describe('GET /health', () => {
        it('should return health status', async () => {
            const response = await request(app).get('/health');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('uptime');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('database');
            expect(response.body.status).toBe('OK');
        });
    });

    describe('GET /db-status', () => {
        it('should return database status', async () => {
            const response = await request(app).get('/db-status');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('database');
            expect(response.body).toHaveProperty('host');
            expect(response.body).toHaveProperty('port');
            expect(['Connected', 'Disconnected']).toContain(response.body.status);
        });
    });
});
