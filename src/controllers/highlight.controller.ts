import { Request, Response } from 'express';
import { Highlight, IHighlight } from '../models';
import { paginate, parsePaginationQuery, createPaginationResult, PaginationQuery } from '../utils/pagination';
import cache from '../utils/cache';

// Interface for highlight request body
interface HighlightRequest {
    bookId: string;
    chapter: number;
    verseStart: number;
    verseCount: number;
    color: string;
}

// Interface for highlight update request body
interface HighlightUpdateRequest {
    bookId?: string;
    chapter?: number;
    verseStart?: number;
    verseCount?: number;
    color?: string;
}

// Get all highlights for the authenticated user
export const getHighlights = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }


        // Get pagination parameters with defaults and validation
        let page = parseInt(req.query.page as string) || 1;
        let limit = parseInt(req.query.limit as string) || 10;

        if (page < 1) page = 1;
        if (limit < 1 || limit > 100) limit = 10;

        // Parse pagination parameters
        const paginationOptions = parsePaginationQuery(req.query as PaginationQuery, 10, 50);


        // Optional query parameters for filtering
        const { bookId, chapter, color } = req.query;
        const filter: any = { userId: user._id };

        if (bookId) {
            filter.bookId = bookId;
        }

        if (chapter) {
            filter.chapter = parseInt(chapter as string);
        }

        if (color) {
            filter.color = color;
        }

        // Cache key based on user and query
        const cacheKey = `highlights:list:${user._id}:${JSON.stringify(req.query)}:${paginationOptions.page}:${paginationOptions.limit}`;

        // Try cache first
        const cachedResult = await cache.getCache<any>(cacheKey);
        if (cachedResult) {
            res.status(200).json({
                success: true,
                message: 'Highlights retrieved successfully (from cache)',
                data: cachedResult
            });
            return;
        }

        // Get total count for pagination
        const totalItems = await Highlight.countDocuments(filter);

        // Get paginated highlights
        const highlights = await Highlight.find(filter)
            .sort({ createdAt: -1 })
            .skip(paginationOptions.skip)
            .limit(paginationOptions.limit)
            .lean();

        // Create pagination result
        const paginationResult = createPaginationResult(
            highlights,
            totalItems,
            paginationOptions.page,
            paginationOptions.limit
        );

        // Cache for 15 minutes
        await cache.setCache(cacheKey, paginationResult, 900);

        res.status(200).json({
            success: true,
            message: 'Highlights retrieved successfully',
            data: paginationResult
        });

    } catch (error) {
        console.error('Get highlights error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving highlights'
        });
    }
};

// Get a specific highlight by ID
export const getHighlightById = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }

        const { id } = req.params;

        // Try cache first
        const cacheKey = `highlights:single:${id}:${user._id}`;
        const cachedHighlight = await cache.getCache<any>(cacheKey);
        if (cachedHighlight) {
            res.status(200).json({
                success: true,
                message: 'Highlight retrieved successfully (from cache)',
                data: { highlight: cachedHighlight }
            });
            return;
        }

        const highlight = await Highlight.findOne({
            _id: id,
            userId: user._id
        }).lean();

        if (!highlight) {
            res.status(404).json({
                success: false,
                message: 'Highlight not found'
            });
            return;
        }

        // Cache for 30 minutes
        await cache.setCache(cacheKey, highlight, 1800);

        res.status(200).json({
            success: true,
            message: 'Highlight retrieved successfully',
            data: { highlight }
        });

    } catch (error) {
        console.error('Get highlight by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving highlight'
        });
    }
};

