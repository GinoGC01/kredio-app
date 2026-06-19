import api from './api';
import { Payment, Credit, PaymentFilter, PaymentStats, PaymentListResponse, PaymentBreakdown } from '../types';

export const paymentService = {
  list: (filter?: PaymentFilter) =>
    api.get<PaymentListResponse>('/payments', { params: filter }),

  getById: (id: string) =>
    api.get<Payment>(`/payments/${id}`),

  getStats: (filter?: PaymentFilter) =>
    api.get<PaymentStats>('/payments/stats', { params: filter }),

  register: (data: {
    creditId: string;
    amount: number;
    originalAmount: number;
    interestAmount: number;
    moraAmount: number;
    note?: string;
    date?: string;
    method?: string;
  }) => api.post<{ payment: Payment; credit: Credit }>('/payments', data),

  update: (id: string, data: { note?: string; method?: string }) =>
    api.patch<Payment>(`/payments/${id}`, data),

  remove: (id: string) =>
    api.delete<{ message: string; payment: Payment }>(`/payments/${id}`),

  listByCredit: (creditId: string) =>
    api.get<Payment[]>(`/payments/credit/${creditId}`),

  calculateBreakdown: (creditId: string) =>
    api.get<PaymentBreakdown>(`/payments/breakdown/${creditId}`),
};
