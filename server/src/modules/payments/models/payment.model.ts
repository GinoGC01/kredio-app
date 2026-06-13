import { prisma } from '../../../config/database.js';

export const paymentModel = {
  create: (data: {
    amount: number;
    creditId: string;
    userId: string;
    note?: string;
    date?: Date;
  }) => {
    return prisma.payment.create({ data });
  },

  findByCredit: (creditId: string) => {
    return prisma.payment.findMany({
      where: { creditId },
      orderBy: { date: 'desc' },
    });
  },

  findMany: (userId: string) => {
    return prisma.payment.findMany({
      where: { userId },
      include: {
        credit: {
          select: {
            id: true,
            amount: true,
            currency: true,
            client: { select: { name: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  },
};
