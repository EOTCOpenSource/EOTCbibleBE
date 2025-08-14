import { Router } from 'express';
import { register, login, getProfile } from '../controllers/auth.controller';

const router = Router();

// POST /api/v1/auth/register - Register new user
router.post('/register', register);

// POST /api/v1/auth/login - Login user
router.post('/login', login);

// GET /api/v1/auth/profile - Get current user profile (will need auth middleware)
router.get('/profile', getProfile);

export default router;
