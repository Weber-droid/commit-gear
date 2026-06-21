import type { Request, Response, NextFunction } from 'express';
import type { Container } from '../container.js';
import { UnauthorizedError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';
import {
  setRefreshCookie,
  clearRefreshCookie,
  REFRESH_COOKIE,
} from '../middleware/auth.js';

export function createAuthController(container: Container) {
  const { authService } = container;

  return {
    register: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await authService.register(req.body.name, req.body.email, req.body.password);
        setRefreshCookie(res, result.refreshToken);
        sendSuccess(res, { user: result.user, tokens: result.tokens }, 201);
      } catch (e) {
        next(e);
      }
    },

    login: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await authService.login(req.body.email, req.body.password);
        setRefreshCookie(res, result.refreshToken);
        sendSuccess(res, { user: result.user, tokens: result.tokens });
      } catch (e) {
        next(e);
      }
    },

    refresh: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const token = req.cookies?.[REFRESH_COOKIE];
        if (!token) {
          return next(new UnauthorizedError('Refresh token invalid or expired', 'REFRESH_TOKEN_INVALID'));
        }
        const result = await authService.refresh(token);
        setRefreshCookie(res, result.refreshToken);
        sendSuccess(res, result.tokens);
      } catch (e) {
        next(e);
      }
    },

    logout: async (req: Request, res: Response, next: NextFunction) => {
      try {
        await authService.logout(req.user!.id, req.cookies?.[REFRESH_COOKIE]);
        clearRefreshCookie(res);
        sendSuccess(res, { message: 'Logged out successfully' });
      } catch (e) {
        next(e);
      }
    },

    me: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = await authService.getMe(req.user!.id);
        sendSuccess(res, user);
      } catch (e) {
        next(e);
      }
    },
  };
}
