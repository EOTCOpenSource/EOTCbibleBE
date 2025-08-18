import { Router } from 'express';
import {
    getHighlights,
    getHighlightById,
    createHighlight,
    updateHighlight,
    deleteHighlight
} from '../controllers/highlight.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All highlight routes require authentication
router.use(protect);

// GET /api/v1/highlights - Get all highlights for the authenticated user
router.get('/', getHighlights);

// GET /api/v1/highlights/:id - Get a specific highlight by ID
router.get('/:id', getHighlightById);

// POST /api/v1/highlights - Create a new highlight
router.post('/', createHighlight);

// PUT /api/v1/highlights/:id - Update a highlight by ID
router.put('/:id', updateHighlight);

// DELETE /api/v1/highlights/:id - Delete a highlight by ID
router.delete('/:id', deleteHighlight);

export default router;

