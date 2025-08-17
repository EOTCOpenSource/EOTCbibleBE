import { Router } from 'express';
import {
    getNotes,
    getNoteById,
    createNote,
    updateNote,
    deleteNote
} from '../controllers/note.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All note routes require authentication
router.use(protect);

// GET /api/v1/notes - Get all notes for the authenticated user
router.get('/', getNotes);

// GET /api/v1/notes/:id - Get a specific note by ID
router.get('/:id', getNoteById);

// POST /api/v1/notes - Create a new note
router.post('/', createNote);

// PUT /api/v1/notes/:id - Update a note by ID
router.put('/:id', updateNote);

// DELETE /api/v1/notes/:id - Delete a note by ID
router.delete('/:id', deleteNote);

export default router;
