import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import { Context } from './context';
import { CacheService } from '../services/redis';

// Initialize tRPC
const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        code: error.code,
        httpStatus: error.code === 'INTERNAL_SERVER_ERROR' ? 500 : 400,
      },
    };
  },
});

// Base router and procedures
export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware for authentication
const isAuthenticated = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // Now user is guaranteed to exist
    },
  });
});

// Middleware for admin role
const isAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== 'ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// Middleware for verified wallets
const isVerified = t.middleware(({ ctx, next }) => {
  if (!ctx.user || !ctx.user.isVerified) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Wallet verification required',
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// Protected procedures
export const protectedProcedure = publicProcedure.use(isAuthenticated);
export const adminProcedure = publicProcedure.use(isAuthenticated).use(isAdmin);
export const verifiedProcedure = publicProcedure.use(isAuthenticated).use(isVerified);

// Health check procedure
const healthRouter = router({
  check: publicProcedure.query(async ({ ctx }) => {
    try {
      // Check database
      await ctx.db.$queryRaw`SELECT 1`;
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected',
          redis: 'connected',
        },
      };
    } catch (error) {
      ctx.logger.error('Health check failed:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Service unhealthy',
      });
    }
  }),
});

// Authentication router
const authRouter = router({
  // Get authentication challenge (nonce)
  getChallenge: publicProcedure
    .input(z.object({
      walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
    }))
    .mutation(async ({ input, ctx }) => {
      const { walletAddress } = input;
      const nonce = Math.random().toString(36).substring(2, 15);
      
      // Store nonce in cache for verification
      await CacheService.set(`auth:nonce:${walletAddress}`, nonce, 300); // 5 minutes
      
      ctx.logger.info('Authentication challenge generated', { walletAddress });
      
      return {
        nonce,
        message: `Sign this message to authenticate with Trust AI Weave.\n\nNonce: ${nonce}`,
      };
    }),

  // Verify wallet signature and authenticate
  verifySignature: publicProcedure
    .input(z.object({
      walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
      signature: z.string().min(1, 'Signature required'),
      message: z.string().min(1, 'Message required'),
    }))
    .mutation(async ({ input, ctx }) => {
      // Implementation will be added later
      throw new TRPCError({
        code: 'NOT_IMPLEMENTED',
        message: 'Authentication verification not implemented yet',
      });
    }),

  // Get current user
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        id: true,
        walletAddress: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        status: true,
        createdAt: true,
        lastActiveAt: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    return user;
  }),
});

// Credit score router
const creditRouter = router({
  // Get credit score for a wallet
  getScore: publicProcedure
    .input(z.object({
      walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
    }))
    .query(async ({ input, ctx }) => {
      // Implementation placeholder
      throw new TRPCError({
        code: 'NOT_IMPLEMENTED',
        message: 'Credit score retrieval not implemented yet',
      });
    }),

  // Calculate new credit score
  calculate: verifiedProcedure
    .input(z.object({
      walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address').optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Implementation placeholder
      throw new TRPCError({
        code: 'NOT_IMPLEMENTED',
        message: 'Credit score calculation not implemented yet',
      });
    }),
});

// Wallet router
const walletRouter = router({
  // Get wallet analytics
  getAnalytics: protectedProcedure
    .input(z.object({
      walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address').optional(),
      timeframe: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
    }))
    .query(async ({ input, ctx }) => {
      // Implementation placeholder
      throw new TRPCError({
        code: 'NOT_IMPLEMENTED',
        message: 'Wallet analytics not implemented yet',
      });
    }),

  // Verify wallet ownership
  verifyOwnership: protectedProcedure
    .input(z.object({
      walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
      signature: z.string().min(1, 'Signature required'),
      message: z.string().min(1, 'Message required'),
    }))
    .mutation(async ({ input, ctx }) => {
      // Implementation placeholder
      throw new TRPCError({
        code: 'NOT_IMPLEMENTED',
        message: 'Wallet verification not implemented yet',
      });
    }),
});

// Loan router
const loanRouter = router({
  // Apply for a loan
  apply: verifiedProcedure
    .input(z.object({
      amount: z.number().positive('Loan amount must be positive'),
      collateralType: z.string().min(1, 'Collateral type required'),
      collateralAmount: z.number().positive('Collateral amount must be positive'),
      purpose: z.string().min(1, 'Loan purpose required'),
      termDays: z.number().int().positive('Term must be positive'),
    }))
    .mutation(async ({ input, ctx }) => {
      // Implementation placeholder
      throw new TRPCError({
        code: 'NOT_IMPLEMENTED',
        message: 'Loan application not implemented yet',
      });
    }),

  // Get loan applications
  getApplications: protectedProcedure.query(async ({ ctx }) => {
    // Implementation placeholder
    throw new TRPCError({
      code: 'NOT_IMPLEMENTED',
      message: 'Loan applications retrieval not implemented yet',
    });
  }),

  // Get loan by ID
  getById: protectedProcedure
    .input(z.object({
      id: z.string().uuid('Invalid loan ID'),
    }))
    .query(async ({ input, ctx }) => {
      // Implementation placeholder
      throw new TRPCError({
        code: 'NOT_IMPLEMENTED',
        message: 'Loan retrieval not implemented yet',
      });
    }),
});

// Admin router
const adminRouter = router({
  // Get system statistics
  getStats: adminProcedure.query(async ({ ctx }) => {
    // Implementation placeholder
    throw new TRPCError({
      code: 'NOT_IMPLEMENTED',
      message: 'Admin statistics not implemented yet',
    });
  }),

  // Manage users
  users: router({
    list: adminProcedure
      .input(z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(20),
      }))
      .query(async ({ input, ctx }) => {
        // Implementation placeholder
        throw new TRPCError({
          code: 'NOT_IMPLEMENTED',
          message: 'User management not implemented yet',
        });
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.string().uuid('Invalid user ID'),
        data: z.object({
          status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED']).optional(),
          role: z.enum(['USER', 'ADMIN']).optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        // Implementation placeholder
        throw new TRPCError({
          code: 'NOT_IMPLEMENTED',
          message: 'User update not implemented yet',
        });
      }),
  }),
});

// Main app router
export const appRouter = router({
  health: healthRouter,
  auth: authRouter,
  credit: creditRouter,
  wallet: walletRouter,
  loan: loanRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;