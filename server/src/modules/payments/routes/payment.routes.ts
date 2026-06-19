import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller.js';
import { authMiddleware } from '../../../shared/middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', paymentController.list);
router.get('/stats', paymentController.getStats);
router.post('/', paymentController.register);
router.get('/credit/:creditId', paymentController.listByCredit);
router.get('/breakdown/:creditId', paymentController.calculateBreakdown);
router.get('/:id', paymentController.getById);
router.patch('/:id', paymentController.update);
router.delete('/:id', paymentController.softDelete);

export default router;
