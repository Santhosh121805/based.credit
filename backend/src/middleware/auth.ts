import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyMessage } from 'viem';
import { SiweMessage } from 'siwe';
import { db } from '../db/client';
import { RateLimitService } from '../services/redis';
import { logger } from '../utils/logger';
import { UnauthorizedError, ForbiddenError } from './errorHandler';
import { CacheService } from '../services/redis';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        walletAddress: string;
        role: string;
        isVerified: boolean;
      };
      walletAddress?: string;
    }
  }
}

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Generate JWT token
export const generateToken = (payload: any): string => {
  const options: jwt.SignOptions = {
    expiresIn: JWT_EXPIRES_IN as string,
    issuer: 'trust-ai-weave',
    audience: 'trust-ai-weave-users',
  };
  return jwt.sign(payload, JWT_SECRET, options);
};

// Verify JWT token
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'trust-ai-weave',
      audience: 'trust-ai-weave-users',
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid token');
    }
    throw new UnauthorizedError('Token verification failed');
  }
};

// Verify wallet signature (SIWE - Sign-In with Ethereum)
export const verifyWalletSignature = async (
  message: string,
  signature: string,
  address: string
): Promise<boolean> => {
  try {
    // Parse SIWE message
    const siweMessage = new SiweMessage(message);
    
    // Verify the message format
    await siweMessage.verify({
      signature,
      domain: process.env.DOMAIN || 'localhost:8000',
      nonce: siweMessage.nonce,
    });

    // Additional verification using viem
    const isValid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });

    return isValid && siweMessage.address.toLowerCase() === address.toLowerCase();
  } catch (error) {
    logger.error('Wallet signature verification failed:', error);
    return false;
  }
};

// Extract wallet address from various sources
export const extractWalletAddress = (req: Request): string | null => {
  // Check headers
  const walletFromHeader = req.headers['x-wallet-address'] as string;
  if (walletFromHeader) {
    return walletFromHeader.toLowerCase();
  }

  // Check JWT payload if available
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);
      return payload.walletAddress?.toLowerCase() || null;
    } catch {
      // Token verification failed, continue to other methods
    }
  }

  // Check query parameters
  const walletFromQuery = req.query.wallet as string;
  if (walletFromQuery) {
    return walletFromQuery.toLowerCase();
  }

  return null;
};

// Authentication middleware
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      // For non-authenticated routes, try to extract wallet address
      const walletAddress = extractWalletAddress(req);
      if (walletAddress) {
        req.walletAddress = walletAddress;
      }
      return next();
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Invalid authorization header format');
    }

    const token = authHeader.substring(7);
    
    // Check if token is blacklisted (optional)
    const isBlacklisted = await CacheService.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new UnauthorizedError('Token has been revoked');
    }

    // Verify token
    const payload = verifyToken(token);
    
    // Get user from database
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        walletAddress: true,
        isVerified: true,
        role: true,
        status: true,
        lastActiveAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenError('User account is not active');
    }

    // Update last active timestamp (async, don't wait)
    db.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    }).catch((error: any) => {
      logger.warn('Failed to update last active timestamp:', error);
    });

    // Attach user to request
    req.user = {
      id: user.id,
      walletAddress: user.walletAddress,
      role: user.role,
      isVerified: user.isVerified,
    };
    req.walletAddress = user.walletAddress;

    next();
  } catch (error) {
    next(error);
  }
};

// Require authentication middleware
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }
  next();
};

// Require specific roles
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }

    next();
  };
};

// Require wallet verification
export const requireVerifiedWallet = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  if (!req.user.isVerified) {
    throw new ForbiddenError('Wallet verification required');
  }

  next();
};

// Rate limiting by wallet address
export const walletRateLimit = (windowMs: number, maxRequests: number) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const walletAddress = req.walletAddress || req.user?.walletAddress;
      
      if (!walletAddress) {
        // If no wallet address, use IP address for rate limiting
        const identifier = req.ip || 'unknown';
        const { allowed } = await RateLimitService.checkLimit(
          `ip:${identifier}`,
          windowMs,
          maxRequests
        );
        
        if (!allowed) {
          throw new ForbiddenError('Rate limit exceeded');
        }
      } else {
        const { allowed, remainingRequests, resetTime } = await RateLimitService.checkLimit(
          `wallet:${walletAddress}`,
          windowMs,
          maxRequests
        );
        
        // Add rate limit headers
        res.set({
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': remainingRequests.toString(),
          'X-RateLimit-Reset': new Date(resetTime).toISOString(),
        });
        
        if (!allowed) {
          throw new ForbiddenError('Rate limit exceeded for wallet');
        }
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Optional authentication (doesn't fail if not authenticated)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await authMiddleware(req, res, () => {});
    next();
  } catch {
    // Authentication failed, but that's okay for optional auth
    const walletAddress = extractWalletAddress(req);
    if (walletAddress) {
      req.walletAddress = walletAddress;
    }
    next();
  }
};

export default authMiddleware;