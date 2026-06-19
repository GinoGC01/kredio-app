import { Response, NextFunction } from 'express';
import { clientService } from '../services/client.service.js';
import { createClientSchema, updateClientSchema } from '../validators/client.validator.js';
import { AuthenticatedRequest } from '../../../shared/middlewares/auth.middleware.js';

export const clientController = {
  create: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = createClientSchema.parse(req.body);
      const client = await clientService.create(data, req.userId!);
      res.status(201).json(client);
    } catch (error) {
      next(error);
    }
  },

  getById: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const client = await clientService.getById(id, req.userId!);
      res.json(client);
    } catch (error) {
      next(error);
    }
  },

  list: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clients = await clientService.list(req.userId!);
      res.json(clients);
    } catch (error) {
      next(error);
    }
  },

  update: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const data = updateClientSchema.parse(req.body);
      const client = await clientService.update(id, req.userId!, data);
      res.json(client);
    } catch (error) {
      next(error);
    }
  },

  delete: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      await clientService.delete(id, req.userId!);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  getRecentPayments: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const limit = parseInt(req.query.limit as string) || 5;
      const payments = await clientService.getRecentPayments(id, req.userId!, limit);
      res.json(payments);
    } catch (error) {
      next(error);
    }
  },
};
