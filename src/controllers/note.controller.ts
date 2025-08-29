import { Request, Response } from 'express';
import { Note, INote } from '../models';

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

        // Optional query parameters for filtering
        const { bookId, chapter, visibility } = req.query;
        const filter: any = { userId: user._id };

        if (bookId) {
            filter.bookId = bookId;
        }

        if (chapter) {
            filter.chapter = parseInt(chapter as string);
        }

        if (visibility && (visibility === 'private' || visibility === 'public')) {
            filter.visibility = visibility;
        }

        const notes = await Note.find(filter)
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            message: 'Notes retrieved successfully',
            data: {
                notes,
                count: notes.length
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

// Get all public notes (no authentication required)
export const getPublicNotes = async (req: Request, res: Response): Promise<void> => {
    try {
        // Optional query parameters for filtering
        const { bookId, chapter, search } = req.query;
        const filter: any = { visibility: 'public' };

        if (bookId) {
            filter.bookId = bookId;
        }

        if (chapter) {
            filter.chapter = parseInt(chapter as string);
        }

        let notes;
        if (search) {
            // Use text search for public notes
            notes = await Note.searchPublicNotesByContent(search as string);
        } else {
            notes = await Note.find(filter)
                .populate('userId', 'name')
                .sort({ createdAt: -1 })
                .lean();
        }

        res.status(200).json({
            success: true,
            message: 'Public notes retrieved successfully',
            data: {
                notes,
                count: notes.length
            }
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
