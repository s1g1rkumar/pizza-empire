import { NextFunction, Request, Response } from 'express';
import { AuthTokenPayload, UserRole } from '../types/auth.types';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';
import { verifyAccessToken } from '../utils/jwt';

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export function authenticateJWT(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new UnauthorizedError('Missing or invalid Authorization header'));
    return;
  }

  const token = authHeader.slice(7).trim();
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired access token'));
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ForbiddenError('You do not have permission to access this resource'));
      return;
    }

    next();
  };
}
