import { Router } from 'express';
import {
    getBookmarks,
    getBookmarkById,
    createBookmark,
    updateBookmark,
    deleteBookmark
} from '../controllers/bookmark.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All bookmark routes require authentication
router.use(protect);

// GET /api/v1/bookmarks - Get all bookmarks for the authenticated user
router.get('/', getBookmarks);

// GET /api/v1/bookmarks/:id - Get a specific bookmark by ID
router.get('/:id', getBookmarkById);

// POST /api/v1/bookmarks - Create a new bookmark
router.post('/', createBookmark);

// PUT /api/v1/bookmarks/:id - Update a bookmark by ID
router.put('/:id', updateBookmark);

// DELETE /api/v1/bookmarks/:id - Delete a bookmark by ID
router.delete('/:id', deleteBookmark);

export default router;
