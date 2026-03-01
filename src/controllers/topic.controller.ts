import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Topic, IVerseReference } from '../models';
import { parsePaginationQuery, createPaginationResult, PaginationQuery } from '../utils/pagination';
import cache from '../utils/cache';

// Create a new topic
export const createTopic = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, verses } = req.body;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }

        // Validate required fields
        if (!name || typeof name !== 'string' || name.trim() === '') {
            res.status(400).json({
                success: false,
                message: 'Topic name is required and must be a non-empty string'
            });
            return;
        }

        // Check if topic name already exists for this user
        const existingTopic = await Topic.findOne({ userId, name: name.trim() });
        if (existingTopic) {
            res.status(409).json({
                success: false,
                message: 'A topic with this name already exists'
            });
            return;
        }

        // Validate verses if provided
        if (verses && Array.isArray(verses)) {
            for (const verse of verses) {
                if (!verse.bookId || verse.chapter === undefined || verse.verseStart === undefined || verse.verseCount === undefined) {
                    res.status(400).json({
                        success: false,
                        message: 'Each verse must have bookId, chapter, verseStart, and verseCount'
                    });
                    return;
                }

                if (verse.chapter < 1 || verse.verseStart < 1 || verse.verseCount < 1) {
                    res.status(400).json({
                        success: false,
                        message: 'Chapter, verseStart, and verseCount must be positive numbers'
                    });
                    return;
                }
            }
        }

        // Create the topic
        const topic = new Topic({
            userId,
            name: name.trim(),
            verses: verses || []
        });

        await topic.save();

        // Invalidate list cache for this user
        await cache.deleteCacheByPattern(`topics:list:${userId}:*`);

        res.status(201).json({
            success: true,
            message: 'Topic created successfully',
            data: {
                topic: {
                    _id: topic._id,
                    name: topic.name,
                    verses: topic.verses,
                    totalVerses: topic.totalVerses,
                    uniqueBooks: topic.uniqueBooks,
                    createdAt: topic.createdAt,
                    updatedAt: topic.updatedAt
                }
            }
        });

    } catch (error) {
        console.error('Error creating topic:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while creating topic'
        });
    }
};

// Get all topics for a user
export const getTopics = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const { search, sort = 'createdAt', order = 'desc' } = req.query;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }

        // Parse pagination parameters
        const paginationOptions = parsePaginationQuery(req.query as PaginationQuery, 10, 50);

        // query definition
        const query: any = { userId };

        // Add search functionality
        if (search && typeof search === 'string') {
            query.name = { $regex: search, $options: 'i' };
        }

        // Build sort object
        const sortObj: Record<string, mongoose.SortOrder> = {};
        if (sort === 'name') {
            sortObj.name = order === 'desc' ? -1 : 1;
        } else if (sort === 'totalVerses') {
            sortObj.totalVerses = order === 'desc' ? -1 : 1;
        } else {
            sortObj.createdAt = order === 'desc' ? -1 : 1;
        }

        // Create cache key based on query parameters
        const cacheKey = `topics:list:${userId}:${JSON.stringify(req.query)}:${paginationOptions.page}:${paginationOptions.limit}`;

        // Try to get from cache
        const cachedResult = await cache.getCache<any>(cacheKey);
        if (cachedResult) {
            res.status(200).json({
                success: true,
                message: 'Topics retrieved successfully (from cache)',
                data: cachedResult
            });
            return;
        }

        // Get total count for pagination
        const totalItems = await Topic.countDocuments(query);

        // Get paginated topics
        const topics = await Topic.find(query)
            .sort(sortObj)
            .select('name verses totalVerses uniqueBooks createdAt updatedAt')
            .skip(paginationOptions.skip)
            .limit(paginationOptions.limit);

        // Create pagination result
        const paginationResult = createPaginationResult(
            topics,
            totalItems,
            paginationOptions.page,
            paginationOptions.limit
        );

        // Save to cache for 30 minutes
        await cache.setCache(cacheKey, paginationResult, 1800);

        res.status(200).json({
            success: true,
            message: 'Topics retrieved successfully',
            data: paginationResult
        });

    } catch (error) {
        console.error('Error retrieving topics:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving topics'
        });
    }
};

