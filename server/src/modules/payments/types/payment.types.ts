import { Period } from '../../../shared/types/date-filter.js';

export interface RegisterPaymentDto {
  creditId: string;
  amount: number;
  originalAmount: number;
  interestAmount: number;
  moraAmount: number;
  date?: string;
  note?: string;
  method?: string;
}

export interface UpdatePaymentDto {
  note?: string;
  method?: string;
}

export interface PaymentFilterDto {
  period?: Period;
  from?: string;
  to?: string;
  search?: string;
  currency?: string;
  creditId?: string;
  method?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaymentStatsDto {
  period?: Period;
  from?: string;
  to?: string;
  currency?: string;
}
