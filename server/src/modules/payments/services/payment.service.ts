import { paymentModel } from '../models/payment.model.js';
import { creditModel } from '../../credits/models/credit.model.js';
import { RegisterPaymentDto, UpdatePaymentDto, PaymentFilterDto } from '../types/payment.types.js';
import { NotFoundError, BadRequestError } from '../../../shared/errors/AppError.js';
import { activityService } from '../../activity/services/activity.service.js';
import { CreditStatus } from '@prisma/client';
import { calculateDateRange, DateRangeFilter } from '../../../shared/types/date-filter.js';
import { prisma } from '../../../config/database.js';

function calculateInstallmentDueDate(firstDueDate: Date, installmentNumber: number, frequency: string): Date {
  const due = new Date(firstDueDate);
  if (frequency === 'WEEKLY') due.setDate(due.getDate() + (installmentNumber - 1) * 7);
  else if (frequency === 'BIWEEKLY') due.setDate(due.getDate() + (installmentNumber - 1) * 14);
  else if (frequency === 'MONTHLY') due.setMonth(due.getMonth() + (installmentNumber - 1));
  return due;
}

function calculateMora(credit: any, daysLate: number, totalAmount: number): number {
  if (!credit.moraType || !credit.moraRate || daysLate <= 0) return 0;
  const rate = Number(credit.moraRate);
  let mora = 0;
  if (credit.moraType === 'FIXED_AMOUNT') {
    mora = daysLate * rate;
  } else if (credit.moraType === 'PERCENTAGE') {
    mora = totalAmount * (rate / 100) * daysLate;
  }
  return Math.round(mora * 100) / 100;
}

