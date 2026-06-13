import { prisma } from '../../../config/database.js';

export const authModel = {
  findByEmail: (email: string) => {
    return prisma.user.findUnique({ where: { email } });
  },

  findById: (id: string) => {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, lastActivityAt: true, createdAt: true },
    });
  },

  create: (data: { email: string; name: string; password: string }) => {
    return prisma.user.create({
      data,
      select: { id: true, email: true, name: true, createdAt: true },
    });
  },

  updateLastActivity: (id: string) => {
    return prisma.user.update({
      where: { id },
      data: { lastActivityAt: new Date() },
    });
  },
};
