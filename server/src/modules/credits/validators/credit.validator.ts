import { z } from 'zod';

export const createCreditSchema = z.object({
  clientId: z.string().uuid('Invalid client ID'),
  amount: z.number().positive('Amount must be positive'),
  interestRate: z.number().min(0, 'Interest rate cannot be negative'),
  installments: z.number().int().positive('Installments must be a positive integer'),
  frequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']),
  currency: z.enum(['ARS', 'USD']).optional().default('ARS'),
  description: z.string().optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
});
