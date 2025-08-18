import { Router } from 'express';
import {
    logReading,
    getProgress,
    getBookProgress
} from '../controllers/progress.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All progress routes require authentication
router.use(protect);

// POST /api/v1/progress/log-reading - Log reading progress and update streak
router.post('/log-reading', logReading);

// GET /api/v1/progress - Get user's overall reading progress
router.get('/', getProgress);

// GET /api/v1/progress/:bookId - Get progress for a specific book
router.get('/:bookId', getBookProgress);

export default router;
