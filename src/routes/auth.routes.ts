import { Router } from 'express';
import { register, login, getProfile, logout, deleteAccount } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// POST /api/v1/auth/register - Register new user
router.post('/register', register);

// POST /api/v1/auth/login - Login user
router.post('/login', login);

// POST /api/v1/auth/logout - Logout user (placeholder)
router.post('/logout', protect, logout);

// GET /api/v1/auth/profile - Get current user profile (requires authentication)
router.get('/profile', protect, getProfile);

// DELETE /api/v1/auth/account - Delete user account and all associated data
router.delete('/account', protect, deleteAccount);

export default router;
