import { z } from 'zod';

const paymentMethodEnum = z.enum(['CASH', 'TRANSFER', 'DEBIT_CARD', 'CREDIT_CARD', 'OTHER', 'BIEN']);

export const registerPaymentSchema = z.object({
  creditId: z.string().uuid('Invalid credit ID'),
  amount: z.number().positive('Amount must be positive'),
  originalAmount: z.number().min(0, 'Original amount cannot be negative'),
  interestAmount: z.number().min(0, 'Interest amount cannot be negative'),
  moraAmount: z.number().min(0, 'Mora amount cannot be negative'),
  date: z.string().optional(),
  note: z.string().optional(),
  method: paymentMethodEnum.optional().default('CASH'),
}).refine(
  (data) => {
    if (data.method === 'BIEN' && !data.note) return false;
    return true;
  },
  { message: 'Note is required when paying with a material good', path: ['note'] },
);

export const updatePaymentSchema = z.object({
  note: z.string().optional(),
  method: paymentMethodEnum.optional(),
});
