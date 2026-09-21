import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../config/env';
import { AccessTokenPayload } from './auth.types';

export function generateAccessToken(userId: string, role: string): string {
  const payload: AccessTokenPayload = { sub: userId, role, type: 'access' };
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.jwt.accessSecret);
  if (typeof decoded === 'string' || decoded.type !== 'access') {
    throw new Error('Invalid access token');
  }
  return decoded as unknown as AccessTokenPayload;
}

/**
 * Refresh tokens are opaque random strings, not JWTs. We store a hash of
 * them server-side (refresh_tokens table), which is what lets us revoke an
 * individual session immediately — a stateless JWT refresh token would need
 * its own server-side revocation list anyway, so there's no simplicity
 * trade-off lost by going opaque.
 */
export function generateRefreshTokenValue(): string {
  return crypto.randomBytes(48).toString('base64url');
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Parses simple duration strings like "15m", "7d" into milliseconds. */
export function parseDurationMs(input: string): number {
  const match = /^(\d+)(s|m|h|d)$/.exec(input);
  if (!match) {
    throw new Error(`Invalid duration string: "${input}" (expected e.g. "15m", "7d")`);
  }
  const value = parseInt(match[1], 10);
  const multipliers: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return value * multipliers[match[2]];
}
