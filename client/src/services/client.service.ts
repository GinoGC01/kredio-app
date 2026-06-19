import api from './api';
import { Client, RecentPayment } from '../types';

export const clientService = {
  list: () => api.get<Client[]>('/clients'),
  getById: (id: string) => api.get<Client>(`/clients/${id}`),
  getRecentPayments: (id: string, limit = 5) => api.get<RecentPayment[]>(`/clients/${id}/recent-payments?limit=${limit}`),
  create: (data: Partial<Client>) => api.post<Client>('/clients', data),
  update: (id: string, data: Partial<Client>) => api.put<Client>(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
};
