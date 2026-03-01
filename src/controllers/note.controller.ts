import { Request, Response } from 'express';
import { Note, INote } from '../models';
import { paginate, parsePaginationQuery, createPaginationResult, PaginationQuery } from '../utils/pagination';
import cache from '../utils/cache';

// Interface for note request body
interface NoteRequest {
    bookId: string;
    chapter: number;
    verseStart: number;
    verseCount: number;
    content: string;
    visibility?: 'private' | 'public';
}

// Interface for note update request body
interface NoteUpdateRequest {
    bookId?: string;
    chapter?: number;
    verseStart?: number;
    verseCount?: number;
    content?: string;
    visibility?: 'private' | 'public';
}

// Get all notes for the authenticated user
export const getNotes = async (req: Request, res: Response): Promise<void> => {
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
        const { bookId, chapter, visibility } = req.query;
        const filter: any = { userId: user._id };

        if (bookId) {
            filter.bookId = bookId;
        }

        if (chapter) {
            filter.chapter = parseInt(chapter as string);
        }

        // Cache key based on user and query
        const cacheKey = `notes:list:${user._id}:${JSON.stringify(req.query)}:${paginationOptions.page}:${paginationOptions.limit}`;

        // Try cache first
        const cachedResult = await cache.getCache<any>(cacheKey);
        if (cachedResult) {
            res.status(200).json({
                success: true,
                message: 'Notes retrieved successfully (from cache)',
                data: cachedResult
            });
            return;
        }

        if (visibility && (visibility === 'private' || visibility === 'public')) {
            filter.visibility = visibility;
        }

        // Get total count for pagination
        const totalItems = await Note.countDocuments(filter);

        // Get paginated notes
        const notes = await Note.find(filter)
            .sort({ createdAt: -1 })
            .skip(paginationOptions.skip)
            .limit(paginationOptions.limit)
            .lean();

        // Create pagination result
        const paginationResult = createPaginationResult(
            notes,
            totalItems,
            paginationOptions.page,
            paginationOptions.limit
        );

        // Cache for 15 minutes
        await cache.setCache(cacheKey, paginationResult, 900);

        res.status(200).json({
            success: true,
            message: 'Notes retrieved successfully',
            data: paginationResult
        });

    } catch (error) {
        console.error('Get notes error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving notes'
        });
    }
};

// Get a specific note by ID
export const getNoteById = async (req: Request, res: Response): Promise<void> => {
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
        const cacheKey = `notes:single:${id}:${user._id}`;
        const cachedNote = await cache.getCache<any>(cacheKey);
        if (cachedNote) {
            res.status(200).json({
                success: true,
                message: 'Note retrieved successfully (from cache)',
                data: { note: cachedNote }
            });
            return;
        }

        const note = await Note.findOne({
            _id: id,
            userId: user._id
        }).lean();

        if (!note) {
            res.status(404).json({
                success: false,
                message: 'Note not found'
            });
            return;
        }

        // Cache for 30 minutes
        await cache.setCache(cacheKey, note, 1800);

        res.status(200).json({
            success: true,
            message: 'Note retrieved successfully',
            data: { note }
        });

    } catch (error) {
        console.error('Get note by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving note'
        });
    }
};

// Create a new note
export const createNote = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }

        const { bookId, chapter, verseStart, verseCount, content, visibility }: NoteRequest = req.body;

        // Validate required fields
        if (!bookId || chapter === undefined || verseStart === undefined || verseCount === undefined || !content) {
            res.status(400).json({
                success: false,
                message: 'bookId, chapter, verseStart, verseCount, and content are required'
            });
            return;
        }

        // Validate content is a non-empty string
        if (typeof content !== 'string' || content.trim().length === 0) {
            res.status(400).json({
                success: false,
                message: 'content must be a non-empty string'
            });
            return;
        }

        // Validate visibility if provided
        if (visibility && visibility !== 'private' && visibility !== 'public') {
            res.status(400).json({
                success: false,
                message: 'visibility must be either "private" or "public"'
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

        // Check if note already exists for this verse range
        const existingNote = await Note.findOne({
            userId: user._id,
            bookId: bookId.trim(),
            chapter,
            verseStart,
            verseCount
        });

        if (existingNote) {
            res.status(409).json({
                success: false,
                message: 'Note already exists for this verse range'
            });
            return;
        }

        // Create new note
        const newNote = new Note({
            userId: user._id,
            bookId: bookId.trim(),
            chapter,
            verseStart,
            verseCount,
            content: content.trim(),
            visibility: visibility || 'private'
        });

        const savedNote = await newNote.save();

        // Invalidate caches
        await cache.deleteCacheByPattern(`notes:list:${user._id}:*`);
        if (visibility === 'public') {
            await cache.deleteCacheByPattern('notes:public:*');
        }

        res.status(201).json({
            success: true,
            message: 'Note created successfully',
            data: {
                note: savedNote
            }
        });

    } catch (error) {
        console.error('Create note error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while creating note'
        });
    }
};

