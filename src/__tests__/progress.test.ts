import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import { User, Progress } from '../models';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

describe('Progress API Endpoints', () => {
    let authToken: string;
    let testUser: any;
    let testCounter = 0;

    beforeAll(async () => {
        // Clear test data
        await User.deleteMany({});
        await Progress.deleteMany({});
    });

    afterAll(async () => {
        // Clean up test data
        await User.deleteMany({});
        await Progress.deleteMany({});
    });

    beforeEach(async () => {
        // Clear all data before each test
        await User.deleteMany({});
        await Progress.deleteMany({});

        // Create test user with unique email
        testCounter++;
        testUser = new User({
            name: 'Progress Test User',
            email: `progress-test-${testCounter}@example.com`,
            password: 'Password123!',
            streak: {
                current: 0,
                longest: 0,
                lastDate: null
            }
        });
        await testUser.save();

        // Generate auth token
        authToken = jwt.sign(
            { userId: testUser._id.toString(), email: testUser.email, name: testUser.name },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
    });

    describe('POST /api/v1/progress/log-reading', () => {
        it('should log reading progress and start streak for first time reading', async () => {
            const readingData = {
                bookId: 'Genesis',
                chapter: 1
            };

            const response = await request(app)
                .post('/api/v1/progress/log-reading')
                .set('Authorization', `Bearer ${authToken}`)
                .send(readingData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Reading progress logged successfully');
            expect(response.body.data.progress.chaptersRead).toHaveProperty('Genesis:1');
            expect(response.body.data.streak.current).toBe(1);
            expect(response.body.data.streak.longest).toBe(1);
            expect(response.body.data.streak.lastDate).toBeDefined();

            // Verify data was saved to database
            const savedProgress = await Progress.findOne({ userId: testUser._id });
            const savedUser = await User.findById(testUser._id);

            expect(savedProgress).toBeDefined();
            expect(savedProgress?.chaptersRead.has('Genesis:1')).toBe(true);
            expect(savedUser?.streak.current).toBe(1);
            expect(savedUser?.streak.longest).toBe(1);
        });

        it('should increment streak when reading consecutive days', async () => {
            // Set up user with yesterday's reading
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);

            testUser.streak.current = 3;
            testUser.streak.longest = 5;
            testUser.streak.lastDate = yesterday;
            await testUser.save();

            // Regenerate token with updated user
            authToken = jwt.sign(
                { userId: testUser._id.toString(), email: testUser.email, name: testUser.name },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            const readingData = {
                bookId: 'Genesis',
                chapter: 2
            };

            const response = await request(app)
                .post('/api/v1/progress/log-reading')
                .set('Authorization', `Bearer ${authToken}`)
                .send(readingData)
                .expect(200);

            expect(response.body.data.streak.current).toBe(4);
            expect(response.body.data.streak.longest).toBe(5); // Should not change yet

            // Verify database
            const savedUser = await User.findById(testUser._id);
            expect(savedUser?.streak.current).toBe(4);
        });

        it('should update longest streak when current exceeds longest', async () => {
            // Set up user with yesterday's reading
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);

            testUser.streak.current = 5;
            testUser.streak.longest = 5;
            testUser.streak.lastDate = yesterday;
            await testUser.save();

            // Regenerate token with updated user
            authToken = jwt.sign(
                { userId: testUser._id.toString(), email: testUser.email, name: testUser.name },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            const readingData = {
                bookId: 'Genesis',
                chapter: 3
            };

            const response = await request(app)
                .post('/api/v1/progress/log-reading')
                .set('Authorization', `Bearer ${authToken}`)
                .send(readingData)
                .expect(200);

            expect(response.body.data.streak.current).toBe(6);
            expect(response.body.data.streak.longest).toBe(6);

            // Verify database
            const savedUser = await User.findById(testUser._id);
            expect(savedUser?.streak.current).toBe(6);
            expect(savedUser?.streak.longest).toBe(6);
        });

        it('should reset streak when reading after a gap', async () => {
            // Set up user with reading from 3 days ago
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            threeDaysAgo.setHours(0, 0, 0, 0);

            testUser.streak.current = 5;
            testUser.streak.longest = 10;
            testUser.streak.lastDate = threeDaysAgo;
            await testUser.save();

            // Regenerate token with updated user
            authToken = jwt.sign(
                { userId: testUser._id.toString(), email: testUser.email, name: testUser.name },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            const readingData = {
                bookId: 'Genesis',
                chapter: 4
            };

            const response = await request(app)
                .post('/api/v1/progress/log-reading')
                .set('Authorization', `Bearer ${authToken}`)
                .send(readingData)
                .expect(200);

            expect(response.body.data.streak.current).toBe(1);
            expect(response.body.data.streak.longest).toBe(10); // Should remain unchanged

            // Verify database
            const savedUser = await User.findById(testUser._id);
            expect(savedUser?.streak.current).toBe(1);
            expect(savedUser?.streak.longest).toBe(10);
        });

        it('should not change streak when reading multiple times on same day', async () => {
            // First reading of the day
            const readingData1 = {
                bookId: 'Genesis',
                chapter: 1
            };

            await request(app)
                .post('/api/v1/progress/log-reading')
                .set('Authorization', `Bearer ${authToken}`)
                .send(readingData1)
                .expect(200);

            // Second reading of the same day
            const readingData2 = {
                bookId: 'Genesis',
                chapter: 2
            };

            const response = await request(app)
                .post('/api/v1/progress/log-reading')
                .set('Authorization', `Bearer ${authToken}`)
                .send(readingData2)
                .expect(200);

            expect(response.body.data.streak.current).toBe(1); // Should remain 1

            // Verify database
            const savedUser = await User.findById(testUser._id);
            expect(savedUser?.streak.current).toBe(1);
        });

        it('should fail when bookId is missing', async () => {
            const readingData = {
                chapter: 1
            };

            const response = await request(app)
                .post('/api/v1/progress/log-reading')
                .set('Authorization', `Bearer ${authToken}`)
                .send(readingData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('bookId and chapter are required');
        });

        it('should fail when chapter is missing', async () => {
            const readingData = {
                bookId: 'Genesis'
            };

            const response = await request(app)
                .post('/api/v1/progress/log-reading')
                .set('Authorization', `Bearer ${authToken}`)
                .send(readingData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('bookId and chapter are required');
        });

        it('should fail when chapter is not a positive number', async () => {
            const readingData = {
                bookId: 'Genesis',
                chapter: 0
            };

            const response = await request(app)
                .post('/api/v1/progress/log-reading')
                .set('Authorization', `Bearer ${authToken}`)
                .send(readingData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('chapter must be a positive number');
        });

        it('should fail when chapter is negative', async () => {
            const readingData = {
                bookId: 'Genesis',
                chapter: -1
            };

            const response = await request(app)
                .post('/api/v1/progress/log-reading')
                .set('Authorization', `Bearer ${authToken}`)
                .send(readingData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('chapter must be a positive number');
        });

        it('should fail without authentication', async () => {
            const readingData = {
                bookId: 'Genesis',
                chapter: 1
            };

            const response = await request(app)
                .post('/api/v1/progress/log-reading')
                .send(readingData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token is required');
        });
    });

    describe('GET /api/v1/progress', () => {
        it('should get user progress when progress exists', async () => {
            // Create some progress data
            const progress = new Progress({
                userId: testUser._id,
                chaptersRead: new Map([
                    ['Genesis:1', []],
                    ['Genesis:2', []],
                    ['Exodus:1', []]
                ])
            });
            await progress.save();

            const response = await request(app)
                .get('/api/v1/progress')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Progress retrieved successfully');
            expect(response.body.data.progress.userId).toBe(testUser._id.toString());
            expect(response.body.data.progress.chaptersRead).toHaveProperty('Genesis:1');
            expect(response.body.data.progress.chaptersRead).toHaveProperty('Genesis:2');
            expect(response.body.data.progress.chaptersRead).toHaveProperty('Exodus:1');
            expect(response.body.data.progress.totalChaptersRead).toBe(0);
            expect(response.body.data.streak).toBeDefined();
        });

        it('should return empty progress when no progress exists', async () => {
            const response = await request(app)
                .get('/api/v1/progress')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('No progress found');
            expect(response.body.data.progress.userId).toBe(testUser._id.toString());
            expect(response.body.data.progress.chaptersRead).toEqual({});
            expect(response.body.data.progress.totalChaptersRead).toBe(0);
            expect(response.body.data.streak).toBeDefined();
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/progress')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token is required');
        });
    });

    describe('GET /api/v1/progress/:bookId', () => {
        it('should get book progress when progress exists', async () => {
            // Create some progress data
            const progress = new Progress({
                userId: testUser._id,
                chaptersRead: new Map([
                    ['Genesis:1', []],
                    ['Genesis:2', []],
                    ['Exodus:1', []]
                ])
            });
            await progress.save();

            const response = await request(app)
                .get('/api/v1/progress/Genesis')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Book progress retrieved successfully');
            expect(response.body.data.bookId).toBe('Genesis');
            expect(response.body.data.chaptersRead).toHaveProperty('1');
            expect(response.body.data.chaptersRead).toHaveProperty('2');
            expect(response.body.data.totalChaptersRead).toBe(0);
        });

        it('should return empty progress when no progress exists for book', async () => {
            const response = await request(app)
                .get('/api/v1/progress/Genesis')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('No progress found for this book');
            expect(response.body.data.bookId).toBe('Genesis');
            expect(response.body.data.chaptersRead).toEqual({});
            expect(response.body.data.totalChaptersRead).toBe(0);
        });

        it('should fail when bookId is missing', async () => {
            const response = await request(app)
                .get('/api/v1/progress/%20')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('bookId is required');
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/progress/Genesis')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token is required');
        });
    });
});
