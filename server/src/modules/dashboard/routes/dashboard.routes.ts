import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller.js';
import { authMiddleware } from '../../../shared/middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', dashboardController.getDashboard);

export default router;
