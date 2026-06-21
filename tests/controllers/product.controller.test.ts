import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProductController } from '../../src/controllers/product.controller.js';
import { createMockContainer } from '../helpers/container.js';
import { createMockReq, createMockRes, createMockNext, expectSuccess } from '../helpers/http.js';

describe('ProductController', () => {
  const container = createMockContainer();
  const controller = createProductController(container);
  const { productService } = container;
  const user = { id: 'vendor-1', role: 'vendor' as const };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('returns paginated products', async () => {
      const items = [{ id: 'p1', name: 'Hoodie' }];
      vi.mocked(productService.list).mockResolvedValue({ items, total: 1 } as never);
      const req = createMockReq({ query: { page: '1', limit: '10' } as never });
      const res = createMockRes();

      await controller.list(req, res, createMockNext());

      expect(productService.list).toHaveBeenCalledWith({ page: '1', limit: '10' });
      expectSuccess(res, items, 200, { page: 1, limit: 10, total: 1, totalPages: 1 });
    });
  });

  describe('getById', () => {
    it('returns a product by id', async () => {
      const product = { id: 'p1', name: 'Hoodie' };
      vi.mocked(productService.getById).mockResolvedValue(product as never);
      const res = createMockRes();

      await controller.getById(createMockReq({ params: { id: 'p1' } }), res, createMockNext());

      expect(productService.getById).toHaveBeenCalledWith('p1');
      expectSuccess(res, product);
    });
  });

  describe('create', () => {
    it('creates a product and returns 201', async () => {
      const body = { name: 'Hoodie', price: 5000, category: 'hoodies' };
      const created = { id: 'p1', ...body };
      vi.mocked(productService.create).mockResolvedValue(created as never);
      const req = createMockReq({ body, user });
      const res = createMockRes();

      await controller.create(req, res, createMockNext());

      expect(productService.create).toHaveBeenCalledWith(user, body);
      expectSuccess(res, created, 201);
    });
  });

  describe('update', () => {
    it('updates a product', async () => {
      const updated = { id: 'p1', name: 'Updated Hoodie' };
      vi.mocked(productService.update).mockResolvedValue(updated as never);
      const req = createMockReq({ params: { id: 'p1' }, body: { name: 'Updated Hoodie' }, user });
      const res = createMockRes();

      await controller.update(req, res, createMockNext());

      expect(productService.update).toHaveBeenCalledWith(user, 'p1', { name: 'Updated Hoodie' });
      expectSuccess(res, updated);
    });
  });

  describe('delete', () => {
    it('soft-deletes a product', async () => {
      const result = { id: 'p1', deleted: true };
      vi.mocked(productService.softDelete).mockResolvedValue(result as never);
      const req = createMockReq({ params: { id: 'p1' }, user });
      const res = createMockRes();

      await controller.delete(req, res, createMockNext());

      expect(productService.softDelete).toHaveBeenCalledWith(user, 'p1');
      expectSuccess(res, result);
    });

    it('forwards errors to next', async () => {
      const error = new Error('Not found');
      vi.mocked(productService.softDelete).mockRejectedValue(error);
      const next = createMockNext();

      await controller.delete(createMockReq({ params: { id: 'p1' }, user }), createMockRes(), next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
