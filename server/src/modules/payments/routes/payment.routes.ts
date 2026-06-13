import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller.js';
import { authMiddleware } from '../../../shared/middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', paymentController.list);
router.post('/', paymentController.register);
router.get('/credit/:creditId', paymentController.listByCredit);

export default router;
