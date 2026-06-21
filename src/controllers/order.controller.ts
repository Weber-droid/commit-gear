import type { Request, Response, NextFunction } from 'express';
import type { Container } from '../container.js';
import { sendSuccess, buildMeta } from '../utils/response.js';
import { param } from '../utils/params.js';

export function createOrderController(container: Container) {
  const { orderService } = container;

  return {
    checkout: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const order = await orderService.checkout(req.user!.id, req.body.shippingAddress);
        sendSuccess(res, { order }, 201);
      } catch (e) {
        next(e);
      }
    },

    list: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { items, total } = await orderService.listForUser(
          req.user!.id,
          Number(req.query.page),
          Number(req.query.limit),
          req.query.status as never
        );
        sendSuccess(res, items, 200, buildMeta(Number(req.query.page), Number(req.query.limit), total));
      } catch (e) {
        next(e);
      }
    },

    getById: async (req: Request, res: Response, next: NextFunction) => {
      try {
        sendSuccess(res, await orderService.getById(req.user!, param(req.params.id)));
      } catch (e) {
        next(e);
      }
    },

    updateStatus: async (req: Request, res: Response, next: NextFunction) => {
      try {
        sendSuccess(res, await orderService.updateStatus(param(req.params.id), req.body.status));
      } catch (e) {
        next(e);
      }
    },
  };
}
