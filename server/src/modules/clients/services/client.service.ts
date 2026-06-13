import { clientModel } from '../models/client.model.js';
import { CreateClientDto, UpdateClientDto, ClientResponse } from '../types/client.types.js';
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
    return client;
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
};
