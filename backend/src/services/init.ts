import { logger } from '../utils/logger';
import { db } from '../db/client';
import { redis } from './redis';

// Service initialization status
interface ServiceStatus {
  database: boolean;
  redis: boolean;
  initialized: boolean;
}

let serviceStatus: ServiceStatus = {
  database: false,
  redis: false,
  initialized: false,
};

// Initialize database connection
async function initializeDatabase(): Promise<void> {
  try {
    // Test database connection
    await db.$queryRaw`SELECT 1`;
    
    // Generate Prisma client if needed
    logger.info('Database connection established');
    serviceStatus.database = true;
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw new Error('Database initialization failed');
  }
}

// Initialize Redis connection
async function initializeRedis(): Promise<void> {
  try {
    await redis.ping();
    logger.info('Redis connection established');
    serviceStatus.redis = true;
  } catch (error) {
    logger.error('Failed to initialize Redis:', error);
    throw new Error('Redis initialization failed');
  }
}

// Initialize all services
export async function initializeServices(): Promise<void> {
  try {
    logger.info('Initializing services...');
    
    // Initialize services in parallel
    await Promise.all([
      initializeDatabase(),
      initializeRedis(),
    ]);
    
    serviceStatus.initialized = true;
    logger.info('All services initialized successfully');
    
    // Log service status
    logger.info('Service Status:', serviceStatus);
  } catch (error) {
    logger.error('Service initialization failed:', error);
    throw error;
  }
}

// Get service status
export function getServiceStatus(): ServiceStatus {
  return { ...serviceStatus };
}

// Health check for services
export async function checkServiceHealth(): Promise<ServiceStatus> {
  const status: ServiceStatus = {
    database: false,
    redis: false,
    initialized: serviceStatus.initialized,
  };

  try {
    // Check database
    await db.$queryRaw`SELECT 1`;
    status.database = true;
  } catch (error) {
    logger.warn('Database health check failed:', error);
  }

  try {
    // Check Redis
    await redis.ping();
    status.redis = true;
  } catch (error) {
    logger.warn('Redis health check failed:', error);
  }

  return status;
}

// Graceful shutdown
export async function shutdownServices(): Promise<void> {
  logger.info('Shutting down services...');
  
  try {
    // Close database connection
    await db.$disconnect();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }

  try {
    // Close Redis connection
    await redis.quit();
    logger.info('Redis connection closed');
  } catch (error) {
    logger.error('Error closing Redis connection:', error);
  }

  serviceStatus.initialized = false;
  logger.info('Services shutdown complete');
}

export default initializeServices;