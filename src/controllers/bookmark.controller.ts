import { Request, Response } from 'express';
import { Bookmark, IBookmark } from '../models';
import { paginate, parsePaginationQuery, createPaginationResult, PaginationQuery } from '../utils/pagination';
import cache from '../utils/cache';

// Interface for bookmark request body
interface BookmarkRequest {
    bookId: string;
    chapter: number;
    verseStart: number;
    verseCount: number;
}

// Interface for bookmark update request body
interface BookmarkUpdateRequest {
    bookId?: string;
    chapter?: number;
    verseStart?: number;
    verseCount?: number;
}

// Get all bookmarks for the authenticated user with pagination
export const getBookmarks = async (req: Request, res: Response): Promise<void> => {
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

        //Validate pagination parameters
        if (page < 1) page = 1;
        if (limit < 1 || limit > 100) limit = 10;

        // Parse pagination parameters
        const paginationOptions = parsePaginationQuery(req.query as PaginationQuery, 10, 50);


        // Optional query parameters for filtering
        const { bookId, chapter } = req.query;
        const filter: any = { userId: user._id };

        if (bookId) {
            filter.bookId = bookId;
        }

        if (chapter) {
            filter.chapter = parseInt(chapter as string);
        }


        // Cache key based on user and query
        const cacheKey = `bookmarks:list:${user._id}:${JSON.stringify(req.query)}:${paginationOptions.page}:${paginationOptions.limit}`;

        // Try cache first
        const cachedResult = await cache.getCache<any>(cacheKey);
        if (cachedResult) {
            res.status(200).json({
                success: true,
                message: 'Bookmarks retrieved successfully (from cache)',
                data: cachedResult
            });
            return;
        }

        // Get total count for pagination
        const totalItems = await Bookmark.countDocuments(filter);

        // Get paginated bookmarks
        const bookmarks = await Bookmark.find(filter)
            .sort({ createdAt: -1 })
            .skip(paginationOptions.skip)
            .limit(paginationOptions.limit)
            .lean();

        // Create pagination result
        const paginationResult = createPaginationResult(
            bookmarks,
            totalItems,
            paginationOptions.page,
            paginationOptions.limit
        );

        // Cache for 15 minutes
        await cache.setCache(cacheKey, paginationResult, 900);

        res.status(200).json({
            success: true,
            message: 'Bookmarks retrieved successfully',
            data: paginationResult
        });

    } catch (error) {
        console.error('Get bookmarks error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving bookmarks'
        });
    }
};

// Get a specific bookmark by ID
export const getBookmarkById = async (req: Request, res: Response): Promise<void> => {
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
        const cacheKey = `bookmarks:single:${id}:${user._id}`;
        const cachedBookmark = await cache.getCache<any>(cacheKey);
        if (cachedBookmark) {
            res.status(200).json({
                success: true,
                message: 'Bookmark retrieved successfully (from cache)',
                data: { bookmark: cachedBookmark }
            });
            return;
        }

        const bookmark = await Bookmark.findOne({
            _id: id,
            userId: user._id
        }).lean();

        if (!bookmark) {
            res.status(404).json({
                success: false,
                message: 'Bookmark not found'
            });
            return;
        }

        // Cache for 30 minutes
        await cache.setCache(cacheKey, bookmark, 1800);

        res.status(200).json({
            success: true,
            message: 'Bookmark retrieved successfully',
            data: { bookmark }
        });

    } catch (error) {
        console.error('Get bookmark by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving bookmark'
        });
    }
};

// Create a new bookmark
export const createBookmark = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }

        const { bookId, chapter, verseStart, verseCount }: BookmarkRequest = req.body;

        // Validate required fields
        if (!bookId || chapter === undefined || verseStart === undefined || verseCount === undefined) {
            res.status(400).json({
                success: false,
                message: 'bookId, chapter, verseStart, and verseCount are required'
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

        // Check if bookmark already exists for this verse range
        const existingBookmark = await Bookmark.findOne({
            userId: user._id,
            bookId,
            chapter,
            verseStart,
            verseCount
        });

        if (existingBookmark) {
            res.status(409).json({
                success: false,
                message: 'Bookmark already exists for this verse range'
            });
            return;
        }

        // Create new bookmark
        const newBookmark = new Bookmark({
            userId: user._id,
            bookId: bookId.trim(),
            chapter,
            verseStart,
            verseCount
        });

        const savedBookmark = await newBookmark.save();

        // Invalidate list cache
        await cache.deleteCacheByPattern(`bookmarks:list:${user._id}:*`);

        res.status(201).json({
            success: true,
            message: 'Bookmark created successfully',
            data: {
                bookmark: savedBookmark
            }
        });

    } catch (error) {
        console.error('Create bookmark error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while creating bookmark'
        });
    }
};

// Update a bookmark by ID
export const updateBookmark = async (req: Request, res: Response): Promise<void> => {
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
        const { bookId, chapter, verseStart, verseCount }: BookmarkUpdateRequest = req.body;

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

        // Find the bookmark and ensure it belongs to the user
        const bookmark = await Bookmark.findOne({
            _id: id,
            userId: user._id
        });

        if (!bookmark) {
            res.status(404).json({
                success: false,
                message: 'Bookmark not found'
            });
            return;
        }

        // Update fields if provided
        if (bookId !== undefined) {
            bookmark.bookId = bookId.trim();
        }
        if (chapter !== undefined) {
            bookmark.chapter = chapter;
        }
        if (verseStart !== undefined) {
            bookmark.verseStart = verseStart;
        }
        if (verseCount !== undefined) {
            bookmark.verseCount = verseCount;
        }

        const updatedBookmark = await bookmark.save();

        // Invalidate caches
        await cache.deleteCache(`bookmarks:single:${id}:${user._id}`);
        await cache.deleteCacheByPattern(`bookmarks:list:${user._id}:*`);

        res.status(200).json({
            success: true,
            message: 'Bookmark updated successfully',
            data: {
                bookmark: updatedBookmark
            }
        });

    } catch (error) {
        console.error('Update bookmark error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating bookmark'
        });
    }
};

// Delete a bookmark by ID
export const deleteBookmark = async (req: Request, res: Response): Promise<void> => {
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

        // Find and delete the bookmark, ensuring it belongs to the user
        const deletedBookmark = await Bookmark.findOneAndDelete({
            _id: id,
            userId: user._id
        });

        if (!deletedBookmark) {
            res.status(404).json({
                success: false,
                message: 'Bookmark not found'
            });
            return;
        }

        // Invalidate caches
        await cache.deleteCache(`bookmarks:single:${id}:${user._id}`);
        await cache.deleteCacheByPattern(`bookmarks:list:${user._id}:*`);

        res.status(200).json({
            success: true,
            message: 'Bookmark deleted successfully',
            data: {
                bookmark: deletedBookmark
            }
        });

    } catch (error) {
        console.error('Delete bookmark error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while deleting bookmark'
        });
    }
};