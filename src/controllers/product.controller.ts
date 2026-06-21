import type { Request, Response, NextFunction } from 'express';
import type { Container } from '../container.js';
import { sendSuccess, buildMeta } from '../utils/response.js';
import { param } from '../utils/params.js';

export function createProductController(container: Container) {
  const { productService } = container;

  return {
    list: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { items, total } = await productService.list(req.query as never);
        sendSuccess(res, items, 200, buildMeta(Number(req.query.page), Number(req.query.limit), total));
      } catch (e) {
        next(e);
      }
    },

    getById: async (req: Request, res: Response, next: NextFunction) => {
      try {
        sendSuccess(res, await productService.getById(param(req.params.id)));
      } catch (e) {
        next(e);
      }
    },

    create: async (req: Request, res: Response, next: NextFunction) => {
      try {
        sendSuccess(res, await productService.create(req.user!, req.body), 201);
      } catch (e) {
        next(e);
      }
    },

    update: async (req: Request, res: Response, next: NextFunction) => {
      try {
        sendSuccess(res, await productService.update(req.user!, param(req.params.id), req.body));
      } catch (e) {
        next(e);
      }
    },

    delete: async (req: Request, res: Response, next: NextFunction) => {
      try {
        sendSuccess(res, await productService.softDelete(req.user!, param(req.params.id)));
      } catch (e) {
        next(e);
      }
    },
  };
}
