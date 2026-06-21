import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPaymentController } from '../../src/controllers/payment.controller.js';
import { createMockContainer } from '../helpers/container.js';
import { createMockReq, createMockRes, createMockNext, expectSuccess } from '../helpers/http.js';

describe('PaymentController', () => {
  const container = createMockContainer();
  const controller = createPaymentController(container);
  const { paymentService } = container;
  const user = { id: 'user-1', role: 'buyer' as const };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialize', () => {
    it('initializes payment for an order', async () => {
      const session = {
        authorizationUrl: 'https://paystack.com/pay/abc',
        reference: 'ref-123',
        accessCode: 'code',
        provider: 'paystack' as const,
      };
      vi.mocked(paymentService.initialize).mockResolvedValue(session as never);
      const req = createMockReq({
        user,
        body: { orderId: 'o1', callbackUrl: 'https://app.example/callback' },
      });
      const res = createMockRes();

      await controller.initialize(req, res, createMockNext());

      expect(paymentService.initialize).toHaveBeenCalledWith(
        'user-1',
        'o1',
        'https://app.example/callback'
      );
      expectSuccess(res, session);
    });
  });

  describe('webhook', () => {
    it('handles paystack webhook payload', async () => {
      const result = { received: true, reference: 'ref-123' };
      vi.mocked(paymentService.handleWebhook).mockResolvedValue(result as never);
      const rawBody = Buffer.from('{"event":"charge.success"}');
      const req = createMockReq({
        body: rawBody,
        headers: { 'x-paystack-signature': 'sig-abc' },
      });
      const res = createMockRes();

      await controller.webhook(req, res, createMockNext());

      expect(paymentService.handleWebhook).toHaveBeenCalledWith(rawBody, 'sig-abc');
      expectSuccess(res, result);
    });
  });

  describe('verify', () => {
    it('verifies payment by reference', async () => {
      const status = { reference: 'ref-123', status: 'paid', amount: 10000 };
      vi.mocked(paymentService.verify).mockResolvedValue(status as never);
      const req = createMockReq({ user, params: { reference: 'ref-123' } });
      const res = createMockRes();

      await controller.verify(req, res, createMockNext());

      expect(paymentService.verify).toHaveBeenCalledWith('user-1', 'ref-123');
      expectSuccess(res, status);
    });
  });
});
