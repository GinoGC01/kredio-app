import { creditModel } from '../models/credit.model.js';
import { CreateCreditDto } from '../types/credit.types.js';
import { NotFoundError } from '../../../shared/errors/AppError.js';
import { clientModel } from '../../clients/models/client.model.js';
import { activityService } from '../../activity/services/activity.service.js';
import { CreditStatus } from '@prisma/client';

export const creditService = {
  create: async (data: CreateCreditDto, userId: string) => {
    const client = await clientModel.findById(data.clientId, userId);
    if (!client) {
      throw new NotFoundError('Client not found');
    }

    const amount = data.amount;
    const interestRate = data.interestRate;
    const totalAmount = amount + (amount * interestRate) / 100;

    const frequencyMap = { WEEKLY: 'semanal', BIWEEKLY: 'quincenal', MONTHLY: 'mensual' };

    const currency = data.currency || 'ARS';
    const currencySymbol = currency === 'USD' ? 'USD' : 'ARS';

    const credit = await creditModel.create({
      amount,
      interestRate,
      totalAmount,
      balance: totalAmount,
      installments: data.installments,
      frequency: data.frequency,
      currency,
      description: data.description,
      dueDate: new Date(data.dueDate),
      status: CreditStatus.ACTIVE,
      clientId: data.clientId,
      userId,
    });

    await activityService.log(
      {
        action: 'credit.created',
        entity: 'credit',
        entityId: credit.id,
        details: { amount, currency, clientName: client.name, installments: data.installments, frequency: data.frequency },
      },
      userId,
    );

    console.log(`[CREDIT] Created: ${currencySymbol} ${amount} for ${client.name} | ${data.installments} cuotas ${frequencyMap[data.frequency]} (${credit.id}) by user ${userId}`);

    return credit;
  },

  getById: async (id: string, userId: string) => {
    const credit = await creditModel.findById(id, userId);
    if (!credit) {
      throw new NotFoundError('Credit not found');
    }
    return credit;
  },

  listByClient: async (clientId: string, userId: string) => {
    const client = await clientModel.findById(clientId, userId);
    if (!client) {
      throw new NotFoundError('Client not found');
    }
    return creditModel.findManyByClient(clientId, userId);
  },

  list: async (userId: string) => {
    return creditModel.findMany(userId);
  },
};
