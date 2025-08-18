import request from 'supertest';
import app from '../index';
import * as jwt from 'jsonwebtoken';
import { Highlight, User } from '../models';

// Mock the models to avoid database operations in tests
jest.mock('../models', () => ({
    Highlight: {
        find: jest.fn(),
        findOne: jest.fn(),
        findOneAndDelete: jest.fn(),
    },
    User: {
        findById: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue(null)
        }),
    },
}));

// Mock JWT secret for testing
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

describe('Highlight Routes', () => {
    let validToken: string;
    let mockUser: any;
    let mockHighlight: any;

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();

        // Create mock user
        mockUser = {
            _id: '507f1f77bcf86cd799439011',
            name: 'Test User',
            email: 'test@example.com',
            settings: {},
            streak: 0
        };

        // Create mock highlight
        mockHighlight = {
            _id: '507f1f77bcf86cd799439012',
            userId: mockUser._id,
            bookId: 'John',
            chapter: 3,
            verseStart: 16,
            verseCount: 1,
            color: 'yellow',
            createdAt: '2025-08-18T13:56:45.779Z',
            updatedAt: '2025-08-18T13:56:45.779Z'
        };

        // Create valid JWT token
        validToken = jwt.sign(
            {
                userId: mockUser._id,
                email: mockUser.email,
                name: mockUser.name
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Mock User.findById().select() to return user
        const mockSelect = jest.fn().mockResolvedValue(mockUser);
        (User.findById as jest.Mock).mockReturnValue({
            select: mockSelect
        });
    });

    describe('GET /api/v1/highlights', () => {
        it('should return 401 when no token is provided', async () => {
            const response = await request(app)
                .get('/api/v1/highlights');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token is required');
        });

        it('should return 401 when invalid token is provided', async () => {
            const response = await request(app)
                .get('/api/v1/highlights')
                .set('Authorization', 'Bearer invalid-token');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid token');
        });

        it('should return all highlights for authenticated user', async () => {
            const mockHighlights = [mockHighlight, { ...mockHighlight, _id: '507f1f77bcf86cd799439013' }];

            (Highlight.find as jest.Mock).mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(mockHighlights)
                })
            });

            const response = await request(app)
                .get('/api/v1/highlights')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Highlights retrieved successfully');
            expect(response.body.data.highlights).toEqual(mockHighlights);
            expect(response.body.data.count).toBe(2);
            expect(Highlight.find).toHaveBeenCalledWith({ userId: mockUser._id });
        });

        it('should filter highlights by bookId', async () => {
            const mockHighlights = [mockHighlight];

            (Highlight.find as jest.Mock).mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(mockHighlights)
                })
            });

            const response = await request(app)
                .get('/api/v1/highlights?bookId=John')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            expect(Highlight.find).toHaveBeenCalledWith({
                userId: mockUser._id,
                bookId: 'John'
            });
        });

        it('should filter highlights by chapter', async () => {
            const mockHighlights = [mockHighlight];

            (Highlight.find as jest.Mock).mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(mockHighlights)
                })
            });

            const response = await request(app)
                .get('/api/v1/highlights?chapter=3')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            expect(Highlight.find).toHaveBeenCalledWith({
                userId: mockUser._id,
                chapter: 3
            });
        });

        it('should filter highlights by color', async () => {
            const mockHighlights = [mockHighlight];

            (Highlight.find as jest.Mock).mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(mockHighlights)
                })
            });

            const response = await request(app)
                .get('/api/v1/highlights?color=yellow')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            expect(Highlight.find).toHaveBeenCalledWith({
                userId: mockUser._id,
                color: 'yellow'
            });
        });

        it('should return empty array when user has no highlights', async () => {
            (Highlight.find as jest.Mock).mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue([])
                })
            });

            const response = await request(app)
                .get('/api/v1/highlights')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.highlights).toEqual([]);
            expect(response.body.data.count).toBe(0);
        });

        it('should handle database errors gracefully', async () => {
            (Highlight.find as jest.Mock).mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    lean: jest.fn().mockRejectedValue(new Error('Database error'))
                })
            });

            const response = await request(app)
                .get('/api/v1/highlights')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Internal server error while retrieving highlights');
        });
    });

    describe('GET /api/v1/highlights/:id', () => {
        it('should return 401 when no token is provided', async () => {
            const response = await request(app)
                .get('/api/v1/highlights/507f1f77bcf86cd799439012');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token is required');
        });

        it('should return 401 when invalid token is provided', async () => {
            const response = await request(app)
                .get('/api/v1/highlights/507f1f77bcf86cd799439012')
                .set('Authorization', 'Bearer invalid-token');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid token');
        });

        it('should return specific highlight by ID', async () => {
            (Highlight.findOne as jest.Mock).mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockHighlight)
            });

            const response = await request(app)
                .get('/api/v1/highlights/507f1f77bcf86cd799439012')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Highlight retrieved successfully');
            expect(response.body.data.highlight).toEqual(mockHighlight);
            expect(Highlight.findOne).toHaveBeenCalledWith({
                _id: '507f1f77bcf86cd799439012',
                userId: mockUser._id
            });
        });

        it('should return 404 when highlight not found', async () => {
            (Highlight.findOne as jest.Mock).mockReturnValue({
                lean: jest.fn().mockResolvedValue(null)
            });

            const response = await request(app)
                .get('/api/v1/highlights/507f1f77bcf86cd799439012')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Highlight not found');
        });

        it('should return 404 when highlight belongs to another user', async () => {
            (Highlight.findOne as jest.Mock).mockReturnValue({
                lean: jest.fn().mockResolvedValue(null)
            });

            const response = await request(app)
                .get('/api/v1/highlights/507f1f77bcf86cd799439012')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Highlight not found');
        });

        it('should handle database errors gracefully', async () => {
            (Highlight.findOne as jest.Mock).mockReturnValue({
                lean: jest.fn().mockRejectedValue(new Error('Database error'))
            });

            const response = await request(app)
                .get('/api/v1/highlights/507f1f77bcf86cd799439012')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Internal server error while retrieving highlight');
        });
    });

    describe('POST /api/v1/highlights', () => {
        it('should return 401 when no token is provided', async () => {
            const response = await request(app)
                .post('/api/v1/highlights')
                .send({
                    bookId: 'John',
                    chapter: 3,
                    verseStart: 16,
                    verseCount: 1,
                    color: 'yellow'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token is required');
        });

        it('should return 401 when invalid token is provided', async () => {
            const response = await request(app)
                .post('/api/v1/highlights')
                .set('Authorization', 'Bearer invalid-token')
                .send({
                    bookId: 'John',
                    chapter: 3,
                    verseStart: 16,
                    verseCount: 1,
                    color: 'yellow'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid token');
        });

        it('should return 400 when required fields are missing', async () => {
            const response = await request(app)
                .post('/api/v1/highlights')
                .set('Authorization', `Bearer ${validToken}`)
                .send({
                    bookId: 'John',
                    chapter: 3
                    // missing verseStart, verseCount, color
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('bookId, chapter, verseStart, verseCount, and color are required');
        });

        it('should return 400 when color is invalid', async () => {
            const response = await request(app)
                .post('/api/v1/highlights')
                .set('Authorization', `Bearer ${validToken}`)
                .send({
                    bookId: 'John',
                    chapter: 3,
                    verseStart: 16,
                    verseCount: 1,
                    color: 'black' // invalid color
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('color must be one of: yellow, green, blue, pink, purple, orange, red');
        });

        it('should return 400 when chapter is less than 1', async () => {
            const response = await request(app)
                .post('/api/v1/highlights')
                .set('Authorization', `Bearer ${validToken}`)
                .send({
                    bookId: 'John',
                    chapter: 0, // invalid chapter
                    verseStart: 16,
                    verseCount: 1,
                    color: 'yellow'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('chapter must be at least 1');
        });

        it('should return 400 when verseStart is less than 1', async () => {
            const response = await request(app)
                .post('/api/v1/highlights')
                .set('Authorization', `Bearer ${validToken}`)
                .send({
                    bookId: 'John',
                    chapter: 3,
                    verseStart: 0, // invalid verseStart
                    verseCount: 1,
                    color: 'yellow'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('verseStart must be at least 1');
        });

        it('should return 400 when verseCount is less than 1', async () => {
            const response = await request(app)
                .post('/api/v1/highlights')
                .set('Authorization', `Bearer ${validToken}`)
                .send({
                    bookId: 'John',
                    chapter: 3,
                    verseStart: 16,
                    verseCount: 0, // invalid verseCount
                    color: 'yellow'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('verseCount must be at least 1');
        });

        it('should return 409 when highlight already exists for verse range', async () => {
            // Mock that existing highlight is found
            (Highlight.findOne as jest.Mock).mockResolvedValue(mockHighlight);

            const response = await request(app)
                .post('/api/v1/highlights')
                .set('Authorization', `Bearer ${validToken}`)
                .send({
                    bookId: 'John',
                    chapter: 3,
                    verseStart: 16,
                    verseCount: 1,
                    color: 'yellow'
                });

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Highlight already exists for this verse range');
        });
    });

    describe('PUT /api/v1/highlights/:id', () => {
        it('should return 401 when no token is provided', async () => {
            const response = await request(app)
                .put('/api/v1/highlights/507f1f77bcf86cd799439012')
                .send({
                    color: 'red'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token is required');
        });

        it('should return 401 when invalid token is provided', async () => {
            const response = await request(app)
                .put('/api/v1/highlights/507f1f77bcf86cd799439012')
                .set('Authorization', 'Bearer invalid-token')
                .send({
                    color: 'red'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid token');
        });

        it('should return 400 when color is invalid', async () => {
            const response = await request(app)
                .put('/api/v1/highlights/507f1f77bcf86cd799439012')
                .set('Authorization', `Bearer ${validToken}`)
                .send({
                    color: 'brown' // invalid color
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('color must be one of: yellow, green, blue, pink, purple, orange, red');
        });

        it('should return 400 when verseStart is less than 1', async () => {
            const response = await request(app)
                .put('/api/v1/highlights/507f1f77bcf86cd799439012')
                .set('Authorization', `Bearer ${validToken}`)
                .send({
                    verseStart: 0 // invalid verseStart
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('verseStart must be at least 1');
        });

        it('should return 400 when verseCount is less than 1', async () => {
            const response = await request(app)
                .put('/api/v1/highlights/507f1f77bcf86cd799439012')
                .set('Authorization', `Bearer ${validToken}`)
                .send({
                    verseCount: 0 // invalid verseCount
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('verseCount must be at least 1');
        });

        it('should return 400 when chapter is less than 1', async () => {
            const response = await request(app)
                .put('/api/v1/highlights/507f1f77bcf86cd799439012')
                .set('Authorization', `Bearer ${validToken}`)
                .send({
                    chapter: 0 // invalid chapter
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('chapter must be at least 1');
        });
    });

    describe('DELETE /api/v1/highlights/:id', () => {
        it('should return 401 when no token is provided', async () => {
            const response = await request(app)
                .delete('/api/v1/highlights/507f1f77bcf86cd799439012');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token is required');
        });

        it('should return 401 when invalid token is provided', async () => {
            const response = await request(app)
                .delete('/api/v1/highlights/507f1f77bcf86cd799439012')
                .set('Authorization', 'Bearer invalid-token');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid token');
        });

        it('should delete highlight successfully', async () => {
            (Highlight.findOneAndDelete as jest.Mock).mockResolvedValue(mockHighlight);

            const response = await request(app)
                .delete('/api/v1/highlights/507f1f77bcf86cd799439012')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Highlight deleted successfully');
            expect(response.body.data.highlight).toEqual(mockHighlight);
            expect(Highlight.findOneAndDelete).toHaveBeenCalledWith({
                _id: '507f1f77bcf86cd799439012',
                userId: mockUser._id
            });
        });

        it('should return 404 when highlight not found', async () => {
            (Highlight.findOneAndDelete as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .delete('/api/v1/highlights/507f1f77bcf86cd799439012')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Highlight not found');
        });

        it('should return 404 when highlight belongs to another user', async () => {
            (Highlight.findOneAndDelete as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .delete('/api/v1/highlights/507f1f77bcf86cd799439012')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Highlight not found');
        });
    });

    describe('Authentication Edge Cases', () => {
        it('should return 401 when token is expired', async () => {
            // Create an expired token
            const expiredToken = jwt.sign(
                { userId: mockUser._id, email: mockUser.email, name: mockUser.name },
                JWT_SECRET,
                { expiresIn: '0.001s' } // 1 millisecond
            );

            // Wait for token to expire
            await new Promise(resolve => setTimeout(resolve, 10));

            const response = await request(app)
                .get('/api/v1/highlights')
                .set('Authorization', `Bearer ${expiredToken}`);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid token');
        });

        it('should return 401 when user not found in database', async () => {
            // Mock User.findById().select() to return null
            const mockSelect = jest.fn().mockResolvedValue(null);
            (User.findById as jest.Mock).mockReturnValue({
                select: mockSelect
            });

            const response = await request(app)
                .get('/api/v1/highlights')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid token - user not found');
        });
    });
});
