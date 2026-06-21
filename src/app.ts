import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import type { Container } from './container.js';
import { corsOrigins, env } from './config/env.js';
import { createApiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export function createApp(container: Container) {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-paystack-signature'],
    })
  );

  app.use('/api/v1/payments/webhook/paystack', express.raw({ type: 'application/json' }));

  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(mongoSanitize());

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  });

  const catalogLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api/v1/auth', authLimiter);
  app.use(['/api/v1/products', '/api/v1/categories'], catalogLimiter);

  app.get('/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok', env: env.NODE_ENV } });
  });

  app.use('/api/v1', createApiRouter(container));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
