import { getRedisClient, isRedisConnected } from '../../database/redis';

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 15 * 60;

function key(email: string): string {
  return `login_attempts:${email.toLowerCase()}`;
}

/**
 * Records a failed attempt and returns whether the account is now locked.
 * Fails open (never locks anyone out) if Redis is unavailable — the IP-based
 * rate limiter in middleware/security.ts still applies regardless, so this
 * is a second layer, not the only layer.
 */
export async function recordFailedLogin(email: string): Promise<{ locked: boolean; attempts: number }> {
  if (!isRedisConnected()) return { locked: false, attempts: 0 };
  const client = getRedisClient();
  const k = key(email);
  const attempts = await client.incr(k);
  if (attempts === 1) {
    await client.expire(k, LOCKOUT_SECONDS);
  }
  return { locked: attempts >= MAX_ATTEMPTS, attempts };
}

export async function isLoginLocked(email: string): Promise<boolean> {
  if (!isRedisConnected()) return false;
  const attempts = await getRedisClient().get(key(email));
  return attempts !== null && parseInt(attempts, 10) >= MAX_ATTEMPTS;
}

export async function clearFailedLogins(email: string): Promise<void> {
  if (!isRedisConnected()) return;
  await getRedisClient().del(key(email));
}
