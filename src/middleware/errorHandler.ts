import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error('Operational error flagged non-operational', { stack: err.stack });
    } else if (err.statusCode >= 500) {
      logger.error(err.message, { stack: err.stack, code: err.code });
    } else {
      logger.warn(err.message, { code: err.code, details: err.details });
    }

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: {
        code: err.code,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  logger.error('Unhandled error', { stack: err.stack, message: err.message });
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: { code: 'INTERNAL_ERROR' },
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: { code: 'NOT_FOUND' },
  });
}
