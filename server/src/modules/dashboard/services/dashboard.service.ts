import { dashboardModel } from '../models/dashboard.model.js';
import { DashboardResponse, DateRangeFilter } from '../types/dashboard.types.js';
import { calculateDateRange } from '../../../shared/types/date-filter.js';
import { creditService } from '../../credits/services/credit.service.js';

function calculateNextDueDate(firstDueDate: Date, paidCount: number, frequency: string): Date {
  const due = new Date(firstDueDate);
  if (frequency === 'WEEKLY') due.setDate(due.getDate() + paidCount * 7);
  else if (frequency === 'BIWEEKLY') due.setDate(due.getDate() + paidCount * 14);
  else if (frequency === 'MONTHLY') due.setMonth(due.getMonth() + paidCount);
  return due;
}

function calculateInstallmentDueDate(firstDueDate: Date, installmentNumber: number, frequency: string): Date {
  return calculateNextDueDate(firstDueDate, installmentNumber - 1, frequency);
}

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

    // Previous period for variation
    let prevFromDate: Date | undefined;
    let prevToDate: Date | undefined;
    if (fromDate && filter?.period) {
      const duration = getPeriodDurationMs(filter.period);
      if (duration > 0) {
        prevFromDate = new Date(fromDate.getTime() - duration);
        prevToDate = new Date(fromDate);
      }
    }

    const credits = await dashboardModel.getCreditStats(userId, fromDate, toDate);
    const recentPaymentsRaw = await dashboardModel.getRecentPayments(userId, 10, fromDate, toDate);
    const activeCreditsAll = await dashboardModel.getAllActiveCredits(userId);
    const paymentsWithCurrency = await dashboardModel.getPaymentsWithCurrency(userId, fromDate, toDate);
    const overdueCreditsRaw = await dashboardModel.getOverdueClients(userId);
    const monthlyPaymentsRaw = await dashboardModel.getMonthlyCollection(userId, fromDate, toDate);

    // Previous period payments for variation
    let prevPaymentsWithCurrency: Array<{ amount: number; credit: { currency: string } }> = [];
    if (prevFromDate) {
      const prevPayments = await dashboardModel.getPaymentsWithCurrency(userId, prevFromDate, prevToDate);
      prevPaymentsWithCurrency = prevPayments.map((p) => ({
        amount: Number(p.amount),
        credit: { currency: p.credit.currency },
      }));
    }

    const activeCredits = credits.filter((c) => c.status === 'ACTIVE').length;
    const overdueCredits = credits.filter((c) => c.status === 'OVERDUE').length;

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

    const previousPeriodCollectedArs = prevPaymentsWithCurrency
      .filter((p) => p.credit.currency === 'ARS')
      .reduce((sum, p) => sum + p.amount, 0);
    const previousPeriodCollectedUsd = prevPaymentsWithCurrency
      .filter((p) => p.credit.currency === 'USD')
      .reduce((sum, p) => sum + p.amount, 0);

    // Collection rate: collected / (collected + pending) * 100
    const collectionRateArs = (collectedAmountArs + pendingAmountArs) > 0
      ? Math.round((collectedAmountArs / (collectedAmountArs + pendingAmountArs)) * 100)
      : 0;
    const collectionRateUsd = (collectedAmountUsd + pendingAmountUsd) > 0
      ? Math.round((collectedAmountUsd / (collectedAmountUsd + pendingAmountUsd)) * 100)
      : 0;

    // Overdue clients - compute days late from next installment due date
    const now = new Date();
    const overdueClients = overdueCreditsRaw.map((c) => {
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
    });
    overdueClients.sort((a, b) => b.daysLate - a.daysLate);

    const overdueClientIds = new Set(overdueClients.map((c) => c.clientId));
    const overdueClientsCount = overdueClientIds.size;

    // Monthly collection — count of transactions, not amounts
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
      .map(([month, counts]) => ({
        month,
        countArs: counts.countArs,
        countUsd: counts.countUsd,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Upcoming due dates - compute in-memory to avoid the bug of filtering by raw dueDate
    const nowMs = now.getTime();
    const upcomingDueFiltered = activeCreditsAll
      .map((c) => {
        const paidCount = c._count.payments;
        const nextInstallmentNumber = paidCount + 1;
        const nextDue = calculateNextDueDate(c.dueDate, paidCount, c.frequency);
        return { ...c, nextDue, nextInstallmentNumber };
      })
      .filter((c) => {
        if (c.status !== 'ACTIVE') return false;
        if (fromDate && c.nextDue < fromDate) return false;
        if (toDate && c.nextDue > toDate) return false;
        return true;
      })
      .sort((a, b) => a.nextDue.getTime() - b.nextDue.getTime())
      .slice(0, 5);

    // Recent payments with early/late flag
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
      previousPeriodCollectedArs,
      previousPeriodCollectedUsd,
      collectionRateArs,
      collectionRateUsd,
      overdueClientsCount,
      overdueClients,
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
