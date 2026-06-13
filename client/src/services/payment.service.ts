import api from './api';
import { Payment, DateFilter } from '../types';

export const paymentService = {
  list: (filter?: DateFilter) =>
    api.get<Payment[]>('/payments', { params: filter }),
  register: (data: { creditId: string; amount: number; note?: string; date?: string }) =>
    api.post<Payment>('/payments', data),
  listByCredit: (creditId: string) => api.get<Payment[]>(`/payments/credit/${creditId}`),
};