// Get a specific topic by ID
export const getTopic = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }

        const cacheKey = `topics:single:${id}:${userId}`;
        const cachedTopic = await cache.getCache<any>(cacheKey);

        if (cachedTopic) {
            res.status(200).json({
                success: true,
                message: 'Topic retrieved successfully (from cache)',
                data: {
                    topic: cachedTopic
                }
            });
            return;
        }

        const topic = await Topic.findOne({ _id: id, userId });

        if (!topic) {
            res.status(404).json({
                success: false,
                message: 'Topic not found'
            });
            return;
        }

        const topicData = {
            _id: topic._id,
            name: topic.name,
            verses: topic.verses,
            totalVerses: topic.totalVerses,
            uniqueBooks: topic.uniqueBooks,
            createdAt: topic.createdAt,
            updatedAt: topic.updatedAt
        };

        // Cache for 1 hour
        await cache.setCache(cacheKey, topicData, 3600);

        res.status(200).json({
            success: true,
            message: 'Topic retrieved successfully',
            data: {
                topic: {
                    _id: topic._id,
                    name: topic.name,
                    verses: topic.verses,
                    totalVerses: topic.totalVerses,
                    uniqueBooks: topic.uniqueBooks,
                    createdAt: topic.createdAt,
                    updatedAt: topic.updatedAt
                }
            }
        });

    } catch (error) {
        console.error('Error retrieving topic:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving topic'
        });
    }
};

// Update topic name (rename)
export const updateTopic = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }

        if (!id) {
            res.status(400).json({
                success: false,
                message: 'Topic ID is required'
            });
            return;
        }

        if (!name || typeof name !== 'string' || name.trim() === '') {
            res.status(400).json({
                success: false,
                message: 'Topic name is required and must be a non-empty string'
            });
            return;
        }

        // Find the topic
        const topic = await Topic.findOne({ _id: id, userId });

        if (!topic) {
            res.status(404).json({
                success: false,
                message: 'Topic not found'
            });
            return;
        }

        // Check if new name already exists for this user (excluding current topic)
        const existingTopic = await Topic.findOne({
            userId,
            name: name.trim(),
            _id: { $ne: id }
        });

        if (existingTopic) {
            res.status(409).json({
                success: false,
                message: 'A topic with this name already exists'
            });
            return;
        }

        // Update the topic name
        topic.name = name.trim();
        await topic.save();

        // Invalidate caches
        await cache.deleteCache(`topics:single:${id}:${userId}`);
        await cache.deleteCacheByPattern(`topics:list:${userId}:*`);

        res.status(200).json({
            success: true,
            message: 'Topic updated successfully',
            data: {
                topic: {
                    _id: topic._id,
                    name: topic.name,
                    verses: topic.verses,
                    totalVerses: topic.totalVerses,
                    uniqueBooks: topic.uniqueBooks,
                    createdAt: topic.createdAt,
                    updatedAt: topic.updatedAt
                }
            }
        });

    } catch (error) {
        console.error('Error updating topic:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating topic'
        });
    }
};

// Delete a topic
export const deleteTopic = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }

        if (!id) {
            res.status(400).json({
                success: false,
                message: 'Topic ID is required'
            });
            return;
        }

        const topic = await Topic.findOneAndDelete({ _id: id, userId });

        if (!topic) {
            res.status(404).json({
                success: false,
                message: 'Topic not found'
            });
            return;
        }

        // Invalidate caches
        await cache.deleteCache(`topics:single:${id}:${userId}`);
        await cache.deleteCacheByPattern(`topics:list:${userId}:*`);

        res.status(200).json({
            success: true,
            message: 'Topic deleted successfully',
            data: {
                deletedTopic: {
                    _id: topic._id,
                    name: topic.name
                }
            }
        });

    } catch (error) {
        console.error('Error deleting topic:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while deleting topic'
        });
    }
};

// Add verses to a topic
export const addVerses = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { verses } = req.body;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }

        if (!id) {
            res.status(400).json({
                success: false,
                message: 'Topic ID is required'
            });
            return;
        }

        if (!verses || !Array.isArray(verses) || verses.length === 0) {
            res.status(400).json({
                success: false,
                message: 'Verses array is required and must not be empty'
            });
            return;
        }

        // Find the topic
        const topic = await Topic.findOne({ _id: id, userId });

        if (!topic) {
            res.status(404).json({
                success: false,
                message: 'Topic not found'
            });
            return;
        }

        // Validate and add verses
        const addedVerses: IVerseReference[] = [];
        const errors: string[] = [];

        for (const verse of verses) {
            if (!verse.bookId || !verse.chapter || !verse.verseStart || !verse.verseCount) {
                errors.push('Each verse must have bookId, chapter, verseStart, and verseCount');
                continue;
            }

            if (verse.chapter < 1 || verse.verseStart < 1 || verse.verseCount < 1) {
                errors.push('Chapter, verseStart, and verseCount must be positive numbers');
                continue;
            }

            // Check if verse already exists
            const exists = topic.verses.some((existingVerse: IVerseReference) =>
                existingVerse.bookId === verse.bookId &&
                existingVerse.chapter === verse.chapter &&
                existingVerse.verseStart === verse.verseStart &&
                existingVerse.verseCount === verse.verseCount
            );

            if (!exists) {
                topic.verses.push(verse);
                addedVerses.push(verse);
            }
        }

        if (errors.length > 0) {
            res.status(400).json({
                success: false,
                message: 'Validation errors occurred',
                errors
            });
            return;
        }

        await topic.save();

        // Invalidate caches
        await cache.deleteCache(`topics:single:${id}:${userId}`);
        await cache.deleteCacheByPattern(`topics:list:${userId}:*`);

        res.status(200).json({
            success: true,
            message: 'Verses added successfully',
            data: {
                topic: {
                    _id: topic._id,
                    name: topic.name,
                    totalVerses: topic.totalVerses,
                    uniqueBooks: topic.uniqueBooks
                },
                addedVerses,
                addedCount: addedVerses.length
            }
        });

    } catch (error) {
        console.error('Error adding verses to topic:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while adding verses to topic'
        });
    }
};

