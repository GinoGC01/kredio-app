import { Response, NextFunction } from 'express';
import { paymentService } from '../services/payment.service.js';
import { registerPaymentSchema } from '../validators/payment.validator.js';
import { AuthenticatedRequest } from '../../../shared/middlewares/auth.middleware.js';

export const paymentController = {
  register: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = registerPaymentSchema.parse(req.body);
      const payment = await paymentService.register(data, req.userId!);
      res.status(201).json(payment);
    } catch (error) {
      next(error);
    }
  },

  listByCredit: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const creditId = req.params.creditId as string;
      const payments = await paymentService.listByCredit(creditId, req.userId!);
      res.json(payments);
    } catch (error) {
      next(error);
    }
  },

  list: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payments = await paymentService.list(req.userId!);
      res.json(payments);
    } catch (error) {
      next(error);
    }
  },
};
