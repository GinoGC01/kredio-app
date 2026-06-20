import { prisma } from '../../../config/database.js';
import { CreditStatus, PaymentFrequency } from '@prisma/client';

export const creditModel = {
  create: (data: {
    amount: number;
    interestRate: number;
    totalAmount: number;
    balance: number;
    installments: number;
    frequency: PaymentFrequency;
    currency?: 'ARS' | 'USD';
    description: string | undefined;
    dueDate: Date;
    status: CreditStatus;
    clientId: string;
    userId: string;
    moraType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
    moraPeriod?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    moraRate?: number;
  }) => {
    return prisma.credit.create({ data });
  },

  findById: (id: string, userId: string) => {
    return prisma.credit.findFirst({
      where: { id, userId },
      include: {
        client: { select: { id: true, name: true } },
        payments: { orderBy: { date: 'desc' } },
      },
    });
  },

  findManyByClient: (clientId: string, userId: string) => {
    return prisma.credit.findMany({
      where: { clientId, userId },
      include: { payments: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  findMany: (userId: string, dateFrom?: Date, dateTo?: Date) => {
    return prisma.credit.findMany({
      where: {
        userId,
        dueDate: {
          ...(dateFrom ? { gte: dateFrom } : {}),
          ...(dateTo ? { lte: dateTo } : {}),
        },
      },
      include: {
        client: { select: { id: true, name: true } },
        _count: { select: { payments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  updateStatus: (id: string, status: CreditStatus) => {
    return prisma.credit.update({
      where: { id },
      data: { status },
    });
  },

  updateBalance: (id: string, balance: number) => {
    return prisma.credit.update({
      where: { id },
      data: { balance },
    });
  },

  findAllActiveOrOverdue: (userId: string) => {
    return prisma.credit.findMany({
      where: { userId, status: { in: ['ACTIVE', 'OVERDUE'] } },
      include: { _count: { select: { payments: true } } },
    });
  },
};
