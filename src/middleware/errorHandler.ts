import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode } from '../types/app.types';
import { logger } from '../utils/logger';
import { serverConfig } from '../config/snag.config';

/**
 * Global error handling middleware
 */
export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error
  logger.error('Request error', {
    path: req.path,
    method: req.method,
    error: error.message,
    stack: error.stack,
  });

  // Determine if it's an AppError or generic Error
  if (error instanceof AppError) {
    const response = {
      error: {
        code: error.code,
        message: error.message,
        ...(serverConfig.nodeEnv === 'development' && { details: error.details }),
      },
    };

    res.status(error.statusCode).json(response);
    return;
  }

  // Handle generic errors
  const statusCode = 500;
  const response = {
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: error.message || 'An unexpected error occurred',
      ...(serverConfig.nodeEnv === 'development' && { stack: error.stack }),
    },
  };

  res.status(statusCode).json(response);
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}
