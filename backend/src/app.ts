import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import router from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

export const createApp = (): Application => {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    })
  );

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Rate limiting (more generous for development)
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute (was 15 minutes)
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'), // 1000 requests per window (was 100)
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: req => {
      // Skip rate limiting in development
      return process.env.NODE_ENV === 'development';
    },
  });

  // Only apply rate limiting in production
  if (process.env.NODE_ENV !== 'development') {
    app.use('/api/', limiter);
  }

  // Request logging
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    next();
  });

  // API routes
  app.use('/api', router);

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      name: 'Lynq Backend API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        health: '/api/health',
        user: '/api/user',
        loan: '/api/loan',
        screening: '/api/screening',
        treasury: '/api/treasury',
        history: '/api/history',
      },
    });
  });

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
