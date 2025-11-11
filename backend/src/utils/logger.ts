import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Define log format for console
const consoleFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'HH:mm:ss',
  }),
  winston.format.colorize(),
  winston.format.simple(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} ${level}: ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
    }`;
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  format: logFormat,
  defaultMeta: {
    service: 'trust-ai-weave-backend',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: isProduction ? logFormat : consoleFormat,
    }),
    
    // File transports for production
    ...(isProduction ? [
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
    ] : []),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
});

// Add request ID to logs when available
export const addRequestId = (requestId: string) => {
  return logger.child({ requestId });
};

// Performance logging helper
export const performanceLogger = {
  start: (operation: string) => {
    const start = Date.now();
    return {
      end: (metadata?: Record<string, any>) => {
        const duration = Date.now() - start;
        logger.info(`Performance: ${operation}`, {
          duration: `${duration}ms`,
          operation,
          ...metadata,
        });
      },
    };
  },
};

// Database query logger
export const dbLogger = {
  query: (query: string, duration: number, params?: any[]) => {
    logger.debug('Database query executed', {
      query,
      duration: `${duration}ms`,
      params: params?.length ? params : undefined,
    });
  },
  error: (query: string, error: Error, params?: any[]) => {
    logger.error('Database query failed', {
      query,
      error: error.message,
      stack: error.stack,
      params: params?.length ? params : undefined,
    });
  },
};

// Web3 transaction logger
export const web3Logger = {
  transaction: (txHash: string, status: 'pending' | 'confirmed' | 'failed', metadata?: Record<string, any>) => {
    logger.info(`Web3 transaction ${status}`, {
      txHash,
      status,
      ...metadata,
    });
  },
  walletConnection: (address: string, chainId: number) => {
    logger.info('Wallet connected', {
      address,
      chainId,
    });
  },
  error: (operation: string, error: Error, metadata?: Record<string, any>) => {
    logger.error(`Web3 operation failed: ${operation}`, {
      error: error.message,
      stack: error.stack,
      ...metadata,
    });
  },
};

export default logger;