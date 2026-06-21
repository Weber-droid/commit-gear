import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAuthController } from '../../src/controllers/auth.controller.js';
import { REFRESH_COOKIE } from '../../src/middleware/auth.js';
import { createMockContainer } from '../helpers/container.js';
import { createMockReq, createMockRes, createMockNext, expectSuccess } from '../helpers/http.js';

describe('AuthController', () => {
  const container = createMockContainer();
  const controller = createAuthController(container);
  const { authService } = container;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('registers user, sets refresh cookie, and returns 201', async () => {
      const req = createMockReq({
        body: { name: 'Jane', email: 'jane@example.com', password: 'Pass123!' },
      });
      const res = createMockRes();
      const next = createMockNext();
      const result = {
        user: { id: 'u1', name: 'Jane', email: 'jane@example.com', role: 'buyer' },
        tokens: { accessToken: 'access', expiresIn: 900 },
        refreshToken: 'refresh-token',
      };
      vi.mocked(authService.register).mockResolvedValue(result as never);

      await controller.register(req, res, next);

      expect(authService.register).toHaveBeenCalledWith('Jane', 'jane@example.com', 'Pass123!');
      expect(res.cookie).toHaveBeenCalledWith(
        REFRESH_COOKIE,
        'refresh-token',
        expect.objectContaining({ httpOnly: true, path: '/api/v1/auth' })
      );
      expectSuccess(res, { user: result.user, tokens: result.tokens }, 201);
      expect(next).not.toHaveBeenCalled();
    });

    it('forwards errors to next', async () => {
      const error = new Error('Email taken');
      vi.mocked(authService.register).mockRejectedValue(error);
      const next = createMockNext();

      await controller.register(createMockReq({ body: {} }), createMockRes(), next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('login', () => {
    it('logs in user and sets refresh cookie', async () => {
      const req = createMockReq({ body: { email: 'jane@example.com', password: 'Pass123!' } });
      const res = createMockRes();
      const next = createMockNext();
      const result = {
        user: { id: 'u1', email: 'jane@example.com', role: 'buyer' },
        tokens: { accessToken: 'access', expiresIn: 900 },
        refreshToken: 'refresh-token',
      };
      vi.mocked(authService.login).mockResolvedValue(result as never);

      await controller.login(req, res, next);

      expect(authService.login).toHaveBeenCalledWith('jane@example.com', 'Pass123!');
      expect(res.cookie).toHaveBeenCalledWith(REFRESH_COOKIE, 'refresh-token', expect.any(Object));
      expectSuccess(res, { user: result.user, tokens: result.tokens });
    });
  });

  describe('refresh', () => {
    it('returns new tokens when refresh cookie is present', async () => {
      const req = createMockReq({ cookies: { [REFRESH_COOKIE]: 'old-refresh' } });
      const res = createMockRes();
      const next = createMockNext();
      const result = {
        tokens: { accessToken: 'new-access', expiresIn: 900 },
        refreshToken: 'new-refresh',
      };
      vi.mocked(authService.refresh).mockResolvedValue(result as never);

      await controller.refresh(req, res, next);

      expect(authService.refresh).toHaveBeenCalledWith('old-refresh');
      expectSuccess(res, result.tokens);
    });

    it('returns unauthorized when refresh cookie is missing', async () => {
      const next = createMockNext();

      await controller.refresh(createMockReq({ cookies: {} }), createMockRes(), next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401, code: 'REFRESH_TOKEN_INVALID' })
      );
      expect(authService.refresh).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('clears session and refresh cookie', async () => {
      const req = createMockReq({
        user: { id: 'user-1', role: 'buyer' },
        cookies: { [REFRESH_COOKIE]: 'refresh-token' },
      });
      const res = createMockRes();
      const next = createMockNext();
      vi.mocked(authService.logout).mockResolvedValue(undefined);

      await controller.logout(req, res, next);

      expect(authService.logout).toHaveBeenCalledWith('user-1', 'refresh-token');
      expect(res.cookie).toHaveBeenCalledWith(REFRESH_COOKIE, '', expect.objectContaining({ maxAge: 0 }));
      expectSuccess(res, { message: 'Logged out successfully' });
    });
  });

  describe('me', () => {
    it('returns current user profile', async () => {
      const user = { id: 'user-1', name: 'Jane', email: 'jane@example.com', role: 'buyer' };
      vi.mocked(authService.getMe).mockResolvedValue(user as never);
      const res = createMockRes();

      await controller.me(createMockReq(), res, createMockNext());

      expect(authService.getMe).toHaveBeenCalledWith('user-1');
      expectSuccess(res, user);
    });
  });
});
