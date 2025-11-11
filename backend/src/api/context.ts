import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { db } from '../db/client';
import { verifyToken, extractWalletAddress } from '../middleware/auth';
import { logger } from '../utils/logger';

// Create context for tRPC
export async function createTRPCContext({ req, res }: CreateExpressContextOptions) {
  // Extract user information from request
  let user: {
    id: string;
    walletAddress: string;
    role: string;
    isVerified: boolean;
  } | null = null;

  let walletAddress: string | null = null;

  try {
    // Try to get user from JWT token
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);
      
      // Get user from database
      const dbUser = await db.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          walletAddress: true,
          isVerified: true,
          role: true,
          status: true,
        },
      });

      if (dbUser && dbUser.status === 'ACTIVE') {
        user = {
          id: dbUser.id,
          walletAddress: dbUser.walletAddress,
          role: dbUser.role,
          isVerified: dbUser.isVerified,
        };
        walletAddress = dbUser.walletAddress;
      }
    } else {
      // Try to extract wallet address from other sources
      walletAddress = extractWalletAddress(req);
    }
  } catch (error) {
    // Authentication failed, but context should still be created
    logger.debug('Authentication failed in tRPC context:', error);
    walletAddress = extractWalletAddress(req);
  }

  return {
    req,
    res,
    db,
    user,
    walletAddress,
    logger: logger.child({
      requestId: req.headers['x-request-id'] || 'unknown',
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    }),
  };
}

export type Context = inferAsyncReturnType<typeof createTRPCContext>;