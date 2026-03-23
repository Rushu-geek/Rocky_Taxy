import { Router } from 'express';
import { register, login, getMe, updateFcmToken } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);
router.patch('/fcm-token', protect, updateFcmToken);

export default router;