// Create a new highlight
export const createHighlight = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }

        const { bookId, chapter, verseStart, verseCount, color }: HighlightRequest = req.body;

        // Validate required fields
        if (!bookId || chapter === undefined || verseStart === undefined || verseCount === undefined || !color) {
            res.status(400).json({
                success: false,
                message: 'bookId, chapter, verseStart, verseCount, and color are required'
            });
            return;
        }

        // Validate color is a valid option
        const validColors = ['yellow', 'green', 'blue', 'pink', 'purple', 'orange', 'red'];
        if (!validColors.includes(color)) {
            res.status(400).json({
                success: false,
                message: 'color must be one of: yellow, green, blue, pink, purple, orange, red'
            });
            return;
        }

        // Validate chapter, verseStart and verseCount
        if (chapter < 1) {
            res.status(400).json({
                success: false,
                message: 'chapter must be at least 1'
            });
            return;
        }

        if (verseStart < 1) {
            res.status(400).json({
                success: false,
                message: 'verseStart must be at least 1'
            });
            return;
        }

        if (verseCount < 1) {
            res.status(400).json({
                success: false,
                message: 'verseCount must be at least 1'
            });
            return;
        }

        // Check if highlight already exists for this verse range
        const existingHighlight = await Highlight.findOne({
            userId: user._id,
            bookId: bookId.trim(),
            chapter,
            verseStart,
            verseCount
        });

        if (existingHighlight) {
            res.status(409).json({
                success: false,
                message: 'Highlight already exists for this verse range'
            });
            return;
        }

        // Create new highlight
        const newHighlight = new Highlight({
            userId: user._id,
            bookId: bookId.trim(),
            chapter,
            verseStart,
            verseCount,
            color: color.trim()
        });

        const savedHighlight = await newHighlight.save();

        // Invalidate list cache
        await cache.deleteCacheByPattern(`highlights:list:${user._id}:*`);

        res.status(201).json({
            success: true,
            message: 'Highlight created successfully',
            data: {
                highlight: savedHighlight
            }
        });

    } catch (error) {
        console.error('Create highlight error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while creating highlight'
        });
    }
};

// Update a highlight by ID
export const updateHighlight = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }

        const { id } = req.params;
        const { bookId, chapter, verseStart, verseCount, color }: HighlightUpdateRequest = req.body;

        // Validate color is a valid option if provided
        if (color !== undefined) {
            const validColors = ['yellow', 'green', 'blue', 'pink', 'purple', 'orange', 'red'];
            if (!validColors.includes(color)) {
                res.status(400).json({
                    success: false,
                    message: 'color must be one of: yellow, green, blue, pink, purple, orange, red'
                });
                return;
            }
        }

        // Validate verseStart and verseCount if provided
        if (verseStart !== undefined && verseStart < 1) {
            res.status(400).json({
                success: false,
                message: 'verseStart must be at least 1'
            });
            return;
        }

        if (verseCount !== undefined && verseCount < 1) {
            res.status(400).json({
                success: false,
                message: 'verseCount must be at least 1'
            });
            return;
        }

        if (chapter !== undefined && chapter < 1) {
            res.status(400).json({
                success: false,
                message: 'chapter must be at least 1'
            });
            return;
        }

        // Find the highlight and ensure it belongs to the user
        const highlight = await Highlight.findOne({
            _id: id,
            userId: user._id
        });

        if (!highlight) {
            res.status(404).json({
                success: false,
                message: 'Highlight not found'
            });
            return;
        }

        // Update fields if provided
        if (bookId !== undefined) {
            highlight.bookId = bookId.trim();
        }
        if (chapter !== undefined) {
            highlight.chapter = chapter;
        }
        if (verseStart !== undefined) {
            highlight.verseStart = verseStart;
        }
        if (verseCount !== undefined) {
            highlight.verseCount = verseCount;
        }
        if (color !== undefined) {
            highlight.color = color.trim();
        }

        const updatedHighlight = await highlight.save();

        // Invalidate caches
        await cache.deleteCache(`highlights:single:${id}:${user._id}`);
        await cache.deleteCacheByPattern(`highlights:list:${user._id}:*`);

        res.status(200).json({
            success: true,
            message: 'Highlight updated successfully',
            data: {
                highlight: updatedHighlight
            }
        });

    } catch (error) {
        console.error('Update highlight error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating highlight'
        });
    }
};

// Delete a highlight by ID
export const deleteHighlight = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }

        const { id } = req.params;

        // Find and delete the highlight, ensuring it belongs to the user
        const deletedHighlight = await Highlight.findOneAndDelete({
            _id: id,
            userId: user._id
        });

        if (!deletedHighlight) {
            res.status(404).json({
                success: false,
                message: 'Highlight not found'
            });
            return;
        }

        // Invalidate caches
        await cache.deleteCache(`highlights:single:${id}:${user._id}`);
        await cache.deleteCacheByPattern(`highlights:list:${user._id}:*`);

        res.status(200).json({
            success: true,
            message: 'Highlight deleted successfully',
            data: {
                highlight: deletedHighlight
            }
        });

    } catch (error) {
        console.error('Delete highlight error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while deleting highlight'
        });
    }
};

