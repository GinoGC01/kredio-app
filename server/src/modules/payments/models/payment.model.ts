import { prisma } from '../../../config/database.js';
import { Prisma, PaymentMethod, Currency } from '@prisma/client';

interface FindManyParams {
  userId: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  currency?: string;
  creditId?: string;
  method?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  includeVoided?: boolean;
}

export const paymentModel = {
  create: (data: {
    amount: number;
    originalAmount: number;
    interestAmount: number;
    moraAmount: number;
    previousBalance: number;
    installmentNumber: number;
    method: string;
    creditId: string;
    userId: string;
    note?: string;
    date?: Date;
  }) => {
    return prisma.payment.create({
      data: {
        amount: data.amount,
        originalAmount: data.originalAmount,
        interestAmount: data.interestAmount,
        moraAmount: data.moraAmount,
        previousBalance: data.previousBalance,
        installmentNumber: data.installmentNumber,
        method: data.method as PaymentMethod,
        creditId: data.creditId,
        userId: data.userId,
        note: data.note,
        date: data.date ?? new Date(),
      },
      include: {
        credit: {
          select: {
            id: true,
            amount: true,
            totalAmount: true,
            balance: true,
            currency: true,
            installments: true,
            dueDate: true,
            client: { select: { id: true, name: true } },
          },
        },
      },
    });
  },

  findById: (id: string, userId: string) => {
    return prisma.payment.findFirst({
      where: { id, userId },
      include: {
        credit: {
          select: {
            id: true,
            amount: true,
            totalAmount: true,
            balance: true,
            currency: true,
            installments: true,
            frequency: true,
            dueDate: true,
            description: true,
            status: true,
            client: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    });
  },

  countByCredit: (creditId: string) => {
    return prisma.payment.count({
      where: { creditId, isVoided: false },
    });
  },

  findByCredit: (creditId: string) => {
    return prisma.payment.findMany({
      where: { creditId, isVoided: false },
      orderBy: { date: 'desc' },
    });
  },

  findByClient: (clientId: string, userId: string, limit = 5) => {
    return prisma.payment.findMany({
      where: {
        userId,
        isVoided: false,
        credit: { clientId },
      },
      include: {
        credit: {
          select: {
            id: true,
            currency: true,
            description: true,
            installments: true,
            client: { select: { name: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
      take: limit,
    });
  },

  findMany: async (params: FindManyParams) => {
    const { userId, dateFrom, dateTo, search, currency, creditId, method, sortBy, sortOrder, page, limit, includeVoided } = params;

    const where: Prisma.PaymentWhereInput = {
      userId,
      ...(!includeVoided ? { isVoided: false } : {}),
      date: {
        ...(dateFrom ? { gte: dateFrom } : {}),
        ...(dateTo ? { lte: dateTo } : {}),
      },
      ...(creditId ? { creditId } : {}),
      ...(method ? { method: method as PaymentMethod } : {}),
    };

    const creditWhere: Prisma.CreditWhereInput = {};
    if (search) {
      creditWhere.client = { name: { contains: search, mode: 'insensitive' } };
    }
    if (currency) {
      creditWhere.currency = currency as Currency;
    }
    if (Object.keys(creditWhere).length > 0) {
      where.credit = creditWhere;
    }

    const orderBy: Prisma.PaymentOrderByWithRelationInput[] = [];
    if (sortBy === 'amount') {
      orderBy.push({ amount: sortOrder || 'desc' });
    } else if (sortBy === 'client') {
      orderBy.push({ credit: { client: { name: sortOrder || 'asc' } } });
    } else if (sortBy === 'status') {
      orderBy.push({ date: sortOrder || 'desc' });
    } else {
      orderBy.push({ date: sortOrder || 'desc' });
    }

    const total = await prisma.payment.count({ where });

    const data = await prisma.payment.findMany({
      where,
      include: {
        credit: {
          select: {
            id: true,
            amount: true,
            totalAmount: true,
            balance: true,
            currency: true,
            installments: true,
            frequency: true,
            dueDate: true,
            description: true,
            status: true,
            client: { select: { id: true, name: true } },
          },
        },
      },
      orderBy,
      ...(page && limit ? { skip: (page - 1) * limit, take: limit } : {}),
    });

    return { data, total, page: page || 1, limit: limit || total || 1 };
  },

  findStats: async (params: {
    userId: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) => {
    const { userId, dateFrom, dateTo } = params;

    const where: Prisma.PaymentWhereInput = {
      userId,
      isVoided: false,
      date: {
        ...(dateFrom ? { gte: dateFrom } : {}),
        ...(dateTo ? { lte: dateTo } : {}),
      },
    };

    const payments = await prisma.payment.findMany({
      where,
      include: {
        credit: { select: { currency: true, clientId: true } },
      },
    });

    const totalArs = payments
      .filter((p) => p.credit.currency === 'ARS')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalUsd = payments
      .filter((p) => p.credit.currency === 'USD')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const clientIds = new Set(
      payments.map((p) => p.credit.clientId).filter(Boolean),
    );

    // Count overdue credits for this user
    const overdueCount = await prisma.credit.count({
      where: {
        userId,
        status: 'OVERDUE',
      },
    });

    return {
      totalArs: Math.round(totalArs * 100) / 100,
      totalUsd: Math.round(totalUsd * 100) / 100,
      paymentCount: payments.length,
      clientCount: clientIds.size,
      overdueCount,
    };
  },

  update: (id: string, data: { note?: string; method?: string }) => {
    const updateData: Prisma.PaymentUpdateInput = {};
    if (data.note !== undefined) updateData.note = data.note;
    if (data.method !== undefined) updateData.method = data.method as PaymentMethod;

    return prisma.payment.update({
      where: { id },
      data: updateData,
      include: {
        credit: {
          select: {
            id: true,
            currency: true,
            client: { select: { id: true, name: true } },
          },
        },
      },
    });
  },

  softDelete: (id: string) => {
    return prisma.payment.update({
      where: { id },
      data: { isVoided: true, voidedAt: new Date() },
    });
  },
};
