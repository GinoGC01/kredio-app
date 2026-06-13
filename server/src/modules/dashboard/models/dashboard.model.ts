import { prisma } from '../../../config/database.js';

export const dashboardModel = {
  getCreditStats: (userId: string, dateFrom?: Date, dateTo?: Date) => {
    return prisma.credit.findMany({
      where: {
        userId,
        dueDate: {
          ...(dateFrom ? { gte: dateFrom } : {}),
          ...(dateTo ? { lte: dateTo } : {}),
        },
      },
      select: {
        id: true,
        amount: true,
        balance: true,
        status: true,
        dueDate: true,
        totalAmount: true,
        currency: true,
        client: { select: { name: true } },
      },
    });
  },

  getRecentPayments: (userId: string, limit = 5, dateFrom?: Date, dateTo?: Date) => {
    return prisma.payment.findMany({
      where: {
        userId,
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
          },
        },
      },
      orderBy: { date: 'desc' },
      take: limit,
    });
  },

  getUpcomingDueDates: (userId: string, limit = 5, dateFrom?: Date, dateTo?: Date) => {
    return prisma.credit.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        dueDate: {
          gte: dateFrom ?? new Date(),
          ...(dateTo ? { lte: dateTo } : {}),
        },
      },
      select: {
        id: true,
        amount: true,
        balance: true,
        dueDate: true,
        currency: true,
        client: { select: { name: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: limit,
    });
  },

  getPaymentsWithCurrency: (userId: string, dateFrom?: Date, dateTo?: Date) => {
    return prisma.payment.findMany({
      where: {
        userId,
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
};