// Remove verses from a topic
export const removeVerses = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { verses } = req.body;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }

        if (!id) {
            res.status(400).json({
                success: false,
                message: 'Topic ID is required'
            });
            return;
        }

        if (!verses || !Array.isArray(verses) || verses.length === 0) {
            res.status(400).json({
                success: false,
                message: 'Verses array is required and must not be empty'
            });
            return;
        }

        // Find the topic
        const topic = await Topic.findOne({ _id: id, userId });

        if (!topic) {
            res.status(404).json({
                success: false,
                message: 'Topic not found'
            });
            return;
        }

        // Remove verses
        const removedVerses: IVerseReference[] = [];
        const originalCount = topic.verses.length;

        for (const verse of verses) {
            if (!verse.bookId || !verse.chapter || !verse.verseStart || !verse.verseCount) {
                res.status(400).json({
                    success: false,
                    message: 'Each verse must have bookId, chapter, verseStart, and verseCount'
                });
                return;
            }

            const index = topic.verses.findIndex((existingVerse: IVerseReference) =>
                existingVerse.bookId === verse.bookId &&
                existingVerse.chapter === verse.chapter &&
                existingVerse.verseStart === verse.verseStart &&
                existingVerse.verseCount === verse.verseCount
            );

            if (index !== -1) {
                if (topic.verses[index]) {
                    removedVerses.push(topic.verses[index]);
                }
                topic.verses.splice(index, 1);
            }
        }

        await topic.save();

        // Invalidate caches
        await cache.deleteCache(`topics:single:${id}:${userId}`);
        await cache.deleteCacheByPattern(`topics:list:${userId}:*`);

        res.status(200).json({
            success: true,
            message: 'Verses removed successfully',
            data: {
                topic: {
                    _id: topic._id,
                    name: topic.name,
                    totalVerses: topic.totalVerses,
                    uniqueBooks: topic.uniqueBooks
                },
                removedVerses,
                removedCount: removedVerses.length,
                remainingCount: topic.verses.length
            }
        });

    } catch (error) {
        console.error('Error removing verses from topic:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while removing verses from topic'
        });
    }
};

// Get topics that contain a specific verse
export const getTopicsByVerse = async (req: Request, res: Response): Promise<void> => {
    try {
        const { bookId, chapter, verseStart, verseEnd } = req.query;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }

        if (!bookId || !chapter || !verseStart) {
            res.status(400).json({
                success: false,
                message: 'bookId, chapter, and verseStart are required'
            });
            return;
        }

        const topics = await Topic.findByVerse(
            userId as mongoose.Types.ObjectId,
            bookId as string,
            parseInt(chapter as string),
            parseInt(verseStart as string),
            verseEnd ? parseInt(verseEnd as string) : undefined
        );

        res.status(200).json({
            success: true,
            message: 'Topics containing verse retrieved successfully',
            data: {
                topics: topics.map((topic: any) => ({
                    _id: topic._id,
                    name: topic.name,
                    totalVerses: topic.totalVerses,
                    uniqueBooks: topic.uniqueBooks
                })),
                count: topics.length
            }
        });

    } catch (error) {
        console.error('Error retrieving topics by verse:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving topics by verse'
        });
    }
};

// Get topic statistics
export const getTopicStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }

        const stats = await Topic.getStats(userId as mongoose.Types.ObjectId);

        res.status(200).json({
            success: true,
            message: 'Topic statistics retrieved successfully',
            data: {
                stats: stats[0] || {
                    totalTopics: 0,
                    totalVerses: 0,
                    avgVersesPerTopic: 0
                }
            }
        });

    } catch (error) {
        console.error('Error retrieving topic statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving topic statistics'
        });
    }
};
