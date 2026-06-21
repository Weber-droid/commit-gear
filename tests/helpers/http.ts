import { vi, expect } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import type { AuthUser } from '../../src/types/index.js';

export function createMockReq(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    query: {},
    params: {},
    cookies: {},
    headers: {},
    user: { id: 'user-1', role: 'buyer' } as AuthUser,
    ...overrides,
  } as Request;
}

export function createMockRes() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
    cookie: vi.fn(),
  };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  res.cookie.mockReturnValue(res);
  return res as unknown as Response & typeof res;
}

export function createMockNext() {
  return vi.fn() as NextFunction;
}

export function expectSuccess(
  res: ReturnType<typeof createMockRes>,
  data: unknown,
  statusCode = 200,
  meta?: unknown
) {
  expect(res.status).toHaveBeenCalledWith(statusCode);
  expect(res.json).toHaveBeenCalledWith({
    success: true,
    data,
    ...(meta ? { meta } : {}),
  });
}
