import { Router } from 'express';
import { activityController } from '../controllers/activity.controller.js';
import { authMiddleware } from '../../../shared/middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', activityController.list);

export default router;
