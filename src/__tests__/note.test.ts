import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import { User, Note } from '../models';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

describe('Note API Endpoints', () => {
    let authToken: string;
    let testUser: any;
    let testNote: any;
    let testCounter = 0;

    beforeAll(async () => {
        // Clear test data
        await User.deleteMany({});
        await Note.deleteMany({});
    });

    afterAll(async () => {
        // Clean up test data
        await User.deleteMany({});
        await Note.deleteMany({});
    });

    beforeEach(async () => {
        // Clear all data before each test
        await User.deleteMany({});
        await Note.deleteMany({});

        // Create test user with unique email
        testCounter++;
        testUser = new User({
            name: 'Note Test User',
            email: `note-test-${testCounter}@example.com`,
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

    describe('POST /api/v1/notes', () => {
        it('should create a note successfully with valid data', async () => {
            const noteData = {
                bookId: 'Genesis',
                chapter: 1,
                verseStart: 1,
                verseCount: 3,
                content: 'This is my note about the creation story.'
            };

            const response = await request(app)
                .post('/api/v1/notes')
                .set('Authorization', `Bearer ${authToken}`)
                .send(noteData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Note created successfully');
            expect(response.body.data.note).toBeDefined();
            expect(response.body.data.note.bookId).toBe('Genesis');
            expect(response.body.data.note.chapter).toBe(1);
            expect(response.body.data.note.verseStart).toBe(1);
            expect(response.body.data.note.verseCount).toBe(3);
            expect(response.body.data.note.content).toBe('This is my note about the creation story.');
            expect(response.body.data.note.userId).toBe(testUser._id.toString());

            // Verify note was saved to database
            const savedNote = await Note.findById(response.body.data.note._id);
            expect(savedNote).toBeDefined();
            expect(savedNote?.bookId).toBe('Genesis');
            expect(savedNote?.content).toBe('This is my note about the creation story.');
        });

        it('should prevent creating duplicate notes for the same verse range', async () => {
            const noteData = {
                bookId: 'Genesis',
                chapter: 1,
                verseStart: 1,
                verseCount: 3,
                content: 'This is my note about the creation story.'
            };

            // Create first note
            const firstResponse = await request(app)
                .post('/api/v1/notes')
                .set('Authorization', `Bearer ${authToken}`)
                .send(noteData)
                .expect(201);

            expect(firstResponse.body.success).toBe(true);

            // Try to create duplicate note
            const secondResponse = await request(app)
                .post('/api/v1/notes')
                .set('Authorization', `Bearer ${authToken}`)
                .send(noteData)
                .expect(409);

            expect(secondResponse.body.success).toBe(false);
            expect(secondResponse.body.message).toBe('Note already exists for this verse range');

            // Verify only one note exists in database
            const notes = await Note.find({ userId: testUser._id });
            expect(notes).toHaveLength(1);
        });

        it('should fail when content is missing', async () => {
            const noteData = {
                bookId: 'Genesis',
                chapter: 1,
                verseStart: 1,
                verseCount: 3
            };

            const response = await request(app)
                .post('/api/v1/notes')
                .set('Authorization', `Bearer ${authToken}`)
                .send(noteData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('bookId, chapter, verseStart, verseCount, and content are required');
        });

        it('should fail when content is empty string', async () => {
            const noteData = {
                bookId: 'Genesis',
                chapter: 1,
                verseStart: 1,
                verseCount: 3,
                content: ''
            };

            const response = await request(app)
                .post('/api/v1/notes')
                .set('Authorization', `Bearer ${authToken}`)
                .send(noteData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('bookId, chapter, verseStart, verseCount, and content are required');
        });

        it('should fail when content is only whitespace', async () => {
            const noteData = {
                bookId: 'Genesis',
                chapter: 1,
                verseStart: 1,
                verseCount: 3,
                content: '   '
            };

            const response = await request(app)
                .post('/api/v1/notes')
                .set('Authorization', `Bearer ${authToken}`)
                .send(noteData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('content must be a non-empty string');
        });

        it('should fail when chapter is less than 1', async () => {
            const noteData = {
                bookId: 'Genesis',
                chapter: 0,
                verseStart: 1,
                verseCount: 3,
                content: 'Test content'
            };

            const response = await request(app)
                .post('/api/v1/notes')
                .set('Authorization', `Bearer ${authToken}`)
                .send(noteData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('chapter must be at least 1');
        });

        it('should fail when verseStart is less than 1', async () => {
            const noteData = {
                bookId: 'Genesis',
                chapter: 1,
                verseStart: 0,
                verseCount: 3,
                content: 'Test content'
            };

            const response = await request(app)
                .post('/api/v1/notes')
                .set('Authorization', `Bearer ${authToken}`)
                .send(noteData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('verseStart must be at least 1');
        });

        it('should fail when verseCount is less than 1', async () => {
            const noteData = {
                bookId: 'Genesis',
                chapter: 1,
                verseStart: 1,
                verseCount: 0,
                content: 'Test content'
            };

            const response = await request(app)
                .post('/api/v1/notes')
                .set('Authorization', `Bearer ${authToken}`)
                .send(noteData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('verseCount must be at least 1');
        });

        it('should fail without authentication', async () => {
            const noteData = {
                bookId: 'Genesis',
                chapter: 1,
                verseStart: 1,
                verseCount: 3,
                content: 'Test content'
            };

            const response = await request(app)
                .post('/api/v1/notes')
                .send(noteData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token is required');
        });
    });

    describe('GET /api/v1/notes', () => {
        beforeEach(async () => {
            // Create test notes
            const notes = [
                {
                    userId: testUser._id,
                    bookId: 'Genesis',
                    chapter: 1,
                    verseStart: 1,
                    verseCount: 3,
                    content: 'First note about creation'
                },
                {
                    userId: testUser._id,
                    bookId: 'Genesis',
                    chapter: 2,
                    verseStart: 1,
                    verseCount: 2,
                    content: 'Second note about garden'
                },
                {
                    userId: testUser._id,
                    bookId: 'Exodus',
                    chapter: 1,
                    verseStart: 1,
                    verseCount: 1,
                    content: 'Third note about Exodus'
                }
            ];

            await Note.insertMany(notes);
        });

        it('should get all notes for authenticated user', async () => {
            const response = await request(app)
                .get('/api/v1/notes')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Notes retrieved successfully');
            expect(response.body.data.pagination.totalItems).toBe(3);
            expect(response.body.data.data).toHaveLength(3);

            // Verify all notes belong to the user
            response.body.data.data.forEach((note: any) => {
                expect(note.userId).toBe(testUser._id.toString());
            });

            // Verify notes are sorted by createdAt desc
            const notes = response.body.data.data;
            expect(new Date(notes[0].createdAt).getTime()).toBeGreaterThanOrEqual(
                new Date(notes[1].createdAt).getTime()
            );
        });

        it('should filter notes by bookId', async () => {
            const response = await request(app)
                .get('/api/v1/notes?bookId=Genesis')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.pagination.totalItems).toBe(2);
            expect(response.body.data.data).toHaveLength(2);

            response.body.data.data.forEach((note: any) => {
                expect(note.bookId).toBe('Genesis');
            });
        });

        it('should filter notes by chapter', async () => {
            const response = await request(app)
                .get('/api/v1/notes?chapter=1')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.pagination.totalItems).toBe(2);
            expect(response.body.data.data).toHaveLength(2);

            response.body.data.data.forEach((note: any) => {
                expect(note.chapter).toBe(1);
            });
        });

        it('should filter notes by both bookId and chapter', async () => {
            const response = await request(app)
                .get('/api/v1/notes?bookId=Genesis&chapter=1')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.pagination.totalItems).toBe(1);
            expect(response.body.data.data).toHaveLength(1);

            const note = response.body.data.data[0];
            expect(note.bookId).toBe('Genesis');
            expect(note.chapter).toBe(1);
        });

        it('should return empty array when no notes exist', async () => {
            await Note.deleteMany({});

            const response = await request(app)
                .get('/api/v1/notes')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.pagination.totalItems).toBe(0);
            expect(response.body.data.data).toHaveLength(0);
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/notes')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token is required');
        });
    });

    describe('GET /api/v1/notes/:id', () => {
        beforeEach(async () => {
            // Create a test note
            testNote = new Note({
                userId: testUser._id,
                bookId: 'Genesis',
                chapter: 1,
                verseStart: 1,
                verseCount: 3,
                content: 'Test note content'
            });
            await testNote.save();
        });

        it('should get a specific note by ID', async () => {
            const response = await request(app)
                .get(`/api/v1/notes/${testNote._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Note retrieved successfully');
            expect(response.body.data.note).toBeDefined();
            expect(response.body.data.note._id).toBe(testNote._id.toString());
            expect(response.body.data.note.content).toBe('Test note content');
            expect(response.body.data.note.userId).toBe(testUser._id.toString());
        });

        it('should fail when note does not exist', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get(`/api/v1/notes/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Note not found');
        });

        it('should fail when note belongs to different user', async () => {
            // Create another user and note
            const otherUser = new User({
                name: 'Other User',
                email: 'other-get@example.com',
                password: 'Password123!'
            });
            await otherUser.save();

            const otherNote = new Note({
                userId: otherUser._id,
                bookId: 'Genesis',
                chapter: 1,
                verseStart: 1,
                verseCount: 3,
                content: 'Other user note'
            });
            await otherNote.save();

            const response = await request(app)
                .get(`/api/v1/notes/${otherNote._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Note not found');
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .get(`/api/v1/notes/${testNote._id}`)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token is required');
        });
    });

    describe('PUT /api/v1/notes/:id', () => {
        beforeEach(async () => {
            // Create a test note
            testNote = new Note({
                userId: testUser._id,
                bookId: 'Genesis',
                chapter: 1,
                verseStart: 1,
                verseCount: 3,
                content: 'Original note content'
            });
            await testNote.save();
        });

        it('should update note content successfully', async () => {
            const updateData = {
                content: 'Updated note content'
            };

            const response = await request(app)
                .put(`/api/v1/notes/${testNote._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Note updated successfully');
            expect(response.body.data.note.content).toBe('Updated note content');
            expect(response.body.data.note._id).toBe(testNote._id.toString());

            // Verify note was updated in database
            const updatedNote = await Note.findById(testNote._id);
            expect(updatedNote?.content).toBe('Updated note content');
        });

        it('should update multiple fields successfully', async () => {
            const updateData = {
                content: 'Updated content',
                verseCount: 5,
                chapter: 2
            };

            const response = await request(app)
                .put(`/api/v1/notes/${testNote._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.note.content).toBe('Updated content');
            expect(response.body.data.note.verseCount).toBe(5);
            expect(response.body.data.note.chapter).toBe(2);
        });

        it('should fail when updating with empty content', async () => {
            const updateData = {
                content: ''
            };

            const response = await request(app)
                .put(`/api/v1/notes/${testNote._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('content must be a non-empty string');
        });

        it('should fail when updating with invalid chapter', async () => {
            const updateData = {
                chapter: 0
            };

            const response = await request(app)
                .put(`/api/v1/notes/${testNote._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('chapter must be at least 1');
        });

        it('should fail when note does not exist', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const updateData = {
                content: 'Updated content'
            };

            const response = await request(app)
                .put(`/api/v1/notes/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Note not found');
        });

        it('should fail when note belongs to different user', async () => {
            // Create another user and note
            const otherUser = new User({
                name: 'Other User',
                email: 'other-put@example.com',
                password: 'Password123!'
            });
            await otherUser.save();

            const otherNote = new Note({
                userId: otherUser._id,
                bookId: 'Genesis',
                chapter: 1,
                verseStart: 1,
                verseCount: 3,
                content: 'Other user note'
            });
            await otherNote.save();

            const updateData = {
                content: 'Updated content'
            };

            const response = await request(app)
                .put(`/api/v1/notes/${otherNote._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Note not found');
        });

        it('should fail without authentication', async () => {
            const updateData = {
                content: 'Updated content'
            };

            const response = await request(app)
                .put(`/api/v1/notes/${testNote._id}`)
                .send(updateData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token is required');
        });
    });

    describe('DELETE /api/v1/notes/:id', () => {
        beforeEach(async () => {
            // Create a test note
            testNote = new Note({
                userId: testUser._id,
                bookId: 'Genesis',
                chapter: 1,
                verseStart: 1,
                verseCount: 3,
                content: 'Test note to delete'
            });
            await testNote.save();
        });

        it('should delete note successfully', async () => {
            const response = await request(app)
                .delete(`/api/v1/notes/${testNote._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Note deleted successfully');
            expect(response.body.data.note._id).toBe(testNote._id.toString());

            // Verify note was deleted from database
            const deletedNote = await Note.findById(testNote._id);
            expect(deletedNote).toBeNull();
        });

        it('should fail when note does not exist', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .delete(`/api/v1/notes/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Note not found');
        });

        it('should fail when note belongs to different user', async () => {
            // Create another user and note
            const otherUser = new User({
                name: 'Other User',
                email: 'other-delete@example.com',
                password: 'Password123!'
            });
            await otherUser.save();

            const otherNote = new Note({
                userId: otherUser._id,
                bookId: 'Genesis',
                chapter: 1,
                verseStart: 1,
                verseCount: 3,
                content: 'Other user note'
            });
            await otherNote.save();

            const response = await request(app)
                .delete(`/api/v1/notes/${otherNote._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Note not found');
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .delete(`/api/v1/notes/${testNote._id}`)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token is required');
        });
    });
});
