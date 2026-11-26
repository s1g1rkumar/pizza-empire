import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.header('x-request-id') ?? crypto.randomUUID();
  const startTime = Date.now();

  res.setHeader('x-request-id', requestId);
  res.locals.requestId = requestId;

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    logger.info('HTTP Request', {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
    });
  });

  next();
}