export const paymentService = {
  calculateBreakdown: async (creditId: string, userId: string) => {
    const credit = await creditModel.findById(creditId, userId);
    if (!credit) throw new NotFoundError('Credit not found');

    const totalAmount = Number(credit.totalAmount);
    const principal = Number(credit.amount);
    const installments = Number(credit.installments);
    const now = new Date();

    const existingPaymentsCount = await paymentModel.countByCredit(creditId);
    const currentInstallmentNumber = existingPaymentsCount + 1;

    if (currentInstallmentNumber > installments) {
      return {
        currentInstallment: null,
        overdueInstallments: [],
        totalOverdueMora: 0,
      };
    }

    const installmentAmount = Math.round((totalAmount / installments) * 100) / 100;
    const totalInterest = totalAmount - principal;
    const interestPortion = Math.round((totalInterest / installments) * 100) / 100;
    const principalPortion = Math.round((installmentAmount - interestPortion) * 100) / 100;

    const adjustedInterest = (currentInstallmentNumber === installments)
      ? Math.round((totalInterest - (interestPortion * (installments - 1))) * 100) / 100
      : interestPortion;
    const adjustedPrincipal = (currentInstallmentNumber === installments)
      ? Math.round((principal - (principalPortion * (installments - 1))) * 100) / 100
      : principalPortion;

    const currentDueDate = calculateInstallmentDueDate(credit.dueDate, currentInstallmentNumber, credit.frequency);
    const currentDaysLate = Math.max(0, Math.floor((now.getTime() - currentDueDate.getTime()) / (1000 * 60 * 60 * 24)));
    const currentMora = calculateMora(credit, currentDaysLate, totalAmount);

    // Build list of all overdue installments for reference
    const overdueInstallments = [];
    for (let i = currentInstallmentNumber; i <= installments; i++) {
      const dueDate = calculateInstallmentDueDate(credit.dueDate, i, credit.frequency);
      if (dueDate > now) break;
      const daysLate = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
      const mora = calculateMora(credit, daysLate, totalAmount);
      overdueInstallments.push({
        number: i,
        daysLate,
        moraAmount: mora,
        totalWithMora: Math.round((installmentAmount + mora) * 100) / 100,
        dueDate: dueDate.toISOString(),
      });
    }

    const totalOverdueMora = overdueInstallments.reduce((sum, oi) => sum + oi.moraAmount, 0);

    return {
      currentInstallment: {
        number: currentInstallmentNumber,
        totalInstallments: installments,
        originalAmount: adjustedPrincipal,
        interestAmount: adjustedInterest,
        installmentAmount,
        daysLate: currentDaysLate,
        moraAmount: currentMora,
        totalWithMora: Math.round((adjustedPrincipal + adjustedInterest + currentMora) * 100) / 100,
        dueDate: currentDueDate.toISOString(),
      },
      overdueInstallments,
      totalOverdueMora: Math.round(totalOverdueMora * 100) / 100,
    };
  },

  register: async (data: RegisterPaymentDto, userId: string) => {
    const credit = await creditModel.findById(data.creditId, userId);
    if (!credit) {
      throw new NotFoundError('Credit not found');
    }

    if (credit.status === 'PAID' || credit.status === 'CANCELLED') {
      throw new BadRequestError('Cannot register payment for a paid or cancelled credit');
    }

    // Validate breakdown matches amount
    const breakdownTotal = Math.round((data.originalAmount + data.interestAmount + data.moraAmount) * 100) / 100;
    if (Math.abs(breakdownTotal - data.amount) > 0.01) {
      throw new BadRequestError('Payment amount does not match breakdown (original + interest + mora)');
    }

    const parsedBalance = Number(credit.balance);
    const roundedBalance = Math.round(parsedBalance * 100) / 100;

    // Balance is reduced only by originalAmount + interestAmount (mora is extra)
    const balanceReduction = data.originalAmount + data.interestAmount;
    const newBalance = roundedBalance - balanceReduction;
    const roundedNewBalance = Math.round(newBalance * 100) / 100;

    if (roundedNewBalance < 0) {
      throw new BadRequestError('Payment amount (excluding mora) exceeds remaining balance');
    }

    // FIFO: oldest unpaid installment first
    const existingPaymentsCount = await paymentModel.countByCredit(data.creditId);
    const installmentNumber = existingPaymentsCount + 1;

    if (installmentNumber > Number(credit.installments)) {
      throw new BadRequestError('All installments have already been paid');
    }

    const isPaidOff = roundedNewBalance <= 0;

    // Validate BIEN method requires note
    if (data.method === 'BIEN' && !data.note) {
      throw new BadRequestError('Note is required when paying with a material good');
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          amount: data.amount,
          originalAmount: data.originalAmount,
          interestAmount: data.interestAmount,
          moraAmount: data.moraAmount,
          previousBalance: roundedBalance,
          installmentNumber,
          method: (data.method as any) || 'CASH',
          creditId: data.creditId,
          userId,
          note: data.note,
          date: data.date ? new Date(data.date) : new Date(),
        },
        include: {
          credit: {
            select: {
              id: true,
              amount: true,
              totalAmount: true,
              balance: true,
              currency: true,
              installments: true,
              dueDate: true,
              client: { select: { id: true, name: true } },
            },
          },
        },
      });

      const statusData: any = isPaidOff
        ? { status: CreditStatus.PAID, balance: 0 }
        : { balance: roundedNewBalance };

      // If credit was OVERDUE and still has balance, set back to ACTIVE
      if (!isPaidOff && credit.status === CreditStatus.OVERDUE) {
        statusData.status = CreditStatus.ACTIVE;
      }

      const updatedCredit = await tx.credit.update({
        where: { id: data.creditId },
        data: statusData,
      });

      return { payment, credit: updatedCredit };
    });

    await activityService.log(
      {
        action: 'payment.registered',
        entity: 'payment',
        entityId: result.payment.id,
        details: {
          amount: data.amount,
          originalAmount: data.originalAmount,
          interestAmount: data.interestAmount,
          moraAmount: data.moraAmount,
          creditId: data.creditId,
          installmentNumber,
          newBalance: Math.max(0, roundedNewBalance),
          status: isPaidOff ? 'PAID' : 'ACTIVE',
        },
      },
      userId,
    );

    return { payment: result.payment, credit: result.credit };
  },

  listByCredit: async (creditId: string, userId: string) => {
    const credit = await creditModel.findById(creditId, userId);
    if (!credit) {
      throw new NotFoundError('Credit not found');
    }
    return paymentModel.findByCredit(creditId);
  },

  list: async (userId: string, filter?: PaymentFilterDto) => {
    const { fromDate, toDate } = calculateDateRange((filter ?? {}) as DateRangeFilter);

    const needsStatusFilter = !!filter?.status;

    const result = await paymentModel.findMany({
      userId,
      dateFrom: fromDate,
      dateTo: toDate,
      search: filter?.search,
      currency: filter?.currency,
      creditId: filter?.creditId,
      method: filter?.method,
      sortBy: filter?.sortBy,
      sortOrder: filter?.sortOrder,
      page: needsStatusFilter ? undefined : filter?.page,
      limit: needsStatusFilter ? undefined : filter?.limit,
    });

    if (needsStatusFilter) {
      const filtered = result.data.filter((p) => {
        const dueDate = calculateInstallmentDueDate(
          new Date(p.credit.dueDate),
          p.installmentNumber || 1,
          p.credit.frequency,
        );
        const diffDays = Math.floor(
          (new Date(p.date).getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        let computedStatus: string;
        if (diffDays <= -1) computedStatus = 'early';
        else if (diffDays <= 0) computedStatus = 'on_time';
        else computedStatus = 'late';
        return computedStatus === filter!.status;
      });

      const page = filter?.page || 1;
      const limit = filter?.limit || 15;
      const start = (page - 1) * limit;
      const paginatedData = filtered.slice(start, start + limit);

      return { data: paginatedData, total: filtered.length, page, limit };
    }

    return result;
  },

  getById: async (id: string, userId: string) => {
    const payment = await paymentModel.findById(id, userId);
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }
    return payment;
  },

  getStats: async (userId: string, filter?: PaymentFilterDto) => {
    const { fromDate, toDate } = calculateDateRange((filter ?? {}) as DateRangeFilter);

    const stats = await paymentModel.findStats({
      userId,
      dateFrom: fromDate,
      dateTo: toDate,
    });

    return stats;
  },

  update: async (id: string, data: UpdatePaymentDto, userId: string) => {
    const payment = await paymentModel.findById(id, userId);
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (payment.isVoided) {
      throw new BadRequestError('Cannot edit a voided payment');
    }

    if (data.note === undefined && data.method === undefined) {
      return payment;
    }

    const updated = await paymentModel.update(id, data);

    await activityService.log(
      {
        action: 'payment.updated',
        entity: 'payment',
        entityId: id,
        details: { ...data },
      },
      userId,
    );

    return updated;
  },

  softDelete: async (id: string, userId: string) => {
    const payment = await paymentModel.findById(id, userId);
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (payment.isVoided) {
      throw new BadRequestError('Payment is already voided');
    }

    const result = await prisma.$transaction(async (tx) => {
      const voided = await tx.payment.update({
        where: { id },
        data: { isVoided: true, voidedAt: new Date() },
      });

      // Revert credit balance
      const credit = await tx.credit.findUnique({
        where: { id: payment.creditId },
      });

      if (credit) {
        // Revert only originalAmount + interestAmount (mora is extra, not from balance)
        const revertAmount = Number(payment.originalAmount) + Number(payment.interestAmount);
        const revertedBalance = Number(credit.balance) + revertAmount;

        await tx.credit.update({
          where: { id: payment.creditId },
          data: {
            balance: revertedBalance,
            status: revertedBalance > 0 && credit.status === 'PAID'
              ? CreditStatus.ACTIVE
              : credit.status,
          },
        });
      }

      return voided;
    });

    await activityService.log(
      {
        action: 'payment.voided',
        entity: 'payment',
        entityId: id,
        details: {
          amount: Number(payment.amount),
          creditId: payment.creditId,
          reason: 'Manually voided',
        },
      },
      userId,
    );

    return result;
  },
};
