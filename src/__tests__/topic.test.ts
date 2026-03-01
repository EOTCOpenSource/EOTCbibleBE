import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import { User, Topic } from '../models';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

describe('Topic API Endpoints', () => {
    let authToken: string;
    let testUser: any;
    let testCounter = 0;

    beforeAll(async () => {
        // Clear test data
        await User.deleteMany({});
        await Topic.deleteMany({});
    });

    afterAll(async () => {
        // Clean up test data
        await User.deleteMany({});
        await Topic.deleteMany({});
    });

    beforeEach(async () => {
        // Clear all data before each test
        await User.deleteMany({});
        await Topic.deleteMany({});

        // Create test user with unique email
        testCounter++;
        testUser = new User({
            name: 'Topic Test User',
            email: `topic-test-${testCounter}@example.com`,
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

    describe('POST /api/v1/topics', () => {
        it('should create a topic successfully with valid data', async () => {
            const topicData = {
                name: 'Test Topic',
                verses: [
                    {
                        bookId: 'Genesis',
                        chapter: 1,
                        verseStart: 1,
                        verseCount: 5
                    }
                ]
            };

            const response = await request(app)
                .post('/api/v1/topics')
                .set('Authorization', `Bearer ${authToken}`)
                .send(topicData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Topic created successfully');
            expect(response.body.data.topic.name).toBe('Test Topic');
            expect(response.body.data.topic.verses).toHaveLength(1);
            expect(response.body.data.topic.totalVerses).toBe(5);
            expect(response.body.data.topic.uniqueBooks).toBe(1);

            // Verify topic was saved to database
            const savedTopic = await Topic.findById(response.body.data.topic._id);
            expect(savedTopic).toBeDefined();
            expect(savedTopic?.name).toBe('Test Topic');
        });

        it('should create a topic without verses', async () => {
            const topicData = {
                name: 'Empty Topic'
            };

            const response = await request(app)
                .post('/api/v1/topics')
                .set('Authorization', `Bearer ${authToken}`)
                .send(topicData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.topic.name).toBe('Empty Topic');
            expect(response.body.data.topic.verses).toHaveLength(0);
            expect(response.body.data.topic.totalVerses).toBe(0);
        });

        it('should fail when name is missing', async () => {
            const topicData = {
                verses: [
                    {
                        bookId: 'Genesis',
                        chapter: 1,
                        verseStart: 1,
                        verseCount: 5
                    }
                ]
            };

            const response = await request(app)
                .post('/api/v1/topics')
                .set('Authorization', `Bearer ${authToken}`)
                .send(topicData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Topic name is required and must be a non-empty string');
        });

        it('should fail when name is empty', async () => {
            const topicData = {
                name: ''
            };

            const response = await request(app)
                .post('/api/v1/topics')
                .set('Authorization', `Bearer ${authToken}`)
                .send(topicData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should fail when topic name already exists', async () => {
            // Create first topic
            const topicData = {
                name: 'Duplicate Topic'
            };

            await request(app)
                .post('/api/v1/topics')
                .set('Authorization', `Bearer ${authToken}`)
                .send(topicData)
                .expect(201);

            // Try to create second topic with same name
            const response = await request(app)
                .post('/api/v1/topics')
                .set('Authorization', `Bearer ${authToken}`)
                .send(topicData)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('A topic with this name already exists');
        });

        it('should fail when verse data is invalid', async () => {
            const topicData = {
                name: 'Invalid Topic',
                verses: [
                    {
                        bookId: 'Genesis',
                        chapter: 0, // Invalid chapter
                        verseStart: 1,
                        verseCount: 5
                    }
                ]
            };

            const response = await request(app)
                .post('/api/v1/topics')
                .set('Authorization', `Bearer ${authToken}`)
                .send(topicData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Chapter, verseStart, and verseCount must be positive numbers');
        });

        it('should fail without authentication', async () => {
            const topicData = {
                name: 'Unauthorized Topic'
            };

            const response = await request(app)
                .post('/api/v1/topics')
                .send(topicData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token is required');
        });
    });

    describe('GET /api/v1/topics', () => {
        it('should get all topics for user', async () => {
            // Create some test topics
            const topic1 = new Topic({
                userId: testUser._id,
                name: 'Topic 1',
                verses: []
            });
            const topic2 = new Topic({
                userId: testUser._id,
                name: 'Topic 2',
                verses: [
                    {
                        bookId: 'Genesis',
                        chapter: 1,
                        verseStart: 1,
                        verseCount: 3
                    }
                ]
            });
            await Promise.all([topic1.save(), topic2.save()]);

            const response = await request(app)
                .get('/api/v1/topics')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Topics retrieved successfully');
            expect(response.body.data.data).toHaveLength(2);
            expect(response.body.data.pagination.totalItems).toBe(2);
        });

        it('should return empty array when no topics exist', async () => {
            await Topic.deleteMany({});

            const response = await request(app)
                .get('/api/v1/topics')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.data).toHaveLength(0);
            expect(response.body.data.pagination.totalItems).toBe(0);
        });

        it('should support search functionality', async () => {
            // Create topics with different names
            const topic1 = new Topic({
                userId: testUser._id,
                name: 'Faith Topics',
                verses: []
            });
            const topic2 = new Topic({
                userId: testUser._id,
                name: 'Love Topics',
                verses: []
            });
            await Promise.all([topic1.save(), topic2.save()]);

            const response = await request(app)
                .get('/api/v1/topics?search=Faith')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.data).toHaveLength(1);
            expect(response.body.data.data[0].name).toBe('Faith Topics');
        });

        it('should support sorting', async () => {
            // Create topics with different names
            const topic1 = new Topic({
                userId: testUser._id,
                name: 'Zebra Topic',
                verses: []
            });
            const topic2 = new Topic({
                userId: testUser._id,
                name: 'Alpha Topic',
                verses: []
            });
            await Promise.all([topic1.save(), topic2.save()]);

            const response = await request(app)
                .get('/api/v1/topics?sort=name&order=asc')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.data[0].name).toBe('Alpha Topic');
            expect(response.body.data.data[1].name).toBe('Zebra Topic');
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/topics')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token is required');
        });
    });

    describe('GET /api/v1/topics/:id', () => {
        it('should get a specific topic by ID', async () => {
            const topic = new Topic({
                userId: testUser._id,
                name: 'Specific Topic',
                verses: [
                    {
                        bookId: 'Genesis',
                        chapter: 1,
                        verseStart: 1,
                        verseCount: 5
                    }
                ]
            });
            await topic.save();

            const response = await request(app)
                .get(`/api/v1/topics/${topic._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.topic.name).toBe('Specific Topic');
            expect(response.body.data.topic.verses).toHaveLength(1);
        });

        it('should return 404 for non-existent topic', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .get(`/api/v1/topics/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Topic not found');
        });

        it('should fail without authentication', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .get(`/api/v1/topics/${fakeId}`)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token is required');
        });
    });

    describe('PUT /api/v1/topics/:id', () => {
        it('should update topic name successfully', async () => {
            const topic = new Topic({
                userId: testUser._id,
                name: 'Original Name',
                verses: []
            });
            await topic.save();

            const updateData = {
                name: 'Updated Name'
            };

            const response = await request(app)
                .put(`/api/v1/topics/${topic._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.topic.name).toBe('Updated Name');

            // Verify database was updated
            const updatedTopic = await Topic.findById(topic._id);
            expect(updatedTopic?.name).toBe('Updated Name');
        });

        it('should fail when new name already exists', async () => {
            // Create two topics
            const topic1 = new Topic({
                userId: testUser._id,
                name: 'Topic 1',
                verses: []
            });
            const topic2 = new Topic({
                userId: testUser._id,
                name: 'Topic 2',
                verses: []
            });
            await Promise.all([topic1.save(), topic2.save()]);

            const updateData = {
                name: 'Topic 2' // Try to rename topic1 to topic2's name
            };

            const response = await request(app)
                .put(`/api/v1/topics/${topic1._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('A topic with this name already exists');
        });

        it('should fail when name is empty', async () => {
            const topic = new Topic({
                userId: testUser._id,
                name: 'Original Name',
                verses: []
            });
            await topic.save();

            const updateData = {
                name: ''
            };

            const response = await request(app)
                .put(`/api/v1/topics/${topic._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should fail without authentication', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const updateData = {
                name: 'Unauthorized Update'
            };

            const response = await request(app)
                .put(`/api/v1/topics/${fakeId}`)
                .send(updateData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token is required');
        });
    });

    describe('DELETE /api/v1/topics/:id', () => {
        it('should delete topic successfully', async () => {
            const topic = new Topic({
                userId: testUser._id,
                name: 'To Delete',
                verses: []
            });
            await topic.save();

            const response = await request(app)
                .delete(`/api/v1/topics/${topic._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.deletedTopic.name).toBe('To Delete');

            // Verify topic was deleted from database
            const deletedTopic = await Topic.findById(topic._id);
            expect(deletedTopic).toBeNull();
        });

        it('should return 404 for non-existent topic', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .delete(`/api/v1/topics/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Topic not found');
        });

        it('should fail without authentication', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .delete(`/api/v1/topics/${fakeId}`)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token is required');
        });
    });

    describe('POST /api/v1/topics/:id/verses', () => {
        it('should add verses to topic successfully', async () => {
            const topic = new Topic({
                userId: testUser._id,
                name: 'Test Topic',
                verses: []
            });
            await topic.save();

            const versesData = {
                verses: [
                    {
                        bookId: 'Genesis',
                        chapter: 1,
                        verseStart: 1,
                        verseCount: 5
                    },
                    {
                        bookId: 'Genesis',
                        chapter: 1,
                        verseStart: 10,
                        verseCount: 3
                    }
                ]
            };

            const response = await request(app)
                .post(`/api/v1/topics/${topic._id}/verses`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(versesData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.addedCount).toBe(2);
            expect(response.body.data.topic.totalVerses).toBe(8);

            // Verify verses were added to database
            const updatedTopic = await Topic.findById(topic._id);
            expect(updatedTopic?.verses).toHaveLength(2);
        });

        it('should not add duplicate verses', async () => {
            const topic = new Topic({
                userId: testUser._id,
                name: 'Test Topic',
                verses: [
                    {
                        bookId: 'Genesis',
                        chapter: 1,
                        verseStart: 1,
                        verseCount: 5
                    }
                ]
            });
            await topic.save();

            const versesData = {
                verses: [
                    {
                        bookId: 'Genesis',
                        chapter: 1,
                        verseStart: 1,
                        verseCount: 5
                    }
                ]
            };

            const response = await request(app)
                .post(`/api/v1/topics/${topic._id}/verses`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(versesData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.addedCount).toBe(0); // No new verses added
        });

        it('should fail when verses array is empty', async () => {
            const topic = new Topic({
                userId: testUser._id,
                name: 'Test Topic',
                verses: []
            });
            await topic.save();

            const versesData = {
                verses: []
            };

            const response = await request(app)
                .post(`/api/v1/topics/${topic._id}/verses`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(versesData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Verses array is required and must not be empty');
        });

        it('should fail without authentication', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const versesData = {
                verses: [
                    {
                        bookId: 'Genesis',
                        chapter: 1,
                        verseStart: 1,
                        verseCount: 5
                    }
                ]
            };

            const response = await request(app)
                .post(`/api/v1/topics/${fakeId}/verses`)
                .send(versesData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token is required');
        });
    });

    describe('DELETE /api/v1/topics/:id/verses', () => {
        it('should remove verses from topic successfully', async () => {
            const topic = new Topic({
                userId: testUser._id,
                name: 'Test Topic',
                verses: [
                    {
                        bookId: 'Genesis',
                        chapter: 1,
                        verseStart: 1,
                        verseCount: 5
                    },
                    {
                        bookId: 'Genesis',
                        chapter: 1,
                        verseStart: 10,
                        verseCount: 3
                    }
                ]
            });
            await topic.save();

            const versesData = {
                verses: [
                    {
                        bookId: 'Genesis',
                        chapter: 1,
                        verseStart: 1,
                        verseCount: 5
                    }
                ]
            };

            const response = await request(app)
                .delete(`/api/v1/topics/${topic._id}/verses`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(versesData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.removedCount).toBe(1);
            expect(response.body.data.remainingCount).toBe(1);

            // Verify verse was removed from database
            const updatedTopic = await Topic.findById(topic._id);
            expect(updatedTopic?.verses).toHaveLength(1);
        });

        it('should fail when verses array is empty', async () => {
            const topic = new Topic({
                userId: testUser._id,
                name: 'Test Topic',
                verses: []
            });
            await topic.save();

            const versesData = {
                verses: []
            };

            const response = await request(app)
                .delete(`/api/v1/topics/${topic._id}/verses`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(versesData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Verses array is required and must not be empty');
        });

        it('should fail without authentication', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const versesData = {
                verses: [
                    {
                        bookId: 'Genesis',
                        chapter: 1,
                        verseStart: 1,
                        verseCount: 5
                    }
                ]
            };

            const response = await request(app)
                .delete(`/api/v1/topics/${fakeId}/verses`)
                .send(versesData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token is required');
        });
    });

    describe('GET /api/v1/topics/verse', () => {
        it('should get topics containing a specific verse', async () => {
            const topic1 = new Topic({
                userId: testUser._id,
                name: 'Topic with Genesis 1:1',
                verses: [
                    {
                        bookId: 'Genesis',
                        chapter: 1,
                        verseStart: 1,
                        verseCount: 5
                    }
                ]
            });
            const topic2 = new Topic({
                userId: testUser._id,
                name: 'Topic with Genesis 1:10',
                verses: [
                    {
                        bookId: 'Genesis',
                        chapter: 1,
                        verseStart: 10,
                        verseCount: 3
                    }
                ]
            });
            await Promise.all([topic1.save(), topic2.save()]);

            const response = await request(app)
                .get('/api/v1/topics/verse?bookId=Genesis&chapter=1&verseStart=1')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.topics).toHaveLength(2); // Both topics have Genesis chapter 1
            expect(response.body.data.topics.some((t: any) => t.name === 'Topic with Genesis 1:1')).toBe(true);
            expect(response.body.data.topics.some((t: any) => t.name === 'Topic with Genesis 1:10')).toBe(true);
        });

        it('should fail when required parameters are missing', async () => {
            const response = await request(app)
                .get('/api/v1/topics/verse?bookId=Genesis')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('bookId, chapter, and verseStart are required');
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/topics/verse?bookId=Genesis&chapter=1&verseStart=1')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token is required');
        });
    });

    describe('GET /api/v1/topics/stats', () => {
        it('should get topic statistics', async () => {
            // Create some test topics
            const topic1 = new Topic({
                userId: testUser._id,
                name: 'Topic 1',
                verses: [
                    {
                        bookId: 'Genesis',
                        chapter: 1,
                        verseStart: 1,
                        verseCount: 5
                    }
                ]
            });
            const topic2 = new Topic({
                userId: testUser._id,
                name: 'Topic 2',
                verses: [
                    {
                        bookId: 'Genesis',
                        chapter: 1,
                        verseStart: 10,
                        verseCount: 3
                    },
                    {
                        bookId: 'Exodus',
                        chapter: 1,
                        verseStart: 1,
                        verseCount: 2
                    }
                ]
            });
            await Promise.all([topic1.save(), topic2.save()]);

            const response = await request(app)
                .get('/api/v1/topics/stats')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.stats.totalTopics).toBe(2);
            expect(response.body.data.stats.totalVerses).toBe(10);
            expect(response.body.data.stats.avgVersesPerTopic).toBe(1.5);
        });

        it('should return zero stats when no topics exist', async () => {
            const response = await request(app)
                .get('/api/v1/topics/stats')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.stats.totalTopics).toBe(0);
            expect(response.body.data.stats.totalVerses).toBe(0);
            expect(response.body.data.stats.avgVersesPerTopic).toBe(0);
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/topics/stats')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token is required');
        });
    });
});
