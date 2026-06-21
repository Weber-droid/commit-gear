import { vi } from 'vitest';
import type { Container } from '../../src/container.js';

export function createMockContainer(overrides: Partial<Container> = {}): Container {
  return {
    cache: {} as Container['cache'],
    paymentProvider: {} as Container['paymentProvider'],
    storageProvider: {} as Container['storageProvider'],
    authService: {
      register: vi.fn(),
      login: vi.fn(),
      refresh: vi.fn(),
      logout: vi.fn(),
      getMe: vi.fn(),
      promoteToVendor: vi.fn(),
    } as unknown as Container['authService'],
    productService: {
      list: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
      overrideInventory: vi.fn(),
    } as unknown as Container['productService'],
    categoryService: {
      list: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as Container['categoryService'],
    cartService: {
      getCart: vi.fn(),
      addItem: vi.fn(),
      updateItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    } as unknown as Container['cartService'],
    orderService: {
      checkout: vi.fn(),
      listForUser: vi.fn(),
      getById: vi.fn(),
      updateStatus: vi.fn(),
      listAll: vi.fn(),
    } as unknown as Container['orderService'],
    paymentService: {
      initialize: vi.fn(),
      handleWebhook: vi.fn(),
      verify: vi.fn(),
    } as unknown as Container['paymentService'],
    uploadService: {
      uploadImage: vi.fn(),
    } as unknown as Container['uploadService'],
    userRepo: {
      findBuyersPendingVendor: vi.fn(),
    } as unknown as Container['userRepo'],
    ...overrides,
  };
}
