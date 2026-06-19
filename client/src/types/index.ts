export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  user: User;
}

export interface Client {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  activeCredits?: number;
  totalDebt?: number;
  totalBorrowed?: number;
  totalCollected?: number;
  debtArs?: number;
  debtUsd?: number;
  clientSince?: string;
  credits?: Credit[];
}

export interface RecentPayment {
  id: string;
  amount: number;
  date: string;
  currency: string;
  creditId: string;
  creditDescription: string | null;
  installmentNumber: number | null;
  method: string;
}

export interface Credit {
  id: string;
  amount: number;
  interestRate: number;
  totalAmount: number;
  balance: number;
  installments: number;
  frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  currency: 'ARS' | 'USD';
  description: string | null;
  status: 'ACTIVE' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'ARCHIVED';
  dueDate: string;
  moraType?: 'PERCENTAGE' | 'FIXED_AMOUNT' | null;
  moraPeriod?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | null;
  moraRate?: number | null;
  createdAt: string;
  clientId: string;
  client?: { id: string; name: string };
  payments?: Payment[];
  _count?: { payments: number };
}

export type PaymentMethod = 'CASH' | 'TRANSFER' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'OTHER' | 'BIEN';

export interface Payment {
  id: string;
  amount: number;
  originalAmount: number;
  interestAmount: number;
  moraAmount: number;
  previousBalance: number;
  installmentNumber: number | null;
  method: PaymentMethod;
  date: string;
  note: string | null;
  isVoided: boolean;
  voidedAt: string | null;
  createdAt: string;
  creditId: string;
  credit?: {
    id: string;
    amount: number;
    totalAmount: number;
    balance: number;
    currency: string;
    installments: number;
    frequency: string;
    dueDate: string;
    description: string | null;
    status: string;
    client: { id: string; name: string };
  };
}

export interface OverdueInstallment {
  number: number;
  daysLate: number;
  moraAmount: number;
  totalWithMora: number;
  dueDate: string;
}

export interface CurrentInstallment {
  number: number;
  totalInstallments: number;
  originalAmount: number;
  interestAmount: number;
  installmentAmount: number;
  daysLate: number;
  moraAmount: number;
  totalWithMora: number;
  dueDate: string;
}

export interface PaymentBreakdown {
  currentInstallment: CurrentInstallment | null;
  overdueInstallments: OverdueInstallment[];
  totalOverdueMora: number;
}

export interface PaymentStats {
  totalArs: number;
  totalUsd: number;
  paymentCount: number;
  clientCount: number;
  overdueCount: number;
}

export interface PaymentListResponse {
  data: Payment[];
  total: number;
  page: number;
  limit: number;
}

export interface PaymentFilter {
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

export interface Dashboard {
  activeCredits: number;
  overdueCredits: number;
  totalPortfolio: number;
  totalPortfolioArs: number;
  totalPortfolioUsd: number;
  collectedAmount: number;
  collectedAmountArs: number;
  collectedAmountUsd: number;
  pendingAmount: number;
  pendingAmountArs: number;
  pendingAmountUsd: number;
  previousPeriodCollectedArs: number;
  previousPeriodCollectedUsd: number;
  collectionRateArs: number;
  collectionRateUsd: number;
  overdueClientsCount: number;
  overdueClients: Array<{
    creditId: string;
    clientId: string;
    clientName: string;
    daysLate: number;
    overdueAmount: number;
    currency: string;
  }>;
  monthlyCollection: Array<{
    month: string;
    countArs: number;
    countUsd: number;
  }>;
  recentPayments: Array<{
    id: string;
    amount: number;
    date: string;
    clientName: string;
    creditDescription: string;
    creditId: string;
    currency: string;
    installmentNumber: number | null;
    totalInstallments: number;
    isEarlyPayment: boolean;
  }>;
  upcomingDueDates: Array<{
    id: string;
    clientName: string;
    creditDescription: string;
    amount: number;
    dueDate: string;
    balance: number;
    currency: string;
    installmentNumber: number;
    totalInstallments: number;
  }>;
}

export type Period = 'last_week' | 'last_month' | 'last_3_months' | 'last_6_months' | 'last_year' | 'all';

export interface DateFilter {
  period?: Period;
  from?: string;
  to?: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}
