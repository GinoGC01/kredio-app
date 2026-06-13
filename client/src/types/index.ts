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
  credits?: Credit[];
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
  createdAt: string;
  clientId: string;
  client?: { id: string; name: string };
  payments?: Payment[];
}

export interface Payment {
  id: string;
  amount: number;
  date: string;
  note: string | null;
  createdAt: string;
  creditId: string;
  credit?: {
    id: string;
    amount: number;
    currency: string;
    client: { name: string };
  };
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
  recentPayments: Array<{
    id: string;
    amount: number;
    date: string;
    clientName: string;
    currency: string;
  }>;
  upcomingDueDates: Array<{
    id: string;
    clientName: string;
    amount: number;
    dueDate: string;
    balance: number;
    currency: string;
  }>;
}

export interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}
