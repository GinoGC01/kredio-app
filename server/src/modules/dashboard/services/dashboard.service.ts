import { dashboardModel } from '../models/dashboard.model.js';
import { DashboardResponse, DateRangeFilter } from '../types/dashboard.types.js';
import { calculateDateRange } from '../../../shared/types/date-filter.js';
import { creditService } from '../../credits/services/credit.service.js';
import { calculateNextDueDate, calculateInstallmentDueDate } from '../../../shared/utils/date-utils.js';

function getPeriodDurationMs(period: string): number {
  switch (period) {
    case 'last_week': return 7 * 24 * 60 * 60 * 1000;
    case 'last_month': return 30 * 24 * 60 * 60 * 1000;
    case 'last_3_months': return 90 * 24 * 60 * 60 * 1000;
    case 'last_6_months': return 180 * 24 * 60 * 60 * 1000;
    case 'last_year': return 365 * 24 * 60 * 60 * 1000;
    default: return 0;
  }
}

export const dashboardService = {
  getDashboard: async (userId: string, filter?: DateRangeFilter): Promise<DashboardResponse> => {
    await creditService.updateOverdueStatuses(userId);

    const { fromDate, toDate } = calculateDateRange(filter ?? {});

    let prevFromDate: Date | undefined;
    let prevToDate: Date | undefined;
    if (fromDate && filter?.period) {
      const duration = getPeriodDurationMs(filter.period);
      if (duration > 0) {
        prevFromDate = new Date(fromDate.getTime() - duration);
        prevToDate = new Date(fromDate);
      }
    }

    // Single query for ALL credits (no date filter — portfolio is always full)
    const allCredits = await dashboardModel.getAllCreditsWithInfo(userId);

    // Gather payments data (these DO respect the date filter)
    const [recentPaymentsRaw, paymentsWithCurrency, monthlyPaymentsRaw] = await Promise.all([
      dashboardModel.getRecentPayments(userId, 10, fromDate, toDate),
      dashboardModel.getPaymentsWithCurrency(userId, fromDate, toDate),
      dashboardModel.getMonthlyCollection(userId, fromDate, toDate),
    ]);

    let prevPaymentsWithCurrency: Array<{ amount: number; credit: { currency: string } }> = [];
    if (prevFromDate) {
      const prevPayments = await dashboardModel.getPaymentsWithCurrency(userId, prevFromDate, prevToDate);
      prevPaymentsWithCurrency = prevPayments.map((p) => ({
        amount: Number(p.amount),
        credit: { currency: p.credit.currency },
      }));
    }

    // Portfolio stats from ALL credits (no date filter)
    const activeCreditsCount = allCredits.filter((c) => c.status === 'ACTIVE').length;
    const overdueCreditsCount = allCredits.filter((c) => c.status === 'OVERDUE').length;

    const totalPortfolioArs = allCredits
      .filter((c) => c.currency === 'ARS')
      .reduce((sum, c) => sum + Number(c.totalAmount), 0);
    const totalPortfolioUsd = allCredits
      .filter((c) => c.currency === 'USD')
      .reduce((sum, c) => sum + Number(c.totalAmount), 0);
    const totalPortfolio = totalPortfolioArs + totalPortfolioUsd;

    const pendingAmountArs = allCredits
      .filter((c) => c.currency === 'ARS')
      .reduce((sum, c) => sum + Number(c.balance), 0);
    const pendingAmountUsd = allCredits
      .filter((c) => c.currency === 'USD')
      .reduce((sum, c) => sum + Number(c.balance), 0);
    const pendingAmount = pendingAmountArs + pendingAmountUsd;

    // Collection stats from date-filtered payments
    const collectedAmountArs = paymentsWithCurrency
      .filter((p) => p.credit.currency === 'ARS')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const collectedAmountUsd = paymentsWithCurrency
      .filter((p) => p.credit.currency === 'USD')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const collectedAmount = collectedAmountArs + collectedAmountUsd;

    const previousPeriodCollectedArs = prevPaymentsWithCurrency
      .filter((p) => p.credit.currency === 'ARS')
      .reduce((sum, p) => sum + p.amount, 0);
    const previousPeriodCollectedUsd = prevPaymentsWithCurrency
      .filter((p) => p.credit.currency === 'USD')
      .reduce((sum, p) => sum + p.amount, 0);

    const collectionRateArs = (collectedAmountArs + pendingAmountArs) > 0
      ? Math.round((collectedAmountArs / (collectedAmountArs + pendingAmountArs)) * 100)
      : 0;
    const collectionRateUsd = (collectedAmountUsd + pendingAmountUsd) > 0
      ? Math.round((collectedAmountUsd / (collectedAmountUsd + pendingAmountUsd)) * 100)
      : 0;

    // Overdue clients from the unified credit list
    const now = new Date();
    const overdueCredits = allCredits
      .filter((c) => c.status === 'OVERDUE')
      .map((c) => {
        const paidCount = c._count.payments;
        const nextInstallmentNumber = paidCount + 1;
        const nextDue = calculateInstallmentDueDate(c.dueDate, nextInstallmentNumber, c.frequency);
        const daysLate = Math.max(0, Math.floor((now.getTime() - nextDue.getTime()) / (1000 * 60 * 60 * 24)));
        return {
          creditId: c.id,
          clientId: c.client.id,
          clientName: c.client.name,
          daysLate,
          overdueAmount: Number(c.balance),
          currency: c.currency,
        };
      })
      .sort((a, b) => b.daysLate - a.daysLate);

    const overdueClientIds = new Set(overdueCredits.map((c) => c.clientId));
    const overdueClientsCount = overdueClientIds.size;

    // Monthly collection — count of transactions
    const monthCountMap = new Map<string, { countArs: number; countUsd: number }>();
    for (const p of monthlyPaymentsRaw) {
      const d = new Date(p.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const entry = monthCountMap.get(key) ?? { countArs: 0, countUsd: 0 };
      if (p.credit.currency === 'USD') entry.countUsd++;
      else entry.countArs++;
      monthCountMap.set(key, entry);
    }
    const monthlyCollection = Array.from(monthCountMap.entries())
      .map(([month, counts]) => ({ month, countArs: counts.countArs, countUsd: counts.countUsd }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Upcoming due dates from same unified list
    const upcomingDueFiltered = allCredits
      .filter((c) => c.status === 'ACTIVE')
      .map((c) => {
        const paidCount = c._count.payments;
        const nextDue = calculateNextDueDate(c.dueDate, paidCount, c.frequency);
        return { ...c, nextDue, nextInstallmentNumber: paidCount + 1 };
      })
      .filter((c) => {
        if (fromDate && c.nextDue < fromDate) return false;
        if (toDate && c.nextDue > toDate) return false;
        return true;
      })
      .sort((a, b) => a.nextDue.getTime() - b.nextDue.getTime())
      .slice(0, 5);

    const recentPayments = recentPaymentsRaw.map((p) => {
      const installmentDue = p.credit.dueDate && p.installmentNumber
        ? calculateInstallmentDueDate(p.credit.dueDate, p.installmentNumber, p.credit.frequency)
        : null;
      const isEarlyPayment = installmentDue ? p.date <= installmentDue : false;
      return {
        id: p.id,
        amount: Number(p.amount),
        date: p.date,
        clientName: p.credit.client.name,
        creditDescription: p.credit.description ?? '',
        creditId: p.creditId,
        currency: p.credit.currency,
        installmentNumber: p.installmentNumber,
        totalInstallments: p.credit.installments,
        isEarlyPayment,
      };
    });

    return {
      activeCredits: activeCreditsCount,
      overdueCredits: overdueCreditsCount,
      totalPortfolio,
      totalPortfolioArs,
      totalPortfolioUsd,
      collectedAmount,
      collectedAmountArs,
      collectedAmountUsd,
      pendingAmount,
      pendingAmountArs,
      pendingAmountUsd,
      previousPeriodCollectedArs,
      previousPeriodCollectedUsd,
      collectionRateArs,
      collectionRateUsd,
      overdueClientsCount,
      overdueClients: overdueCredits,
      monthlyCollection,
      recentPayments,
      upcomingDueDates: upcomingDueFiltered.map((c) => ({
        id: c.id,
        clientName: c.client.name,
        creditDescription: c.description ?? '',
        amount: Number(c.amount),
        dueDate: c.nextDue,
        balance: Number(c.balance),
        currency: c.currency,
        installmentNumber: c.nextInstallmentNumber,
        totalInstallments: c.installments,
      })),
    };
  },
};
