import { z } from 'zod';

export const registerPaymentSchema = z.object({
  creditId: z.string().uuid('Invalid credit ID'),
  amount: z.number().positive('Amount must be positive'),
  date: z.string().optional(),
  note: z.string().optional(),
});
