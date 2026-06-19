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
        client: { select: { id: true, name: true } },
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

  getAllActiveCredits: (userId: string) => {
    return prisma.credit.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        _count: { select: { payments: true } },
        client: { select: { name: true } },
      },
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

  getOverdueClients: (userId: string) => {
    return prisma.credit.findMany({
      where: { userId, status: 'OVERDUE' },
      select: {
        id: true,
        balance: true,
        currency: true,
        dueDate: true,
        installments: true,
        frequency: true,
        _count: { select: { payments: true } },
        client: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  },

  getMonthlyCollection: (userId: string, dateFrom?: Date, dateTo?: Date) => {
    return prisma.payment.findMany({
      where: {
        userId,
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
