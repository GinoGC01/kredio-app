import { creditModel } from '../models/credit.model.js';
import { CreateCreditDto } from '../types/credit.types.js';
import { NotFoundError } from '../../../shared/errors/AppError.js';
import { clientModel } from '../../clients/models/client.model.js';
import { activityService } from '../../activity/services/activity.service.js';
import { CreditStatus } from '@prisma/client';
import { DateRangeFilter, calculateDateRange } from '../../../shared/types/date-filter.js';

export const creditService = {
  updateOverdueStatuses: async (userId: string) => {
    const overdue = await creditModel.findOverdue(userId);
    for (const credit of overdue) {
      await creditModel.updateStatus(credit.id, CreditStatus.OVERDUE);
    }
    return overdue.length;
  },

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
    await creditService.updateOverdueStatuses(userId);
    const credit = await creditModel.findById(id, userId);
    if (!credit) {
      throw new NotFoundError('Credit not found');
    }
    return credit;
  },

  listByClient: async (clientId: string, userId: string) => {
    await creditService.updateOverdueStatuses(userId);
    const client = await clientModel.findById(clientId, userId);
    if (!client) {
      throw new NotFoundError('Client not found');
    }
    return creditModel.findManyByClient(clientId, userId);
  },

  list: async (userId: string, filter?: DateRangeFilter) => {
    await creditService.updateOverdueStatuses(userId);
    const { fromDate, toDate } = calculateDateRange(filter ?? {});
    return creditModel.findMany(userId, fromDate, toDate);
  },
};
