import { creditModel } from '../models/credit.model.js';
import { paymentModel } from '../../payments/models/payment.model.js';
import { CreateCreditDto } from '../types/credit.types.js';
import { NotFoundError } from '../../../shared/errors/AppError.js';
import { clientModel } from '../../clients/models/client.model.js';
import { activityService } from '../../activity/services/activity.service.js';
import { CreditStatus } from '@prisma/client';
import { DateRangeFilter, calculateDateRange } from '../../../shared/types/date-filter.js';

function calculateInstallmentDueDate(firstDueDate: Date, installmentNumber: number, frequency: string): Date {
  const due = new Date(firstDueDate);
  if (frequency === 'WEEKLY') due.setDate(due.getDate() + (installmentNumber - 1) * 7);
  else if (frequency === 'BIWEEKLY') due.setDate(due.getDate() + (installmentNumber - 1) * 14);
  else if (frequency === 'MONTHLY') due.setMonth(due.getMonth() + (installmentNumber - 1));
  return due;
}

export const creditService = {
  updateOverdueStatuses: async (userId: string) => {
    const credits = await creditModel.findAllActiveOrOverdue(userId);
    const now = new Date();
    let count = 0;

    for (const credit of credits) {
      const paidCount = await paymentModel.countByCredit(credit.id);
      const nextInstallment = paidCount + 1;

      if (nextInstallment > credit.installments) {
        if (credit.status !== CreditStatus.PAID) {
          await creditModel.updateStatus(credit.id, CreditStatus.PAID);
        }
        continue;
      }

      const nextDueDate = calculateInstallmentDueDate(credit.dueDate, nextInstallment, credit.frequency);
      const isOverdue = nextDueDate < now;

      if (isOverdue && credit.status !== CreditStatus.OVERDUE) {
        await creditModel.updateStatus(credit.id, CreditStatus.OVERDUE);
        count++;
      } else if (!isOverdue && credit.status === CreditStatus.OVERDUE) {
        await creditModel.updateStatus(credit.id, CreditStatus.ACTIVE);
      }
    }
    return count;
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
      moraType: data.moraType,
      moraPeriod: data.moraPeriod,
      moraRate: data.moraRate,
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
