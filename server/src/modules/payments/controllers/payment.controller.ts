import { Response, NextFunction } from 'express';
import { paymentService } from '../services/payment.service.js';
import { registerPaymentSchema, updatePaymentSchema } from '../validators/payment.validator.js';
import { AuthenticatedRequest } from '../../../shared/middlewares/auth.middleware.js';
import { PaymentFilterDto } from '../types/payment.types.js';
import { Period } from '../../../shared/types/date-filter.js';

export const paymentController = {
  register: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = registerPaymentSchema.parse(req.body);
      const result = await paymentService.register(data, req.userId!);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  calculateBreakdown: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const creditId = req.params.creditId as string;
      const breakdown = await paymentService.calculateBreakdown(creditId, req.userId!);
      res.json(breakdown);
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
      const filter: PaymentFilterDto = {};
      if (req.query.period) filter.period = req.query.period as Period;
      if (req.query.from) filter.from = req.query.from as string;
      if (req.query.to) filter.to = req.query.to as string;
      if (req.query.search) filter.search = req.query.search as string;
      if (req.query.currency) filter.currency = req.query.currency as string;
      if (req.query.creditId) filter.creditId = req.query.creditId as string;
      if (req.query.method) filter.method = req.query.method as string;
      if (req.query.status) filter.status = req.query.status as string;
      if (req.query.sortBy) filter.sortBy = req.query.sortBy as string;
      if (req.query.sortOrder) filter.sortOrder = req.query.sortOrder as 'asc' | 'desc';
      if (req.query.page) filter.page = parseInt(req.query.page as string, 10);
      if (req.query.limit) filter.limit = parseInt(req.query.limit as string, 10);

      const result = await paymentService.list(req.userId!, filter);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  getById: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const payment = await paymentService.getById(id, req.userId!);
      res.json(payment);
    } catch (error) {
      next(error);
    }
  },

  getStats: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filter: PaymentFilterDto = {};
      if (req.query.period) filter.period = req.query.period as Period;
      if (req.query.from) filter.from = req.query.from as string;
      if (req.query.to) filter.to = req.query.to as string;

      const stats = await paymentService.getStats(req.userId!, filter);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  },

  update: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const data = updatePaymentSchema.parse(req.body);
      const updated = await paymentService.update(id, data, req.userId!);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  },

  softDelete: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await paymentService.softDelete(id, req.userId!);
      res.json({ message: 'Payment voided successfully', payment: result });
    } catch (error) {
      next(error);
    }
  },
};
