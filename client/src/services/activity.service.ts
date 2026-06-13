import api from './api';
import { ActivityLog } from '../types';

export const activityService = {
  list: () => api.get<ActivityLog[]>('/activity'),
};
