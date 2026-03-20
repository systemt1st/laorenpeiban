import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Custom application error with status code and error code.
 */
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Common application errors for convenience.
 */
export class NotFoundError extends AppError {
  constructor(message: string = '资源未找到') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = '请求参数错误') {
    super(message, 400, 'BAD_REQUEST');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = '未授权访问') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = '禁止访问') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = '资源冲突') {
    super(message, 409, 'CONFLICT');
  }
}

/**
 * Express error handling middleware.
 * Must be registered after all route handlers.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the error
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(`[${err.code}] ${err.message}`, {
        method: req.method,
        url: req.originalUrl,
        statusCode: err.statusCode,
        stack: err.stack,
      });
    } else {
      logger.warn(`[${err.code}] ${err.message}`, {
        method: req.method,
        url: req.originalUrl,
        statusCode: err.statusCode,
      });
    }
  } else {
    // Unknown / unexpected error
    logger.error(`Unhandled error: ${err.message}`, {
      method: req.method,
      url: req.originalUrl,
      stack: err.stack,
    });
  }

  // Build response
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const code = err instanceof AppError ? err.code : 'INTERNAL_ERROR';
  const message =
    err instanceof AppError && err.isOperational
      ? err.message
      : '服务器内部错误，请稍后重试';

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}

/**
 * Middleware to handle 404 routes that were not matched.
 */
export function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  next(new NotFoundError(`路径 ${req.originalUrl} 不存在`));
}
