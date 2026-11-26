import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
    requestId: res.locals.requestId ?? null,
  });
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const requestId = (res.locals.requestId as string | undefined) ?? null;

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
      requestId,
    });
    return;
  }

  logger.error('Unhandled server error', {
    requestId,
    method: req.method,
    path: req.originalUrl,
    message: err.message,
    stack: env.nodeEnv === 'development' ? err.stack : undefined,
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: env.nodeEnv === 'production' ? 'An unexpected error occurred' : err.message,
    },
    requestId,
  });
}
