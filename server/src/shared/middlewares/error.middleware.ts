import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError.js';
import { logger } from '../../config/logger.js';

export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({ error: err.errors[0]?.message || 'Validation error' });
    return;
  }

  logger.error(`Unexpected error [${err.name}]`, err);
  res.status(500).json({ error: 'Internal server error' });
};
