import { prisma } from '../../../config/database.js';

export const dashboardModel = {
  getAllCreditsWithInfo: (userId: string) => {
    return prisma.credit.findMany({
      where: { userId },
      select: {
        id: true,
        amount: true,
        balance: true,
        status: true,
        dueDate: true,
        totalAmount: true,
        currency: true,
        installments: true,
        frequency: true,
        description: true,
        _count: { select: { payments: true } },
        client: { select: { id: true, name: true } },
      },
    });
  },

  getRecentPayments: (userId: string, limit = 5, dateFrom?: Date, dateTo?: Date) => {
    return prisma.payment.findMany({
      where: {
        userId,
        isVoided: false,
        date: {
          ...(dateFrom ? { gte: dateFrom } : {}),
          ...(dateTo ? { lte: dateTo } : {}),
        },
      },
      include: {
        credit: {
          select: {
            client: { select: { name: true } },
            currency: true,
            description: true,
            installments: true,
            dueDate: true,
            frequency: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      take: limit,
    });
  },

  getPaymentsWithCurrency: (userId: string, dateFrom?: Date, dateTo?: Date) => {
    return prisma.payment.findMany({
      where: {
        userId,
        isVoided: false,
        date: {
          ...(dateFrom ? { gte: dateFrom } : {}),
          ...(dateTo ? { lte: dateTo } : {}),
        },
      },
      include: {
        credit: {
          select: { currency: true },
        },
      },
    });
  },

  getMonthlyCollection: (userId: string, dateFrom?: Date, dateTo?: Date) => {
    return prisma.payment.findMany({
      where: {
        userId,
        isVoided: false,
        date: {
          ...(dateFrom ? { gte: dateFrom } : {}),
          ...(dateTo ? { lte: dateTo } : {}),
        },
      },
      select: {
        date: true,
        amount: true,
        credit: { select: { currency: true } },
      },
      orderBy: { date: 'asc' },
    });
  },
};
