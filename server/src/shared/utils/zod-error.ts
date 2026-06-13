import { ZodError } from 'zod';
import { ValidationError } from '../errors/AppError.js';

export const handleZodError = (error: unknown): void => {
  if (error instanceof ZodError) {
    const messages = error.errors.map((e) => e.message).join(', ');
    throw new ValidationError(messages);
  }
};
