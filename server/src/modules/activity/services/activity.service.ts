import { activityModel } from '../models/activity.model.js';
import { CreateActivityDto } from '../types/activity.types.js';

export const activityService = {
  log: async (data: CreateActivityDto, userId: string) => {
    return activityModel.create({ ...data, userId });
  },

  list: async (userId: string) => {
    return activityModel.findMany(userId);
  },
};
