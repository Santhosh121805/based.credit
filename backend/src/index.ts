import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import * as Sentry from '@sentry/node';
import dotenv from 'dotenv';

import { appRouter } from './api/router';
import { createTRPCContext } from './api/context';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { db } from './db/client';
import { redis } from './services/redis';
import { initializeServices } from './services/init';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 8000;
const NODE_ENV = process.env.NODE_ENV || 'development';

async function createServer() {
  const app = express();

  // Initialize Sentry for error tracking
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: NODE_ENV,
      tracesSampleRate: NODE_ENV === 'production' ? 0.1 : 1.0,
    });
    app.use(Sentry.Handlers.requestHandler());
  }

  // Security middleware
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "wss:", "https:"],
      },
    },
  }));

  // CORS configuration
  app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:8080'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-wallet-address'],
  }));

  // Compression middleware
  app.use(compression());

  // Logging middleware
  if (NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // Rate limiting
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoint
  app.get('/health', async (req, res) => {
    try {
      // Check database connection
      await db.$queryRaw`SELECT 1`;
      
      // Check Redis connection
      await redis.ping();
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version,
        environment: NODE_ENV,
        services: {
          database: 'connected',
          redis: 'connected',
        },
      });
    } catch (error) {
      logger.error('Health check failed:', error);
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Service unavailable',
      });
    }
  });

  // API documentation endpoint
  app.get('/api/docs', (req, res) => {
    res.json({
      name: 'Trust AI Weave API',
      version: '1.0.0',
      description: 'AI-driven Web3 credit scoring platform API',
      endpoints: {
        trpc: '/api/trpc',
        health: '/health',
        metrics: '/metrics',
      },
      documentation: 'https://docs.trustaiweave.com',
      support: 'https://discord.gg/trustaiweave',
    });
  });

  // tRPC middleware
  app.use('/api/trpc', 
    authMiddleware, // Apply authentication middleware to tRPC routes
    createExpressMiddleware({
      router: appRouter,
      createContext: createTRPCContext,
      onError: ({ path, error }) => {
        logger.error(`❌ tRPC failed on ${path ?? '<no-path>'}:`, error);
      },
    })
  );

  // REST API routes (for non-tRPC endpoints)
  app.use('/api/webhook', require('./api/webhooks'));
  app.use('/api/upload', require('./api/upload'));

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: 'The requested endpoint does not exist',
      path: req.originalUrl,
    });
  });

  // Error handling middleware
  if (process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.errorHandler());
  }
  app.use(errorHandler);

  return app;
}

async function startServer() {
  try {
    // Initialize services
    await initializeServices();
    
    const app = await createServer();

    const server = app.listen(PORT, () => {
      logger.info(`🚀 Trust AI Weave Backend Server running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔗 tRPC API: http://localhost:${PORT}/api/trpc`);
      logger.info(`📚 API Docs: http://localhost:${PORT}/api/docs`);
      logger.info(`🌍 Environment: ${NODE_ENV}`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`);
      server.close(async () => {
        logger.info('HTTP server closed');
        
        // Close database connections
        await db.$disconnect();
        logger.info('Database disconnected');
        
        // Close Redis connection
        await redis.quit();
        logger.info('Redis disconnected');
        
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer();
}

export { createServer, startServer };