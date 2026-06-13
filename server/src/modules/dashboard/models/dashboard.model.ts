import { prisma } from '../../../config/database.js';

export const dashboardModel = {
  getCreditStats: (userId: string) => {
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
        client: { select: { name: true } },
      },
    });
  },

  getRecentPayments: (userId: string, limit = 5) => {
    return prisma.payment.findMany({
      where: { userId },
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

  getUpcomingDueDates: (userId: string, limit = 5) => {
    return prisma.credit.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        dueDate: { gte: new Date() },
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

  getPaymentsWithCurrency: (userId: string) => {
    return prisma.payment.findMany({
      where: { userId },
      include: {
        credit: {
          select: { currency: true },
        },
      },
    });
  },
};
