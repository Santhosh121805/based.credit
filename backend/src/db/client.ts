import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

declare global {
  var __prisma: PrismaClient | undefined;
}

const createPrismaClient = () => {
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL!,
      },
    },
  });

  // Add middleware for logging slow queries
  prisma.$use(async (params: any, next: any) => {
    const start = Date.now();
    const result = await next(params);
    const end = Date.now();
    
    if (end - start > 1000) { // Log queries that take more than 1 second
      logger.warn(`Slow query detected: ${params.model}.${params.action} took ${end - start}ms`);
    }
    
    return result;
  });

  return prisma;
};

// Use global variable in development to prevent multiple instances
export const db = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = db;
}

// Graceful shutdown handler for Prisma
process.on('beforeExit', async () => {
  await db.$disconnect();
});