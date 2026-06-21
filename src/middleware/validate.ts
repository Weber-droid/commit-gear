import type { RequestHandler } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '../utils/AppError.js';

type Source = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, source: Source = 'body'): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new ValidationError('Validation failed', { fields: details }));
    }
    req[source] = result.data;
    next();
  };
}
