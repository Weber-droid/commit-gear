import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCartController } from '../../src/controllers/cart.controller.js';
import { createMockContainer } from '../helpers/container.js';
import { createMockReq, createMockRes, createMockNext, expectSuccess } from '../helpers/http.js';

describe('CartController', () => {
  const container = createMockContainer();
  const controller = createCartController(container);
  const { cartService } = container;
  const userId = 'user-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('get', () => {
    it('returns the user cart', async () => {
      const cart = { id: 'cart-1', items: [], subtotal: 0 };
      vi.mocked(cartService.getCart).mockResolvedValue(cart as never);
      const res = createMockRes();

      await controller.get(createMockReq({ user: { id: userId, role: 'buyer' } }), res, createMockNext());

      expect(cartService.getCart).toHaveBeenCalledWith(userId);
      expectSuccess(res, cart);
    });
  });

  describe('addItem', () => {
    it('adds an item to the cart', async () => {
      const cart = { id: 'cart-1', items: [{ productId: 'p1', quantity: 2 }] };
      vi.mocked(cartService.addItem).mockResolvedValue(cart as never);
      const req = createMockReq({
        user: { id: userId, role: 'buyer' },
        body: { productId: 'p1', quantity: 2 },
      });
      const res = createMockRes();

      await controller.addItem(req, res, createMockNext());

      expect(cartService.addItem).toHaveBeenCalledWith(userId, 'p1', 2);
      expectSuccess(res, cart);
    });
  });

  describe('updateItem', () => {
    it('updates cart item quantity', async () => {
      const cart = { id: 'cart-1', items: [{ productId: 'p1', quantity: 3 }] };
      vi.mocked(cartService.updateItem).mockResolvedValue(cart as never);
      const req = createMockReq({
        user: { id: userId, role: 'buyer' },
        params: { productId: 'p1' },
        body: { quantity: 3 },
      });
      const res = createMockRes();

      await controller.updateItem(req, res, createMockNext());

      expect(cartService.updateItem).toHaveBeenCalledWith(userId, 'p1', 3);
      expectSuccess(res, cart);
    });
  });

  describe('removeItem', () => {
    it('removes an item from the cart', async () => {
      const cart = { id: 'cart-1', items: [] };
      vi.mocked(cartService.removeItem).mockResolvedValue(cart as never);
      const req = createMockReq({
        user: { id: userId, role: 'buyer' },
        params: { productId: 'p1' },
      });
      const res = createMockRes();

      await controller.removeItem(req, res, createMockNext());

      expect(cartService.removeItem).toHaveBeenCalledWith(userId, 'p1');
      expectSuccess(res, cart);
    });
  });

  describe('clear', () => {
    it('clears the cart', async () => {
      const cart = { id: 'cart-1', items: [] };
      vi.mocked(cartService.clear).mockResolvedValue(cart as never);
      const res = createMockRes();

      await controller.clear(createMockReq({ user: { id: userId, role: 'buyer' } }), res, createMockNext());

      expect(cartService.clear).toHaveBeenCalledWith(userId);
      expectSuccess(res, cart);
    });
  });
});
