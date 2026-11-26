import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthTokenPayload } from '../types/auth.types';

export function signAccessToken(payload: AuthTokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.jwt.accessExpiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.jwt.accessSecret, options);
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.jwt.accessSecret) as AuthTokenPayload;
}

export function signRefreshToken(payload: AuthTokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.jwt.refreshExpiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.jwt.refreshSecret, options);
}

export function verifyRefreshToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.jwt.refreshSecret) as AuthTokenPayload;
}

export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}
