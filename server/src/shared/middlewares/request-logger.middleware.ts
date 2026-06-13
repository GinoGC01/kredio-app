import { Request, Response, NextFunction } from 'express';
import { env } from '../../config/env.js';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  if (env.nodeEnv !== 'development') {
    next();
    return;
  }

  const start = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    console.log(`[${new Date().toISOString()}] ${method} ${originalUrl} ${statusCode} ${duration}ms`);
  });

  next();
};
