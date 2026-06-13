import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env, cookieOptions } from '../../../config/env.js';
import { authService } from '../services/auth.service.js';
import { registerSchema, loginSchema, googleLoginSchema } from '../validators/auth.validator.js';
import { AuthenticatedRequest } from '../../../shared/middlewares/auth.middleware.js';

const setTokenCookie = (res: Response, userId: string) => {
  const token = jwt.sign({ userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as jwt.SignOptions);
  res.cookie('token', token, cookieOptions);
};

export const authController = {
  register: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = registerSchema.parse(req.body);
      const user = await authService.register(data);
      setTokenCookie(res, user.id);
      res.status(201).json({ user });
    } catch (error) {
      next(error);
    }
  },

  login: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = loginSchema.parse(req.body);
      const user = await authService.login(data);
      setTokenCookie(res, user.id);
      res.json({ user });
    } catch (error) {
      next(error);
    }
  },

  googleLogin: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { credential } = googleLoginSchema.parse(req.body);
      const user = await authService.googleAuth(credential);
      setTokenCookie(res, user.id);
      res.json({ user });
    } catch (error) {
      next(error);
    }
  },

  logout: async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    res.clearCookie('token', { path: '/' });
    res.json({ message: 'Logged out successfully' });
  },

  getProfile: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await authService.getProfile(req.userId!);
      res.json(user);
    } catch (error) {
      next(error);
    }
  },
};
