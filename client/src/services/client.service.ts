import api from './api';
import { Client } from '../types';

export const clientService = {
  list: () => api.get<Client[]>('/clients'),
  getById: (id: string) => api.get<Client>(`/clients/${id}`),
  create: (data: Partial<Client>) => api.post<Client>('/clients', data),
  update: (id: string, data: Partial<Client>) => api.put<Client>(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
};
