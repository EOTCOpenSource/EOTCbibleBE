import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import { User, Bookmark } from '../models';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

describe('Bookmark API Endpoints', () => {
    let authToken: string;
    let testUser: any;
    let testBookmark: any;

    beforeAll(async () => {
        // Clear test data
        await User.deleteMany({});
        await Bookmark.deleteMany({});
    });

    afterAll(async () => {
        // Clean up test data
        await User.deleteMany({});
        await Bookmark.deleteMany({});
    });

    beforeEach(async () => {
        // Clear bookmarks before each test
        await Bookmark.deleteMany({});

        // Create test user if not exists
        if (!testUser) {
            testUser = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'Password123!'
            });
            await testUser.save();
        }

        // Generate auth token
        authToken = jwt.sign(
            { userId: testUser._id.toString(), email: testUser.email, name: testUser.name },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
    });

    describe('POST /api/v1/bookmarks', () => {
        it('should create a bookmark successfully with valid data', async () => {
            const bookmarkData = {
                bookId: 'genesis',
                chapter: 1,
                verseStart: 1,
                verseCount: 5
            };

            const response = await request(app)
                .post('/api/v1/bookmarks')
                .set('Authorization', `Bearer ${authToken}`)
                .send(bookmarkData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Bookmark created successfully');
            expect(response.body.data.bookmark).toBeDefined();
            expect(response.body.data.bookmark.bookId).toBe('genesis');
            expect(response.body.data.bookmark.chapter).toBe(1);
            expect(response.body.data.bookmark.verseStart).toBe(1);
            expect(response.body.data.bookmark.verseCount).toBe(5);
            expect(response.body.data.bookmark.userId).toBe(testUser._id.toString());

            // Verify bookmark was saved to database
            const savedBookmark = await Bookmark.findById(response.body.data.bookmark._id);
            expect(savedBookmark).toBeDefined();
            expect(savedBookmark?.bookId).toBe('genesis');
        });

        it('should fail when verseStart is missing', async () => {
            const bookmarkData = {
                bookId: 'genesis',
                chapter: 1,
                verseCount: 5
            };

            const response = await request(app)
                .post('/api/v1/bookmarks')
                .set('Authorization', `Bearer ${authToken}`)
                .send(bookmarkData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('bookId, chapter, verseStart, and verseCount are required');
        });

        it('should fail when verseCount is missing', async () => {
            const bookmarkData = {
                bookId: 'genesis',
                chapter: 1,
                verseStart: 1
            };

            const response = await request(app)
                .post('/api/v1/bookmarks')
                .set('Authorization', `Bearer ${authToken}`)
                .send(bookmarkData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('bookId, chapter, verseStart, and verseCount are required');
        });

        it('should fail when verseStart is less than 1', async () => {
            const bookmarkData = {
                bookId: 'genesis',
                chapter: 1,
                verseStart: 0,
                verseCount: 5
            };

            const response = await request(app)
                .post('/api/v1/bookmarks')
                .set('Authorization', `Bearer ${authToken}`)
                .send(bookmarkData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('verseStart must be at least 1');
        });

        it('should fail when verseCount is less than 1', async () => {
            const bookmarkData = {
                bookId: 'genesis',
                chapter: 1,
                verseStart: 1,
                verseCount: 0
            };

            const response = await request(app)
                .post('/api/v1/bookmarks')
                .set('Authorization', `Bearer ${authToken}`)
                .send(bookmarkData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('verseCount must be at least 1');
        });

        it('should fail when chapter is less than 1', async () => {
            const bookmarkData = {
                bookId: 'genesis',
                chapter: 0,
                verseStart: 1,
                verseCount: 5
            };

            const response = await request(app)
                .post('/api/v1/bookmarks')
                .set('Authorization', `Bearer ${authToken}`)
                .send(bookmarkData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('chapter must be at least 1');
        });

        it('should fail when bookmark already exists for same verse range', async () => {
            const bookmarkData = {
                bookId: 'genesis',
                chapter: 1,
                verseStart: 1,
                verseCount: 5
            };

            // Create first bookmark
            await request(app)
                .post('/api/v1/bookmarks')
                .set('Authorization', `Bearer ${authToken}`)
                .send(bookmarkData)
                .expect(201);

            // Try to create duplicate
            const response = await request(app)
                .post('/api/v1/bookmarks')
                .set('Authorization', `Bearer ${authToken}`)
                .send(bookmarkData)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Bookmark already exists for this verse range');
        });

        it('should fail without authentication', async () => {
            const bookmarkData = {
                bookId: 'genesis',
                chapter: 1,
                verseStart: 1,
                verseCount: 5
            };

            const response = await request(app)
                .post('/api/v1/bookmarks')
                .send(bookmarkData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token is required');
        });
    });

    describe('GET /api/v1/bookmarks', () => {
        beforeEach(async () => {
            // Create test bookmarks
            const bookmarks = [
                { bookId: 'genesis', chapter: 1, verseStart: 1, verseCount: 5 },
                { bookId: 'genesis', chapter: 2, verseStart: 1, verseCount: 3 },
                { bookId: 'exodus', chapter: 1, verseStart: 1, verseCount: 7 }
            ];

            for (const bookmarkData of bookmarks) {
                await Bookmark.create({
                    ...bookmarkData,
                    userId: testUser._id
                });
            }
        });

        it('should get all bookmarks for authenticated user', async () => {
            const response = await request(app)
                .get('/api/v1/bookmarks')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Bookmarks retrieved successfully');
            expect(response.body.data.data).toHaveLength(3);
            expect(response.body.data.pagination.totalItems).toBe(3);
            expect(response.body.data.data[0].userId).toBe(testUser._id.toString());
            expect(response.body.data.data[1].userId).toBe(testUser._id.toString());
            expect(response.body.data.data[2].userId).toBe(testUser._id.toString());
        });

        it('should filter bookmarks by bookId', async () => {
            const response = await request(app)
                .get('/api/v1/bookmarks?bookId=genesis')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.data).toHaveLength(2);
            expect(response.body.data.data.every((b: any) => b.bookId === 'genesis')).toBe(true);
        });

        it('should filter bookmarks by chapter', async () => {
            const response = await request(app)
                .get('/api/v1/bookmarks?chapter=1')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.data).toHaveLength(2);
            expect(response.body.data.data.every((b: any) => b.chapter === 1)).toBe(true);
        });

        it('should filter bookmarks by both bookId and chapter', async () => {
            const response = await request(app)
                .get('/api/v1/bookmarks?bookId=genesis&chapter=1')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.data).toHaveLength(1);
            expect(response.body.data.data[0].bookId).toBe('genesis');
            expect(response.body.data.data[0].chapter).toBe(1);
        });

        it('should return empty array when no bookmarks exist', async () => {
            await Bookmark.deleteMany({});

            const response = await request(app)
                .get('/api/v1/bookmarks')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.data).toHaveLength(0);
            expect(response.body.data.pagination.totalItems).toBe(0);
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/bookmarks')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token is required');
        });
    });

    describe('GET /api/v1/bookmarks/:id', () => {
        beforeEach(async () => {
            // Create a test bookmark
            testBookmark = await Bookmark.create({
                bookId: 'genesis',
                chapter: 1,
                verseStart: 1,
                verseCount: 5,
                userId: testUser._id
            });
        });

        it('should get bookmark by ID successfully', async () => {
            const response = await request(app)
                .get(`/api/v1/bookmarks/${testBookmark._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Bookmark retrieved successfully');
            expect(response.body.data.bookmark._id).toBe(testBookmark._id.toString());
            expect(response.body.data.bookmark.bookId).toBe('genesis');
        });

        it('should return 404 for non-existent bookmark', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get(`/api/v1/bookmarks/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Bookmark not found');
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .get(`/api/v1/bookmarks/${testBookmark._id}`)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token is required');
        });
    });

    describe('PUT /api/v1/bookmarks/:id', () => {
        beforeEach(async () => {
            // Create a test bookmark
            testBookmark = await Bookmark.create({
                bookId: 'genesis',
                chapter: 1,
                verseStart: 1,
                verseCount: 5,
                userId: testUser._id
            });
        });

        it('should update bookmark successfully with all fields', async () => {
            const updateData = {
                bookId: 'exodus',
                chapter: 2,
                verseStart: 10,
                verseCount: 3
            };

            const response = await request(app)
                .put(`/api/v1/bookmarks/${testBookmark._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Bookmark updated successfully');
            expect(response.body.data.bookmark.bookId).toBe('exodus');
            expect(response.body.data.bookmark.chapter).toBe(2);
            expect(response.body.data.bookmark.verseStart).toBe(10);
            expect(response.body.data.bookmark.verseCount).toBe(3);
        });

        it('should update bookmark successfully with partial data', async () => {
            const updateData = {
                verseCount: 7
            };

            const response = await request(app)
                .put(`/api/v1/bookmarks/${testBookmark._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.bookmark.verseCount).toBe(7);
            expect(response.body.data.bookmark.bookId).toBe('genesis'); // unchanged
            expect(response.body.data.bookmark.chapter).toBe(1); // unchanged
        });

        it('should fail when verseStart is less than 1', async () => {
            const updateData = {
                verseStart: 0
            };

            const response = await request(app)
                .put(`/api/v1/bookmarks/${testBookmark._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('verseStart must be at least 1');
        });

        it('should fail when verseCount is less than 1', async () => {
            const updateData = {
                verseCount: 0
            };

            const response = await request(app)
                .put(`/api/v1/bookmarks/${testBookmark._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('verseCount must be at least 1');
        });

        it('should return 404 for non-existent bookmark', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const updateData = { verseCount: 7 };

            const response = await request(app)
                .put(`/api/v1/bookmarks/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Bookmark not found');
        });

        it('should fail without authentication', async () => {
            const updateData = { verseCount: 7 };

            const response = await request(app)
                .put(`/api/v1/bookmarks/${testBookmark._id}`)
                .send(updateData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token is required');
        });
    });

    describe('DELETE /api/v1/bookmarks/:id', () => {
        beforeEach(async () => {
            // Create a test bookmark
            testBookmark = await Bookmark.create({
                bookId: 'genesis',
                chapter: 1,
                verseStart: 1,
                verseCount: 5,
                userId: testUser._id
            });
        });

        it('should delete bookmark successfully', async () => {
            const response = await request(app)
                .delete(`/api/v1/bookmarks/${testBookmark._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Bookmark deleted successfully');
            expect(response.body.data.bookmark._id).toBe(testBookmark._id.toString());

            // Verify bookmark was deleted from database
            const deletedBookmark = await Bookmark.findById(testBookmark._id);
            expect(deletedBookmark).toBeNull();
        });

        it('should return 404 for non-existent bookmark', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .delete(`/api/v1/bookmarks/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Bookmark not found');
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .delete(`/api/v1/bookmarks/${testBookmark._id}`)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token is required');
        });
    });
});
