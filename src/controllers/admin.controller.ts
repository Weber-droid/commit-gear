import type { Request, Response, NextFunction } from 'express';
import type { Container } from '../container.js';
import { sendSuccess, buildMeta } from '../utils/response.js';
import { param } from '../utils/params.js';

export function createAdminController(container: Container) {
  const { authService, orderService, productService, userRepo } = container;

  return {
    listVendors: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const page = Number(req.query.page);
        const limit = Number(req.query.limit);
        const [users, total] = await userRepo.findBuyersPendingVendor(page, limit);
        sendSuccess(
          res,
          users.map((u) => ({
            id: u._id.toString(),
            name: u.name,
            email: u.email,
            role: u.role,
            createdAt: u.createdAt.toISOString(),
          })),
          200,
          buildMeta(page, limit, total)
        );
      } catch (e) {
        next(e);
      }
    },

    approveVendor: async (req: Request, res: Response, next: NextFunction) => {
      try {
        sendSuccess(res, await authService.promoteToVendor(param(req.params.id)));
      } catch (e) {
        next(e);
      }
    },

    listOrders: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const page = Number(req.query.page);
        const limit = Number(req.query.limit);
        const { items, total } = await orderService.listAll(page, limit, {
          status: req.query.status as never,
          paymentStatus: req.query.paymentStatus as string,
        });
        sendSuccess(res, items, 200, buildMeta(page, limit, total));
      } catch (e) {
        next(e);
      }
    },

    overrideInventory: async (req: Request, res: Response, next: NextFunction) => {
      try {
        sendSuccess(res, await productService.overrideInventory(param(req.params.id), req.body.inventory));
      } catch (e) {
        next(e);
      }
    },
  };
}
