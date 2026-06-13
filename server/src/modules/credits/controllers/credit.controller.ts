import { Response, NextFunction } from 'express';
import { creditService } from '../services/credit.service.js';
import { createCreditSchema } from '../validators/credit.validator.js';
import { AuthenticatedRequest } from '../../../shared/middlewares/auth.middleware.js';
import { DateRangeFilter } from '../../../shared/types/date-filter.js';

export const creditController = {
  create: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = createCreditSchema.parse(req.body);
      const credit = await creditService.create(data, req.userId!);
      res.status(201).json(credit);
    } catch (error) {
      next(error);
    }
  },

  getById: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const credit = await creditService.getById(id, req.userId!);
      res.json(credit);
    } catch (error) {
      next(error);
    }
  },

  listByClient: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientId = req.params.clientId as string;
      const credits = await creditService.listByClient(clientId, req.userId!);
      res.json(credits);
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

      const credits = await creditService.list(req.userId!, filter);
      res.json(credits);
    } catch (error) {
      next(error);
    }
  },
};
