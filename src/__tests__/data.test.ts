import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import { User, Bookmark, Note, Highlight, Progress, Topic } from '../models';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

describe('Data Management API Endpoints', () => {
    let authToken: string;
    let testUser: any;
    let testCounter = 0;

    beforeAll(async () => {
        // Clear test data
        await User.deleteMany({});
        await Bookmark.deleteMany({});
        await Note.deleteMany({});
        await Highlight.deleteMany({});
        await Progress.deleteMany({});
        await Topic.deleteMany({});
    });

    afterAll(async () => {
        // Clean up test data
        await User.deleteMany({});
        await Bookmark.deleteMany({});
        await Note.deleteMany({});
        await Highlight.deleteMany({});
        await Progress.deleteMany({});
        await Topic.deleteMany({});
    });

    beforeEach(async () => {
        // Clear all data before each test
        await User.deleteMany({});
        await Bookmark.deleteMany({});
        await Note.deleteMany({});
        await Highlight.deleteMany({});
        await Progress.deleteMany({});
        await Topic.deleteMany({});

        // Create test user with unique email
        testCounter++;
        testUser = new User({
            name: 'Data Test User',
            email: `data-test-${testCounter}@example.com`,
            password: 'Password123!'
        });
        await testUser.save();

        // Generate auth token
        authToken = jwt.sign(
            { userId: testUser._id.toString(), email: testUser.email, name: testUser.name },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
    });

    describe('DELETE /api/v1/data/all', () => {
        it('should delete all user data successfully', async () => {
            // Create test data for the user
            const bookmark = new Bookmark({
                userId: testUser._id,
                bookId: 'Genesis',
                chapter: 1,
                verseStart: 1,
                verseCount: 3
            });

            const note = new Note({
                userId: testUser._id,
                bookId: 'Genesis',
                chapter: 1,
                verseStart: 1,
                verseCount: 3,
                content: 'Test note'
            });

            const highlight = new Highlight({
                userId: testUser._id,
                bookId: 'Genesis',
                chapter: 1,
                verseStart: 1,
                verseCount: 3,
                color: 'yellow'
            });

            const progress = new Progress({
                userId: testUser._id,
                chaptersRead: new Map([['Genesis:1', []]])
            });

            const topic = new Topic({
                userId: testUser._id,
                name: 'Test Topic',
                verses: [{
                    bookId: 'Genesis',
                    chapter: 1,
                    verseStart: 1,
                    verseCount: 3
                }]
            });

            await Promise.all([
                bookmark.save(),
                note.save(),
                highlight.save(),
                progress.save(),
                topic.save()
            ]);

            // Verify data exists before deletion
            const bookmarksBefore = await Bookmark.find({ userId: testUser._id });
            const notesBefore = await Note.find({ userId: testUser._id });
            const highlightsBefore = await Highlight.find({ userId: testUser._id });
            const progressBefore = await Progress.find({ userId: testUser._id });
            const topicsBefore = await Topic.find({ userId: testUser._id });

            expect(bookmarksBefore).toHaveLength(1);
            expect(notesBefore).toHaveLength(1);
            expect(highlightsBefore).toHaveLength(1);
            expect(progressBefore).toHaveLength(1);
            expect(topicsBefore).toHaveLength(1);

            // Delete all user data
            const response = await request(app)
                .delete('/api/v1/data/all')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('All user data deleted successfully');
            expect(response.body.data.deletedCount).toBe(5);
            expect(response.body.data.collections.bookmarks).toBe(1);
            expect(response.body.data.collections.notes).toBe(1);
            expect(response.body.data.collections.highlights).toBe(1);
            expect(response.body.data.collections.progress).toBe(1);
            expect(response.body.data.collections.topics).toBe(1);

            // Verify all data was deleted
            const bookmarksAfter = await Bookmark.find({ userId: testUser._id });
            const notesAfter = await Note.find({ userId: testUser._id });
            const highlightsAfter = await Highlight.find({ userId: testUser._id });
            const progressAfter = await Progress.find({ userId: testUser._id });
            const topicsAfter = await Topic.find({ userId: testUser._id });

            expect(bookmarksAfter).toHaveLength(0);
            expect(notesAfter).toHaveLength(0);
            expect(highlightsAfter).toHaveLength(0);
            expect(progressAfter).toHaveLength(0);
            expect(topicsAfter).toHaveLength(0);

            // Verify user document still exists
            const userAfter = await User.findById(testUser._id);
            expect(userAfter).toBeDefined();
            expect(userAfter?.email).toBe(testUser.email);
        });

        it('should return zero counts when no data exists', async () => {
            const response = await request(app)
                .delete('/api/v1/data/all')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.deletedCount).toBe(0);
            expect(response.body.data.collections.bookmarks).toBe(0);
            expect(response.body.data.collections.notes).toBe(0);
            expect(response.body.data.collections.highlights).toBe(0);
            expect(response.body.data.collections.progress).toBe(0);
            expect(response.body.data.collections.topics).toBe(0);
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .delete('/api/v1/data/all')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token is required');
        });
    });

    describe('DELETE /api/v1/data/:type', () => {
        it('should delete bookmarks successfully', async () => {
            // Create test bookmarks
            const bookmark1 = new Bookmark({
                userId: testUser._id,
                bookId: 'Genesis',
                chapter: 1,
                verseStart: 1,
                verseCount: 3
            });

            const bookmark2 = new Bookmark({
                userId: testUser._id,
                bookId: 'Exodus',
                chapter: 1,
                verseStart: 1,
                verseCount: 5
            });

            await Promise.all([bookmark1.save(), bookmark2.save()]);

            // Verify bookmarks exist before deletion
            const bookmarksBefore = await Bookmark.find({ userId: testUser._id });
            expect(bookmarksBefore).toHaveLength(2);

            const response = await request(app)
                .delete('/api/v1/data/bookmarks')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('bookmarks deleted successfully');
            expect(response.body.data.type).toBe('bookmarks');
            expect(response.body.data.deletedCount).toBe(2);

            // Verify bookmarks were deleted
            const bookmarksAfter = await Bookmark.find({ userId: testUser._id });
            expect(bookmarksAfter).toHaveLength(0);
        });

        it('should delete notes successfully', async () => {
            // Create test notes
            const note = new Note({
                userId: testUser._id,
                bookId: 'Genesis',
                chapter: 1,
                verseStart: 1,
                verseCount: 3,
                content: 'Test note'
            });

            await note.save();

            const response = await request(app)
                .delete('/api/v1/data/notes')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('notes deleted successfully');
            expect(response.body.data.type).toBe('notes');
            expect(response.body.data.deletedCount).toBe(1);

            // Verify notes were deleted
            const notesAfter = await Note.find({ userId: testUser._id });
            expect(notesAfter).toHaveLength(0);
        });

        it('should delete highlights successfully', async () => {
            // Create test highlights
            const highlight = new Highlight({
                userId: testUser._id,
                bookId: 'Genesis',
                chapter: 1,
                verseStart: 1,
                verseCount: 3,
                color: 'yellow'
            });

            await highlight.save();

            const response = await request(app)
                .delete('/api/v1/data/highlights')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('highlights deleted successfully');
            expect(response.body.data.type).toBe('highlights');
            expect(response.body.data.deletedCount).toBe(1);

            // Verify highlights were deleted
            const highlightsAfter = await Highlight.find({ userId: testUser._id });
            expect(highlightsAfter).toHaveLength(0);
        });

        it('should delete progress successfully', async () => {
            // Create test progress
            const progress = new Progress({
                userId: testUser._id,
                chaptersRead: new Map([['Genesis:1', []]])
            });

            await progress.save();

            const response = await request(app)
                .delete('/api/v1/data/progress')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('progress deleted successfully');
            expect(response.body.data.type).toBe('progress');
            expect(response.body.data.deletedCount).toBe(1);

            // Verify progress was deleted
            const progressAfter = await Progress.find({ userId: testUser._id });
            expect(progressAfter).toHaveLength(0);
        });

        it('should delete topics successfully', async () => {
            // Create test topics
            const topic = new Topic({
                userId: testUser._id,
                name: 'Test Topic',
                verses: [{
                    bookId: 'Genesis',
                    chapter: 1,
                    verseStart: 1,
                    verseCount: 3
                }]
            });

            await topic.save();

            const response = await request(app)
                .delete('/api/v1/data/topics')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('topics deleted successfully');
            expect(response.body.data.type).toBe('topics');
            expect(response.body.data.deletedCount).toBe(1);

            // Verify topics were deleted
            const topicsAfter = await Topic.find({ userId: testUser._id });
            expect(topicsAfter).toHaveLength(0);
        });

        it('should return zero count when no data of specified type exists', async () => {
            const response = await request(app)
                .delete('/api/v1/data/bookmarks')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.deletedCount).toBe(0);
        });

        it('should fail with invalid data type', async () => {
            const response = await request(app)
                .delete('/api/v1/data/invalid')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid data type. Supported types: bookmarks, notes, highlights, progress, topics');
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .delete('/api/v1/data/bookmarks')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token is required');
        });

        it('should only delete data for the authenticated user', async () => {
            // Create bookmark for test user
            const testBookmark = new Bookmark({
                userId: testUser._id,
                bookId: 'Exodus',
                chapter: 1,
                verseStart: 1,
                verseCount: 5
            });
            await testBookmark.save();

            // Create another user with data (after test user is set up)
            const otherUser = new User({
                name: 'Other User',
                email: 'other@example.com',
                password: 'Password123!'
            });
            await otherUser.save();

            // Create bookmark for other user
            const otherBookmark = new Bookmark({
                userId: otherUser._id,
                bookId: 'Genesis',
                chapter: 1,
                verseStart: 1,
                verseCount: 3
            });
            await otherBookmark.save();

            // Verify both bookmarks exist before deletion
            const testUserBookmarksBefore = await Bookmark.find({ userId: testUser._id });
            const otherUserBookmarksBefore = await Bookmark.find({ userId: otherUser._id });
            expect(testUserBookmarksBefore).toHaveLength(1);
            expect(otherUserBookmarksBefore).toHaveLength(1);

            // Delete bookmarks for test user
            const response = await request(app)
                .delete('/api/v1/data/bookmarks')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.data.deletedCount).toBe(1);

            // Verify only test user's bookmark was deleted
            const testUserBookmarksAfter = await Bookmark.find({ userId: testUser._id });
            const otherUserBookmarksAfter = await Bookmark.find({ userId: otherUser._id });

            expect(testUserBookmarksAfter).toHaveLength(0);
            expect(otherUserBookmarksAfter).toHaveLength(1);
        });
    });
});
