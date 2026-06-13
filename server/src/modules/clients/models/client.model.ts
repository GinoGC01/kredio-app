import { prisma } from '../../../config/database.js';
import { CreateClientDto, UpdateClientDto } from '../types/client.types.js';

export const clientModel = {
  create: (data: CreateClientDto, userId: string) => {
    return prisma.client.create({
      data: { ...data, userId },
    });
  },

  findById: (id: string, userId: string) => {
    return prisma.client.findFirst({
      where: { id, userId },
      include: {
        credits: {
          include: { payments: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  },

  findMany: (userId: string) => {
    return prisma.client.findMany({
      where: { userId },
      include: {
        credits: {
          select: {
            id: true,
            amount: true,
            balance: true,
            status: true,
            dueDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  update: (id: string, userId: string, data: UpdateClientDto) => {
    return prisma.client.update({
      where: { id },
      data,
    });
  },

  delete: (id: string, userId: string) => {
    return prisma.client.delete({
      where: { id },
    });
  },
};
