import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOrderController } from '../../src/controllers/order.controller.js';
import { createMockContainer } from '../helpers/container.js';
import { createMockReq, createMockRes, createMockNext, expectSuccess } from '../helpers/http.js';

describe('OrderController', () => {
  const container = createMockContainer();
  const controller = createOrderController(container);
  const { orderService } = container;
  const user = { id: 'user-1', role: 'buyer' as const };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkout', () => {
    it('creates an order from cart and returns 201', async () => {
      const shippingAddress = { line1: '123 Main St', city: 'Lagos', country: 'NG' };
      const order = { id: 'o1', status: 'pending', total: 10000 };
      vi.mocked(orderService.checkout).mockResolvedValue(order as never);
      const req = createMockReq({ user, body: { shippingAddress } });
      const res = createMockRes();

      await controller.checkout(req, res, createMockNext());

      expect(orderService.checkout).toHaveBeenCalledWith('user-1', shippingAddress);
      expectSuccess(res, { order }, 201);
    });
  });

  describe('list', () => {
    it('returns paginated user orders', async () => {
      const items = [{ id: 'o1', status: 'pending' }];
      vi.mocked(orderService.listForUser).mockResolvedValue({ items, total: 1 } as never);
      const req = createMockReq({
        user,
        query: { page: '1', limit: '10', status: 'pending' } as never,
      });
      const res = createMockRes();

      await controller.list(req, res, createMockNext());

      expect(orderService.listForUser).toHaveBeenCalledWith('user-1', 1, 10, 'pending');
      expectSuccess(res, items, 200, { page: 1, limit: 10, total: 1, totalPages: 1 });
    });
  });

  describe('getById', () => {
    it('returns an order by id', async () => {
      const order = { id: 'o1', status: 'pending' };
      vi.mocked(orderService.getById).mockResolvedValue(order as never);
      const res = createMockRes();

      await controller.getById(createMockReq({ user, params: { id: 'o1' } }), res, createMockNext());

      expect(orderService.getById).toHaveBeenCalledWith(user, 'o1');
      expectSuccess(res, order);
    });
  });

  describe('updateStatus', () => {
    it('updates order status', async () => {
      const updated = { id: 'o1', status: 'shipped' };
      vi.mocked(orderService.updateStatus).mockResolvedValue(updated as never);
      const req = createMockReq({ params: { id: 'o1' }, body: { status: 'shipped' } });
      const res = createMockRes();

      await controller.updateStatus(req, res, createMockNext());

      expect(orderService.updateStatus).toHaveBeenCalledWith('o1', 'shipped');
      expectSuccess(res, updated);
    });
  });
});
