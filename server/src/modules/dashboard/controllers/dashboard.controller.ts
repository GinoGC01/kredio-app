import { Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service.js';
import { AuthenticatedRequest } from '../../../shared/middlewares/auth.middleware.js';
import { DateRangeFilter } from '../types/dashboard.types.js';

export const dashboardController = {
  getDashboard: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filter: DateRangeFilter = {};
      if (req.query.period) filter.period = req.query.period as DateRangeFilter['period'];
      if (req.query.from) filter.from = req.query.from as string;
      if (req.query.to) filter.to = req.query.to as string;

      const dashboard = await dashboardService.getDashboard(req.userId!, filter);
      res.json(dashboard);
    } catch (error) {
      next(error);
    }
  },
};
