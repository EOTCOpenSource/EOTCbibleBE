import { Router } from 'express';
import { register, login, getProfile } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// POST /api/v1/auth/register - Register new user
router.post('/register', register);

// POST /api/v1/auth/login - Login user
router.post('/login', login);

// GET /api/v1/auth/profile - Get current user profile (requires authentication)
router.get('/profile', authenticateToken, getProfile);

export default router;
