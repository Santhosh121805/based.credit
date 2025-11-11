import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { TRPCError } from '@trpc/server';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
}

export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Custom error classes
export class ValidationError extends CustomError {
  constructor(message: string = 'Validation failed') {
    super(message, 400, true, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, true, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends CustomError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, true, 'FORBIDDEN');
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, true, 'NOT_FOUND');
  }
}

export class ConflictError extends CustomError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, true, 'CONFLICT');
  }
}

export class RateLimitError extends CustomError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, true, 'RATE_LIMIT_EXCEEDED');
  }
}

export class InternalServerError extends CustomError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, true, 'INTERNAL_SERVER_ERROR');
  }
}

export class Web3Error extends CustomError {
  constructor(message: string = 'Web3 operation failed') {
    super(message, 502, true, 'WEB3_ERROR');
  }
}

export class DatabaseError extends CustomError {
  constructor(message: string = 'Database operation failed') {
    super(message, 503, true, 'DATABASE_ERROR');
  }
}

// Error response interface
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    stack?: string;
    timestamp: string;
    path?: string;
    requestId?: string;
  };
}

// Format error response
const formatErrorResponse = (error: AppError, req: Request): ErrorResponse => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    error: {
      code: error.code || 'INTERNAL_SERVER_ERROR',
      message: error.message,
      details: isDevelopment ? error.stack : undefined,
      stack: isDevelopment ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      requestId: req.headers['x-request-id'] as string,
    },
  };
};

// Handle Zod validation errors
const handleZodError = (error: ZodError): ValidationError => {
  const messages = error.errors.map(err => {
    const path = err.path.join('.');
    return `${path}: ${err.message}`;
  });
  
  return new ValidationError(`Validation failed: ${messages.join(', ')}`);
};

// Handle tRPC errors
const handleTRPCError = (error: TRPCError): CustomError => {
  switch (error.code) {
    case 'BAD_REQUEST':
      return new ValidationError(error.message);
    case 'UNAUTHORIZED':
      return new UnauthorizedError(error.message);
    case 'FORBIDDEN':
      return new ForbiddenError(error.message);
    case 'NOT_FOUND':
      return new NotFoundError(error.message);
    case 'CONFLICT':
      return new ConflictError(error.message);
    case 'TOO_MANY_REQUESTS':
      return new RateLimitError(error.message);
    case 'INTERNAL_SERVER_ERROR':
    default:
      return new InternalServerError(error.message);
  }
};

// Handle Prisma errors
const handlePrismaError = (error: any): CustomError => {
  switch (error.code) {
    case 'P2002':
      return new ConflictError('Unique constraint failed');
    case 'P2025':
      return new NotFoundError('Record not found');
    case 'P2003':
      return new ValidationError('Foreign key constraint failed');
    case 'P2016':
      return new ValidationError('Query interpretation error');
    default:
      return new DatabaseError(`Database operation failed: ${error.message}`);
  }
};

// Handle Web3 errors
const handleWeb3Error = (error: any): CustomError => {
  if (error.code) {
    switch (error.code) {
      case 4001:
        return new ValidationError('User rejected the request');
      case 4100:
        return new UnauthorizedError('Unauthorized account');
      case 4200:
        return new ValidationError('Unsupported method');
      case -32000:
        return new Web3Error('Insufficient funds');
      case -32001:
        return new Web3Error('Resource not found');
      case -32002:
        return new Web3Error('Resource unavailable');
      case -32003:
        return new Web3Error('Transaction rejected');
      default:
        return new Web3Error(`Web3 error: ${error.message}`);
    }
  }
  
  return new Web3Error(error.message || 'Web3 operation failed');
};

// Main error handler
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error: CustomError;

  // Handle different error types
  if (err instanceof CustomError) {
    error = err;
  } else if (err instanceof ZodError) {
    error = handleZodError(err);
  } else if (err instanceof TRPCError) {
    error = handleTRPCError(err);
  } else if (err.code && err.code.startsWith('P')) {
    // Prisma error
    error = handlePrismaError(err);
  } else if (err.code && typeof err.code === 'number') {
    // Likely a Web3 error
    error = handleWeb3Error(err);
  } else {
    // Generic error
    error = new InternalServerError(
      process.env.NODE_ENV === 'production' 
        ? 'Something went wrong' 
        : err.message || 'Unknown error'
    );
  }

  // Log error
  if (error.statusCode >= 500) {
    logger.error('Server Error:', {
      error: error.message,
      stack: error.stack,
      statusCode: error.statusCode,
      path: req.originalUrl,
      method: req.method,
      requestId: req.headers['x-request-id'],
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
  } else {
    logger.warn('Client Error:', {
      error: error.message,
      statusCode: error.statusCode,
      path: req.originalUrl,
      method: req.method,
      requestId: req.headers['x-request-id'],
    });
  }

  // Send error response
  const response = formatErrorResponse(error, req);
  res.status(error.statusCode || 500).json(response);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Not found handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

export default errorHandler;