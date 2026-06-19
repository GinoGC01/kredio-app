import api from './api';
import { Credit, DateFilter } from '../types';

export const creditService = {
  list: (filter?: DateFilter) =>
    api.get<Credit[]>('/credits', { params: filter }),
  getById: (id: string) => api.get<Credit>(`/credits/${id}`),
  listByClient: (clientId: string) => api.get<Credit[]>(`/credits/client/${clientId}`),
  create: (data: {
    clientId: string;
    amount: number;
    interestRate: number;
    installments: number;
    frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
    currency?: 'ARS' | 'USD';
    description?: string;
    dueDate: string;
    moraType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
    moraPeriod?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    moraRate?: number;
  }) => api.post<Credit>('/credits', data),
  update: (id: string, data: {
    amount?: number;
    interestRate?: number;
    installments?: number;
    frequency?: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
    description?: string;
    dueDate?: string;
  }) => api.put<Credit>(`/credits/${id}`, data),
  archive: (id: string) => api.patch<Credit>(`/credits/${id}/archive`),
};
