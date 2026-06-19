import { Router } from 'express';
import { clientController } from '../controllers/client.controller.js';
import { authMiddleware } from '../../../shared/middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', clientController.list);
router.post('/', clientController.create);
router.get('/:id', clientController.getById);
router.get('/:id/recent-payments', clientController.getRecentPayments);
router.put('/:id', clientController.update);
router.delete('/:id', clientController.delete);

export default router;
