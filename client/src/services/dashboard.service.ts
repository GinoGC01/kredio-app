import api from './api';
import { Dashboard } from '../types';

export const dashboardService = {
  get: () => api.get<Dashboard>('/dashboard'),
};
