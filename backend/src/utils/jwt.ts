import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

// Our own token payload. Named AuthTokenPayload to avoid colliding with
// jsonwebtoken's built-in JwtPayload type.
export interface AuthTokenPayload {
  sub: number; // user id
  email: string;
  role: string;
}

// Backwards-compatible alias used across the codebase
export type JwtPayload = AuthTokenPayload;

export function signAccessToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpires,
  } as SignOptions);
}

export function signRefreshToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpires,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.jwt.accessSecret) as unknown as AuthTokenPayload;
}

export function verifyRefreshToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.jwt.refreshSecret) as unknown as AuthTokenPayload;
}

// Compute an absolute expiry Date from a duration string like "7d" / "15m"
export function getExpiryDate(duration: string): Date {
  const match = duration.match(/^(\d+)([smhd])$/);
  const now = Date.now();
  if (!match) return new Date(now + 7 * 24 * 60 * 60 * 1000);
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return new Date(now + value * multipliers[unit]);
}
