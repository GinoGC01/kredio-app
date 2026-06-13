import { dashboardModel } from '../models/dashboard.model.js';
import { DashboardResponse } from '../types/dashboard.types.js';

export const dashboardService = {
  getDashboard: async (userId: string): Promise<DashboardResponse> => {
    const credits = await dashboardModel.getCreditStats(userId);
    const recentPayments = await dashboardModel.getRecentPayments(userId);
    const upcomingDue = await dashboardModel.getUpcomingDueDates(userId);
    const paymentsWithCurrency = await dashboardModel.getPaymentsWithCurrency(userId);

    const activeCredits = credits.filter((c) => c.status === 'ACTIVE').length;
    const overdueCredits = credits.filter(
      (c) => c.status === 'ACTIVE' && new Date(c.dueDate) < new Date(),
    ).length;

    const totalPortfolio = credits.reduce((sum, c) => sum + Number(c.totalAmount), 0);
    const totalPortfolioArs = credits
      .filter((c) => c.currency === 'ARS')
      .reduce((sum, c) => sum + Number(c.totalAmount), 0);
    const totalPortfolioUsd = credits
      .filter((c) => c.currency === 'USD')
      .reduce((sum, c) => sum + Number(c.totalAmount), 0);

    const pendingAmount = credits.reduce((sum, c) => sum + Number(c.balance), 0);
    const pendingAmountArs = credits
      .filter((c) => c.currency === 'ARS')
      .reduce((sum, c) => sum + Number(c.balance), 0);
    const pendingAmountUsd = credits
      .filter((c) => c.currency === 'USD')
      .reduce((sum, c) => sum + Number(c.balance), 0);

    const collectedAmount = paymentsWithCurrency.reduce((sum, p) => sum + Number(p.amount), 0);
    const collectedAmountArs = paymentsWithCurrency
      .filter((p) => p.credit.currency === 'ARS')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const collectedAmountUsd = paymentsWithCurrency
      .filter((p) => p.credit.currency === 'USD')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      activeCredits,
      overdueCredits,
      totalPortfolio,
      totalPortfolioArs,
      totalPortfolioUsd,
      collectedAmount,
      collectedAmountArs,
      collectedAmountUsd,
      pendingAmount,
      pendingAmountArs,
      pendingAmountUsd,
      recentPayments: recentPayments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        date: p.date,
        clientName: p.credit.client.name,
        currency: p.credit.currency,
      })),
      upcomingDueDates: upcomingDue.map((c) => ({
        id: c.id,
        clientName: c.client.name,
        amount: Number(c.amount),
        dueDate: c.dueDate,
        balance: Number(c.balance),
        currency: c.currency,
      })),
    };
  },
};
