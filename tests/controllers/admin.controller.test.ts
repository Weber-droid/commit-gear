import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAdminController } from '../../src/controllers/admin.controller.js';
import { createMockContainer } from '../helpers/container.js';
import { createMockReq, createMockRes, createMockNext, expectSuccess } from '../helpers/http.js';

describe('AdminController', () => {
  const container = createMockContainer();
  const controller = createAdminController(container);
  const { authService, orderService, productService, userRepo } = container;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listVendors', () => {
    it('returns paginated buyers pending vendor approval', async () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const users = [
        {
          _id: { toString: () => 'u1' },
          name: 'Vendor Applicant',
          email: 'vendor@example.com',
          role: 'buyer',
          createdAt,
        },
      ];
      vi.mocked(userRepo.findBuyersPendingVendor).mockResolvedValue([users, 1] as never);
      const req = createMockReq({ query: { page: '1', limit: '10' } as never });
      const res = createMockRes();

      await controller.listVendors(req, res, createMockNext());

      expect(userRepo.findBuyersPendingVendor).toHaveBeenCalledWith(1, 10);
      expectSuccess(
        res,
        [
          {
            id: 'u1',
            name: 'Vendor Applicant',
            email: 'vendor@example.com',
            role: 'buyer',
            createdAt: createdAt.toISOString(),
          },
        ],
        200,
        { page: 1, limit: 10, total: 1, totalPages: 1 }
      );
    });
  });

  describe('approveVendor', () => {
    it('promotes user to vendor', async () => {
      const promoted = { id: 'u1', role: 'vendor' };
      vi.mocked(authService.promoteToVendor).mockResolvedValue(promoted as never);
      const res = createMockRes();

      await controller.approveVendor(createMockReq({ params: { id: 'u1' } }), res, createMockNext());

      expect(authService.promoteToVendor).toHaveBeenCalledWith('u1');
      expectSuccess(res, promoted);
    });
  });

  describe('listOrders', () => {
    it('returns paginated admin order list with filters', async () => {
      const items = [{ id: 'o1', status: 'pending', paymentStatus: 'paid' }];
      vi.mocked(orderService.listAll).mockResolvedValue({ items, total: 1 } as never);
      const req = createMockReq({
        query: { page: '2', limit: '5', status: 'pending', paymentStatus: 'paid' } as never,
      });
      const res = createMockRes();

      await controller.listOrders(req, res, createMockNext());

      expect(orderService.listAll).toHaveBeenCalledWith(2, 5, {
        status: 'pending',
        paymentStatus: 'paid',
      });
      expectSuccess(res, items, 200, { page: 2, limit: 5, total: 1, totalPages: 1 });
    });
  });

  describe('overrideInventory', () => {
    it('overrides product inventory', async () => {
      const updated = { id: 'p1', inventory: 100 };
      vi.mocked(productService.overrideInventory).mockResolvedValue(updated as never);
      const req = createMockReq({ params: { id: 'p1' }, body: { inventory: 100 } });
      const res = createMockRes();

      await controller.overrideInventory(req, res, createMockNext());

      expect(productService.overrideInventory).toHaveBeenCalledWith('p1', 100);
      expectSuccess(res, updated);
    });
  });
});
