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
  recentPayments: Array<{
    id: string;
    amount: number;
    date: Date;
    clientName: string;
    currency: string;
  }>;
  upcomingDueDates: Array<{
    id: string;
    clientName: string;
    amount: number;
    dueDate: Date;
    balance: number;
    currency: string;
  }>;
}
