import { prisma } from '../../../config/database.js';
import { Prisma } from '@prisma/client';

export const activityModel = {
  create: (data: {
    action: string;
    entity: string;
    entityId: string;
    details?: Prisma.InputJsonValue;
    userId: string;
  }) => {
    return prisma.activityLog.create({ data });
  },

  findMany: (userId: string, limit = 20) => {
    return prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },
};
