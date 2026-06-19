import { DateRangeFilter } from '../../../shared/types/date-filter.js';

export type { DateRangeFilter };

export interface DashboardResponse {
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
    date: Date;
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
    dueDate: Date;
    balance: number;
    currency: string;
    installmentNumber: number;
    totalInstallments: number;
  }>;
}
