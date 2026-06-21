import type { Request, Response, NextFunction } from 'express';
import type { AuthService } from '../services/AuthService.js';
import type { AuthUser, UserRole } from '../types/index.js';
import { UnauthorizedError, ForbiddenError } from '../utils/AppError.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function createAuthMiddleware(authService: AuthService) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return next(new UnauthorizedError());
    }
    try {
      req.user = authService.verifyAccessToken(header.slice(7));
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function optionalAuth(authService: AuthService) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      try {
        req.user = authService.verifyAccessToken(header.slice(7));
      } catch {
        // ignore invalid token for optional auth
      }
    }
    next();
  };
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!roles.includes(req.user.role)) return next(new ForbiddenError());
    next();
  };
}

export const REFRESH_COOKIE = 'refreshToken';

export function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearRefreshCookie(res: Response) {
  res.cookie(REFRESH_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth',
    maxAge: 0,
  });
}
