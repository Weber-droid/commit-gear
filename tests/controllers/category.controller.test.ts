import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCategoryController } from '../../src/controllers/category.controller.js';
import { createMockContainer } from '../helpers/container.js';
import { createMockReq, createMockRes, createMockNext, expectSuccess } from '../helpers/http.js';

describe('CategoryController', () => {
  const container = createMockContainer();
  const controller = createCategoryController(container);
  const { categoryService } = container;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('returns all categories', async () => {
      const categories = [{ id: 'c1', name: 'Hoodies', slug: 'hoodies' }];
      vi.mocked(categoryService.list).mockResolvedValue(categories as never);
      const res = createMockRes();

      await controller.list(createMockReq(), res, createMockNext());

      expect(categoryService.list).toHaveBeenCalled();
      expectSuccess(res, categories);
    });
  });

  describe('getById', () => {
    it('returns a category by id', async () => {
      const category = { id: 'c1', name: 'Hoodies', slug: 'hoodies' };
      vi.mocked(categoryService.getById).mockResolvedValue(category as never);
      const res = createMockRes();

      await controller.getById(createMockReq({ params: { id: 'c1' } }), res, createMockNext());

      expect(categoryService.getById).toHaveBeenCalledWith('c1');
      expectSuccess(res, category);
    });
  });

  describe('create', () => {
    it('creates a category and returns 201', async () => {
      const body = { name: 'Keycaps', slug: 'keycaps' };
      const created = { id: 'c2', ...body };
      vi.mocked(categoryService.create).mockResolvedValue(created as never);
      const res = createMockRes();

      await controller.create(createMockReq({ body }), res, createMockNext());

      expect(categoryService.create).toHaveBeenCalledWith(body);
      expectSuccess(res, created, 201);
    });
  });

  describe('update', () => {
    it('updates a category', async () => {
      const updated = { id: 'c1', name: 'Desk Pads', slug: 'desk-pads' };
      vi.mocked(categoryService.update).mockResolvedValue(updated as never);
      const body = { name: 'Desk Pads' };
      const res = createMockRes();

      await controller.update(createMockReq({ params: { id: 'c1' }, body }), res, createMockNext());

      expect(categoryService.update).toHaveBeenCalledWith('c1', body);
      expectSuccess(res, updated);
    });
  });

  describe('delete', () => {
    it('deletes a category', async () => {
      const result = { id: 'c1', deleted: true };
      vi.mocked(categoryService.delete).mockResolvedValue(result as never);
      const res = createMockRes();

      await controller.delete(createMockReq({ params: { id: 'c1' } }), res, createMockNext());

      expect(categoryService.delete).toHaveBeenCalledWith('c1');
      expectSuccess(res, result);
    });
  });
});
