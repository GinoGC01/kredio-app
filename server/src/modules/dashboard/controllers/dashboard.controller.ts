import { Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service.js';
import { AuthenticatedRequest } from '../../../shared/middlewares/auth.middleware.js';

export const dashboardController = {
  getDashboard: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dashboard = await dashboardService.getDashboard(req.userId!);
      res.json(dashboard);
    } catch (error) {
      next(error);
    }
  },
};
