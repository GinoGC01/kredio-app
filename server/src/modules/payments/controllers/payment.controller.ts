import { Response, NextFunction } from 'express';
import { paymentService } from '../services/payment.service.js';
import { registerPaymentSchema } from '../validators/payment.validator.js';
import { AuthenticatedRequest } from '../../../shared/middlewares/auth.middleware.js';
import { DateRangeFilter } from '../../../shared/types/date-filter.js';

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
      const filter: DateRangeFilter = {};
      if (req.query.period) filter.period = req.query.period as DateRangeFilter['period'];
      if (req.query.from) filter.from = req.query.from as string;
      if (req.query.to) filter.to = req.query.to as string;

      const payments = await paymentService.list(req.userId!, filter);
      res.json(payments);
    } catch (error) {
      next(error);
    }
  },
};
