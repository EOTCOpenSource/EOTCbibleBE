import { Request, Response } from 'express';
import { Note, INote } from '../models';
import { paginate } from '../utils/pagination';

// Interface for note request body
interface NoteRequest {
    bookId: string;
    chapter: number;
    verseStart: number;
    verseCount: number;
    content: string;
}

// Interface for note update request body
interface NoteUpdateRequest {
    bookId?: string;
    chapter?: number;
    verseStart?: number;
    verseCount?: number;
    content?: string;
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

        // Optional query parameters for filtering
        const { bookId, chapter } = req.query;
        const filter: any = { userId: user._id };

        if (bookId) {
            filter.bookId = bookId;
        }

        if (chapter) {
            filter.chapter = parseInt(chapter as string);
        }

        const result = await paginate(Note, filter, page, limit, { createdAt: -1 });

        res.status(200).json({
            success: true,
            message: 'Notes retrieved successfully',
            data: {
                notes: result.data,
                pagination: result.pagination
            }
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

        res.status(200).json({
            success: true,
            message: 'Note retrieved successfully',
            data: {
                note
            }
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

        const { bookId, chapter, verseStart, verseCount, content }: NoteRequest = req.body;

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
            content: content.trim()
        });

        const savedNote = await newNote.save();

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
        const { bookId, chapter, verseStart, verseCount, content }: NoteUpdateRequest = req.body;

        // Validate content is a non-empty string if provided
        if (content !== undefined && (typeof content !== 'string' || content.trim().length === 0)) {
            res.status(400).json({
                success: false,
                message: 'content must be a non-empty string'
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

        const updatedNote = await note.save();

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
