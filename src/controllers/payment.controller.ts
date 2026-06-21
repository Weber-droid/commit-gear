import type { Request, Response, NextFunction } from 'express';
import type { Container } from '../container.js';
import { sendSuccess } from '../utils/response.js';
import { param } from '../utils/params.js';

export function createPaymentController(container: Container) {
  const { paymentService } = container;

  return {
    initialize: async (req: Request, res: Response, next: NextFunction) => {
      try {
        sendSuccess(res, await paymentService.initialize(req.user!.id, req.body.orderId, req.body.callbackUrl));
      } catch (e) {
        next(e);
      }
    },

    webhook: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const signature = req.headers['x-paystack-signature'] as string;
        const result = await paymentService.handleWebhook(req.body as Buffer, signature);
        sendSuccess(res, result);
      } catch (e) {
        next(e);
      }
    },

    verify: async (req: Request, res: Response, next: NextFunction) => {
      try {
        sendSuccess(res, await paymentService.verify(req.user!.id, param(req.params.reference)));
      } catch (e) {
        next(e);
      }
    },
  };
}
