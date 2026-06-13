import api from './api';
import { Payment } from '../types';

export const paymentService = {
  list: () => api.get<Payment[]>('/payments'),
  register: (data: { creditId: string; amount: number; note?: string; date?: string }) =>
    api.post<Payment>('/payments', data),
  listByCredit: (creditId: string) => api.get<Payment[]>(`/payments/credit/${creditId}`),
};
