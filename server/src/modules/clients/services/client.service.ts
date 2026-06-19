import { clientModel } from '../models/client.model.js';
import { CreateClientDto, UpdateClientDto, ClientResponse, RecentPaymentDto } from '../types/client.types.js';
import { paymentModel } from '../../payments/models/payment.model.js';
import { NotFoundError } from '../../../shared/errors/AppError.js';
import { activityService } from '../../activity/services/activity.service.js';

export const clientService = {
  create: async (data: CreateClientDto, userId: string): Promise<ClientResponse> => {
    const client = await clientModel.create(data, userId);

    await activityService.log(
      {
        action: 'client.created',
        entity: 'client',
        entityId: client.id,
        details: { name: client.name },
      },
      userId,
    );

    console.log(`[CLIENT] Created: ${client.name} (${client.id}) by user ${userId}`);

    return { ...client, activeCredits: 0, totalDebt: 0 };
  },

  getById: async (id: string, userId: string) => {
    const client = await clientModel.findById(id, userId);
    if (!client) {
      throw new NotFoundError('Client not found');
    }

    const credits = client.credits ?? [];
    const nonVoidedPayments = credits.flatMap((c) =>
      (c.payments ?? []).filter((p) => !p.isVoided),
    );

    const totalBorrowed = credits.reduce((sum, c) => sum + Number(c.amount), 0);
    const totalCollected = nonVoidedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const debtArs = credits
      .filter((c) => c.currency === 'ARS')
      .reduce((sum, c) => sum + Number(c.balance), 0);
    const debtUsd = credits
      .filter((c) => c.currency === 'USD')
      .reduce((sum, c) => sum + Number(c.balance), 0);

    return {
      ...client,
      totalBorrowed,
      totalCollected,
      debtArs,
      debtUsd,
      clientSince: client.createdAt,
    };
  },

  list: async (userId: string) => {
    const clients = await clientModel.findMany(userId);
    return clients.map((client) => ({
      ...client,
      activeCredits: client.credits.filter((c) => c.status === 'ACTIVE' || c.status === 'OVERDUE').length,
      totalDebt: client.credits.reduce((sum, c) => sum + Number(c.balance), 0),
    }));
  },

  update: async (id: string, userId: string, data: UpdateClientDto): Promise<ClientResponse> => {
    const existing = await clientModel.findById(id, userId);
    if (!existing) {
      throw new NotFoundError('Client not found');
    }
    const client = await clientModel.update(id, userId, data);

    console.log(`[CLIENT] Updated: ${client.name} (${id}) by user ${userId}`);

    return client;
  },

  delete: async (id: string, userId: string): Promise<void> => {
    const existing = await clientModel.findById(id, userId);
    if (!existing) {
      throw new NotFoundError('Client not found');
    }
    await clientModel.delete(id, userId);

    console.log(`[CLIENT] Deleted: ${existing.name} (${id}) by user ${userId}`);
  },

  getRecentPayments: async (clientId: string, userId: string, limit = 5): Promise<RecentPaymentDto[]> => {
    const client = await clientModel.findById(clientId, userId);
    if (!client) {
      throw new NotFoundError('Client not found');
    }

    const payments = await paymentModel.findByClient(clientId, userId, limit);
    return payments.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      date: p.date,
      currency: p.credit.currency,
      creditId: p.creditId,
      creditDescription: p.credit.description,
      installmentNumber: p.installmentNumber,
      method: p.method,
    }));
  },
};
