import { Router } from 'express';
import {
    deleteAllUserData,
    deleteUserDataByType
} from '../controllers/data.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All data routes require authentication
router.use(protect);

// DELETE /api/v1/data/all - Delete all user data except user document
router.delete('/all', deleteAllUserData);

// DELETE /api/v1/data/:type - Delete specific data type for user
router.delete('/:type', deleteUserDataByType);

export default router;
