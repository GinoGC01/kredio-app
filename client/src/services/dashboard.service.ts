import api from './api';
import { Dashboard, DateFilter } from '../types';

export const dashboardService = {
  get: (filter?: DateFilter) =>
    api.get<Dashboard>('/dashboard', { params: filter }),
};
