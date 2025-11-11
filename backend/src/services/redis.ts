import Redis from 'ioredis';
import { logger } from '../utils/logger';

// Redis configuration
const redisConfig: any = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  commandTimeout: 5000,
  connectTimeout: 10000,
};

// Add password only if provided
if (process.env.REDIS_PASSWORD) {
  redisConfig.password = process.env.REDIS_PASSWORD;
}

// Create Redis instance
export const redis = new Redis(redisConfig);

// Redis event handlers
redis.on('connect', () => {
  logger.info('Redis connection established');
});

redis.on('ready', () => {
  logger.info('Redis is ready to receive commands');
});

redis.on('error', (error) => {
  logger.error('Redis connection error:', error);
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

redis.on('reconnecting', (ms: number) => {
  logger.info(`Redis reconnecting in ${ms}ms`);
});

// Cache utilities
export class CacheService {
  private static readonly CACHE_TTL = {
    SHORT: 60, // 1 minute
    MEDIUM: 300, // 5 minutes
    LONG: 1800, // 30 minutes
    HOUR: 3600, // 1 hour
    DAY: 86400, // 24 hours
  };

  // Get cache key with prefix
  private static getKey(key: string): string {
    return `trustai:${process.env.NODE_ENV || 'dev'}:${key}`;
  }

  // Set cache with TTL
  static async set(key: string, value: any, ttl: number = this.CACHE_TTL.MEDIUM): Promise<void> {
    try {
      const cacheKey = this.getKey(key);
      const serializedValue = JSON.stringify(value);
      await redis.setex(cacheKey, ttl, serializedValue);
      logger.debug(`Cache set: ${cacheKey} (TTL: ${ttl}s)`);
    } catch (error) {
      logger.error('Cache set error:', error);
      throw error;
    }
  }

  // Get cache value
  static async get<T>(key: string): Promise<T | null> {
    try {
      const cacheKey = this.getKey(key);
      const value = await redis.get(cacheKey);
      
      if (value === null) {
        logger.debug(`Cache miss: ${cacheKey}`);
        return null;
      }

      logger.debug(`Cache hit: ${cacheKey}`);
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null; // Return null on error to prevent breaking the application
    }
  }

  // Delete cache key
  static async del(key: string): Promise<void> {
    try {
      const cacheKey = this.getKey(key);
      await redis.del(cacheKey);
      logger.debug(`Cache deleted: ${cacheKey}`);
    } catch (error) {
      logger.error('Cache delete error:', error);
      throw error;
    }
  }

  // Check if key exists
  static async exists(key: string): Promise<boolean> {
    try {
      const cacheKey = this.getKey(key);
      const exists = await redis.exists(cacheKey);
      return exists === 1;
    } catch (error) {
      logger.error('Cache exists check error:', error);
      return false;
    }
  }

  // Set cache with hash
  static async hset(key: string, field: string, value: any, ttl: number = this.CACHE_TTL.MEDIUM): Promise<void> {
    try {
      const cacheKey = this.getKey(key);
      const serializedValue = JSON.stringify(value);
      await redis.hset(cacheKey, field, serializedValue);
      await redis.expire(cacheKey, ttl);
      logger.debug(`Hash cache set: ${cacheKey}:${field} (TTL: ${ttl}s)`);
    } catch (error) {
      logger.error('Hash cache set error:', error);
      throw error;
    }
  }

  // Get cache value from hash
  static async hget<T>(key: string, field: string): Promise<T | null> {
    try {
      const cacheKey = this.getKey(key);
      const value = await redis.hget(cacheKey, field);
      
      if (value === null) {
        logger.debug(`Hash cache miss: ${cacheKey}:${field}`);
        return null;
      }

      logger.debug(`Hash cache hit: ${cacheKey}:${field}`);
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Hash cache get error:', error);
      return null;
    }
  }

  // Increment counter
  static async incr(key: string, ttl: number = this.CACHE_TTL.HOUR): Promise<number> {
    try {
      const cacheKey = this.getKey(key);
      const result = await redis.incr(cacheKey);
      
      if (result === 1) {
        // Set TTL only when creating the key
        await redis.expire(cacheKey, ttl);
      }
      
      return result;
    } catch (error) {
      logger.error('Cache increment error:', error);
      throw error;
    }
  }

  // Get TTL values
  static get TTL() {
    return this.CACHE_TTL;
  }
}

// Session management
export class SessionService {
  private static SESSION_PREFIX = 'session';
  private static SESSION_TTL = 24 * 60 * 60; // 24 hours

  static async create(sessionId: string, data: any): Promise<void> {
    await CacheService.set(`${this.SESSION_PREFIX}:${sessionId}`, data, this.SESSION_TTL);
  }

  static async get(sessionId: string): Promise<any | null> {
    return await CacheService.get(`${this.SESSION_PREFIX}:${sessionId}`);
  }

  static async update(sessionId: string, data: any): Promise<void> {
    await CacheService.set(`${this.SESSION_PREFIX}:${sessionId}`, data, this.SESSION_TTL);
  }

  static async destroy(sessionId: string): Promise<void> {
    await CacheService.del(`${this.SESSION_PREFIX}:${sessionId}`);
  }

  static async exists(sessionId: string): Promise<boolean> {
    return await CacheService.exists(`${this.SESSION_PREFIX}:${sessionId}`);
  }
}

// Rate limiting service
export class RateLimitService {
  private static RATE_LIMIT_PREFIX = 'rate_limit';

  static async checkLimit(identifier: string, windowMs: number, maxRequests: number): Promise<{ allowed: boolean; remainingRequests: number; resetTime: number }> {
    const key = `${this.RATE_LIMIT_PREFIX}:${identifier}`;
    const window = Math.floor(Date.now() / windowMs);
    const windowKey = `${key}:${window}`;

    const current = await CacheService.incr(windowKey, Math.ceil(windowMs / 1000));
    const resetTime = (window + 1) * windowMs;

    return {
      allowed: current <= maxRequests,
      remainingRequests: Math.max(0, maxRequests - current),
      resetTime,
    };
  }
}

export default redis;