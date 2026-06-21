import type { Request, Response, NextFunction } from 'express';
import type { Container } from '../container.js';
import { sendSuccess } from '../utils/response.js';
import { param } from '../utils/params.js';

export function createCartController(container: Container) {
  const { cartService } = container;

  return {
    get: async (req: Request, res: Response, next: NextFunction) => {
      try {
        sendSuccess(res, await cartService.getCart(req.user!.id));
      } catch (e) {
        next(e);
      }
    },

    addItem: async (req: Request, res: Response, next: NextFunction) => {
      try {
        sendSuccess(res, await cartService.addItem(req.user!.id, req.body.productId, req.body.quantity));
      } catch (e) {
        next(e);
      }
    },

    updateItem: async (req: Request, res: Response, next: NextFunction) => {
      try {
        sendSuccess(res, await cartService.updateItem(req.user!.id, param(req.params.productId), req.body.quantity));
      } catch (e) {
        next(e);
      }
    },

    removeItem: async (req: Request, res: Response, next: NextFunction) => {
      try {
        sendSuccess(res, await cartService.removeItem(req.user!.id, param(req.params.productId)));
      } catch (e) {
        next(e);
      }
    },

    clear: async (req: Request, res: Response, next: NextFunction) => {
      try {
        sendSuccess(res, await cartService.clear(req.user!.id));
      } catch (e) {
        next(e);
      }
    },
  };
}
