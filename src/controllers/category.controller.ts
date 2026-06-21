import type { Request, Response, NextFunction } from 'express';
import type { Container } from '../container.js';
import { sendSuccess } from '../utils/response.js';
import { param } from '../utils/params.js';

export function createCategoryController(container: Container) {
  const { categoryService } = container;

  return {
    list: async (_req: Request, res: Response, next: NextFunction) => {
      try {
        sendSuccess(res, await categoryService.list());
      } catch (e) {
        next(e);
      }
    },

    getById: async (req: Request, res: Response, next: NextFunction) => {
      try {
        sendSuccess(res, await categoryService.getById(param(req.params.id)));
      } catch (e) {
        next(e);
      }
    },

    create: async (req: Request, res: Response, next: NextFunction) => {
      try {
        sendSuccess(res, await categoryService.create(req.body), 201);
      } catch (e) {
        next(e);
      }
    },

    update: async (req: Request, res: Response, next: NextFunction) => {
      try {
        sendSuccess(res, await categoryService.update(param(req.params.id), req.body));
      } catch (e) {
        next(e);
      }
    },

    delete: async (req: Request, res: Response, next: NextFunction) => {
      try {
        sendSuccess(res, await categoryService.delete(param(req.params.id)));
      } catch (e) {
        next(e);
      }
    },
  };
}