// Update a note by ID
export const updateNote = async (req: Request, res: Response): Promise<void> => {
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
        const { bookId, chapter, verseStart, verseCount, content, visibility }: NoteUpdateRequest = req.body;

        // Validate content is a non-empty string if provided
        if (content !== undefined && (typeof content !== 'string' || content.trim().length === 0)) {
            res.status(400).json({
                success: false,
                message: 'content must be a non-empty string'
            });
            return;
        }

        // Validate visibility if provided
        if (visibility !== undefined && visibility !== 'private' && visibility !== 'public') {
            res.status(400).json({
                success: false,
                message: 'visibility must be either "private" or "public"'
            });
            return;
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

        // Find the note and ensure it belongs to the user
        const note = await Note.findOne({
            _id: id,
            userId: user._id
        });

        if (!note) {
            res.status(404).json({
                success: false,
                message: 'Note not found'
            });
            return;
        }

        // Update fields if provided
        if (bookId !== undefined) {
            note.bookId = bookId.trim();
        }
        if (chapter !== undefined) {
            note.chapter = chapter;
        }
        if (verseStart !== undefined) {
            note.verseStart = verseStart;
        }
        if (verseCount !== undefined) {
            note.verseCount = verseCount;
        }
        if (content !== undefined) {
            note.content = content.trim();
        }
        if (visibility !== undefined) {
            note.visibility = visibility;
        }

        const updatedNote = await note.save();

        // Invalidate caches
        await cache.deleteCache(`notes:single:${id}:${user._id}`);
        await cache.deleteCacheByPattern(`notes:list:${user._id}:*`);
        await cache.deleteCacheByPattern('notes:public:*');

        res.status(200).json({
            success: true,
            message: 'Note updated successfully',
            data: {
                note: updatedNote
            }
        });

    } catch (error) {
        console.error('Update note error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating note'
        });
    }
};

// Delete a note by ID
export const deleteNote = async (req: Request, res: Response): Promise<void> => {
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

        // Find and delete the note, ensuring it belongs to the user
        const deletedNote = await Note.findOneAndDelete({
            _id: id,
            userId: user._id
        });

        if (!deletedNote) {
            res.status(404).json({
                success: false,
                message: 'Note not found'
            });
            return;
        }

        // Invalidate caches
        await cache.deleteCache(`notes:single:${id}:${user._id}`);
        await cache.deleteCacheByPattern(`notes:list:${user._id}:*`);
        await cache.deleteCacheByPattern('notes:public:*');

        res.status(200).json({
            success: true,
            message: 'Note deleted successfully',
            data: {
                note: deletedNote
            }
        });

    } catch (error) {
        console.error('Delete note error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while deleting note'
        });
    }
};

// Get all public notes (no authentication required)
export const getPublicNotes = async (req: Request, res: Response): Promise<void> => {
    try {
        // Parse pagination parameters
        const paginationOptions = parsePaginationQuery(req.query as PaginationQuery, 10, 50);

        // Optional query parameters for filtering
        const { bookId, chapter, search } = req.query;
        const filter: any = { visibility: 'public' };

        if (bookId) {
            filter.bookId = bookId;
        }

        if (chapter) {
            filter.chapter = parseInt(chapter as string);
        }

        // Cache key for public notes
        const cacheKey = `notes:public:${JSON.stringify(req.query)}:${paginationOptions.page}:${paginationOptions.limit}`;

        // Try cache first
        const cachedResult = await cache.getCache<any>(cacheKey);
        if (cachedResult) {
            res.status(200).json({
                success: true,
                message: 'Public notes retrieved successfully (from cache)',
                data: cachedResult
            });
            return;
        }

        let notes;
        let totalItems;

        if (search) {
            // Use text search for public notes
            notes = await Note.searchPublicNotesByContent(search as string);
            totalItems = notes.length;
        } else {
            // Get total count for pagination
            totalItems = await Note.countDocuments(filter);

            // Get paginated notes
            notes = await Note.find(filter)
                .populate('userId', 'name')
                .sort({ createdAt: -1 })
                .skip(paginationOptions.skip)
                .limit(paginationOptions.limit)
                .lean();
        }

        // Create pagination result
        const paginationResult = createPaginationResult(
            notes,
            totalItems,
            paginationOptions.page,
            paginationOptions.limit
        );

        // Cache for 10 minutes
        await cache.setCache(cacheKey, paginationResult, 600);

        res.status(200).json({
            success: true,
            message: 'Public notes retrieved successfully',
            data: paginationResult
        });

    } catch (error) {
        console.error('Get public notes error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving public notes'
        });
    }
};

// Get public notes for a specific verse range (no authentication required)
export const getPublicNotesByVerse = async (req: Request, res: Response): Promise<void> => {
    try {
        const { bookId, chapter, verseStart, verseEnd } = req.query;

        // Validate required parameters
        if (!bookId || !chapter || !verseStart || !verseEnd) {
            res.status(400).json({
                success: false,
                message: 'bookId, chapter, verseStart, and verseEnd are required'
            });
            return;
        }

        const notes = await Note.findPublicNotesByVerseRange(
            bookId as string,
            parseInt(chapter as string),
            parseInt(verseStart as string),
            parseInt(verseEnd as string)
        );

        res.status(200).json({
            success: true,
            message: 'Public notes for verse range retrieved successfully',
            data: {
                notes,
                count: notes.length
            }
        });

    } catch (error) {
        console.error('Get public notes by verse error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving public notes for verse range'
        });
    }
};

// Get a specific public note by ID (no authentication required)
export const getPublicNoteById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const note = await Note.findOne({
            _id: id,
            visibility: 'public'
        }).populate('userId', 'name').lean();

        if (!note) {
            res.status(404).json({
                success: false,
                message: 'Public note not found'
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Public note retrieved successfully',
            data: {
                note
            }
        });

    } catch (error) {
        console.error('Get public note by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving public note'
        });
    }
};
