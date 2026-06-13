import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { UnauthorizedError } from '../errors/AppError.js';
import { authModel } from '../../modules/auth/models/auth.model.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

interface JwtPayload {
  userId: string;
  iat: number;
  exp: number;
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
    const user = await authModel.findById(decoded.userId);

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (user.lastActivityAt) {
      const elapsed = Date.now() - new Date(user.lastActivityAt).getTime();
      if (elapsed > env.inactivityMs) {
        res.clearCookie('token', { path: '/' });
        throw new UnauthorizedError('Session expired due to inactivity');
      }
    }

    await authModel.updateLastActivity(decoded.userId);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
      return;
    }
    next(new UnauthorizedError('Invalid or expired token'));
  }
};
