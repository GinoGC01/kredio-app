import { paymentModel } from '../models/payment.model.js';
import { creditModel } from '../../credits/models/credit.model.js';
import { RegisterPaymentDto } from '../types/payment.types.js';
import { NotFoundError } from '../../../shared/errors/AppError.js';
import { activityService } from '../../activity/services/activity.service.js';
import { CreditStatus } from '@prisma/client';

export const paymentService = {
  register: async (data: RegisterPaymentDto, userId: string) => {
    const credit = await creditModel.findById(data.creditId, userId);
    if (!credit) {
      throw new NotFoundError('Credit not found');
    }

    const payment = await paymentModel.create({
      amount: data.amount,
      creditId: data.creditId,
      userId,
      note: data.note,
      date: data.date ? new Date(data.date) : undefined,
    });

    const newBalance = Number(credit.balance) - data.amount;

    if (newBalance <= 0) {
      await creditModel.updateStatus(data.creditId, CreditStatus.PAID);
      await creditModel.updateBalance(data.creditId, 0);
    } else {
      await creditModel.updateBalance(data.creditId, newBalance);
    }

    await activityService.log(
      {
        action: 'payment.registered',
        entity: 'payment',
        entityId: payment.id,
        details: {
          amount: data.amount,
          creditId: data.creditId,
          newBalance: Math.max(0, newBalance),
        },
      },
      userId,
    );

    console.log(
      `[PAYMENT] Registered: $${data.amount} on credit ${data.creditId} by user ${userId}. New balance: $${Math.max(0, newBalance)}`,
    );

    return payment;
  },

  listByCredit: async (creditId: string, userId: string) => {
    const credit = await creditModel.findById(creditId, userId);
    if (!credit) {
      throw new NotFoundError('Credit not found');
    }
    return paymentModel.findByCredit(creditId);
  },

  list: async (userId: string) => {
    return paymentModel.findMany(userId);
  },
};
