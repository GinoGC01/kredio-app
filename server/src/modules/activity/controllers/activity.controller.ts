import { Response, NextFunction } from 'express';
import { activityService } from '../services/activity.service.js';
import { AuthenticatedRequest } from '../../../shared/middlewares/auth.middleware.js';

export const activityController = {
  list: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const activities = await activityService.list(req.userId!);
      res.json(activities);
    } catch (error) {
      next(error);
    }
  },
};
