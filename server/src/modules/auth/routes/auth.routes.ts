import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authMiddleware } from '../../../shared/middlewares/auth.middleware.js';
import { loginRateLimiter } from '../../../shared/middlewares/rate-limiter.middleware.js';

const router = Router();

router.post('/register', authController.register);
router.post('/login', loginRateLimiter, authController.login);
router.post('/google', authController.googleLogin);
router.post('/logout', authMiddleware, authController.logout);
router.get('/profile', authMiddleware, authController.getProfile);

export default router;
