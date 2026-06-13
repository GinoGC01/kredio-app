import { Router } from 'express';
import { creditController } from '../controllers/credit.controller.js';
import { authMiddleware } from '../../../shared/middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', creditController.list);
router.post('/', creditController.create);
router.get('/:id', creditController.getById);
router.get('/client/:clientId', creditController.listByClient);

export default router;
