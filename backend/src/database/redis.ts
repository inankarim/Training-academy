import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const MAX_STARTUP_ATTEMPTS = 3;
const STARTUP_RETRY_DELAY_MS = 2000;
const BACKGROUND_RETRY_INTERVAL_MS = 10000;

let client: Redis | null = null;
let isConnected = false;
let backgroundRetryHandle: NodeJS.Timeout | null = null;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createClient(): Redis {
  const newClient = new Redis({
    host: env.redis.host,
    port: env.redis.port,
    password: env.redis.password,
    db: env.redis.db,
    lazyConnect: true, // we control the connect() call explicitly to match the boot pattern used for Mongo/Postgres
    maxRetriesPerRequest: 2,
    enableOfflineQueue: false, // fail fast on commands issued while disconnected, rather than queueing silently
    retryStrategy: () => null, // disable ioredis's own internal reconnect loop — we drive retries ourselves below, so both loops don't fight and flood the logs
  });

  newClient.on('ready', () => {
    isConnected = true;
    logger.info('Redis connection established', { host: env.redis.host, port: env.redis.port });
  });

  newClient.on('close', () => {
    if (isConnected) logger.warn('Redis connection closed');
    isConnected = false;
  });

  let lastErrorLoggedAt = 0;
  newClient.on('error', (err) => {
    // With retryStrategy disabled, a dead connection can still emit repeated
    // socket errors in quick succession — throttle so one outage doesn't
    // flood the log files.
    const now = Date.now();
    if (now - lastErrorLoggedAt > 5000) {
      logger.error('Redis connection error', { message: err.message });
      lastErrorLoggedAt = now;
    }
  });

  return newClient;
}

async function tryConnectOnce(): Promise<boolean> {
  try {
    const candidate = client ?? createClient();
    if (candidate.status === 'wait' || candidate.status === 'end') {
      await candidate.connect();
    }
    client = candidate;
    isConnected = client.status === 'ready';
    return isConnected;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Redis connection attempt failed', { message });
    isConnected = false;
    return false;
  }
}

/**
 * Same boot pattern as Mongo/Postgres: a few quick attempts so a healthy
 * Redis doesn't slow down boot, then a quiet background retry loop if it's
 * still unreachable. The HTTP server starts regardless — the rate limiter
 * and cache layer fall back gracefully (see middleware/security.ts).
 */
export async function connectRedis(): Promise<void> {
  for (let attempt = 1; attempt <= MAX_STARTUP_ATTEMPTS; attempt++) {
    const ok = await tryConnectOnce();
    if (ok) return;
    if (attempt < MAX_STARTUP_ATTEMPTS) {
      await delay(STARTUP_RETRY_DELAY_MS);
    }
  }

  logger.warn(
    `Redis unreachable after ${MAX_STARTUP_ATTEMPTS} startup attempts — continuing boot. ` +
      'Rate limiting will fall back to in-memory storage; caching/session features will be unavailable until Redis connects.',
  );
  startBackgroundRetry();
}

function startBackgroundRetry(): void {
  if (backgroundRetryHandle) return;
  backgroundRetryHandle = setInterval(async () => {
    if (isConnected) {
      if (backgroundRetryHandle) clearInterval(backgroundRetryHandle);
      backgroundRetryHandle = null;
      return;
    }
    await tryConnectOnce();
    if (isConnected && backgroundRetryHandle) {
      clearInterval(backgroundRetryHandle);
      backgroundRetryHandle = null;
    }
  }, BACKGROUND_RETRY_INTERVAL_MS);
  backgroundRetryHandle.unref();
}

export async function disconnectRedis(): Promise<void> {
  if (backgroundRetryHandle) {
    clearInterval(backgroundRetryHandle);
    backgroundRetryHandle = null;
  }
  if (client) {
    await client.quit().catch(() => client?.disconnect());
    logger.info('Redis connection closed gracefully.');
    client = null;
    isConnected = false;
  }
}

export async function pingRedis(): Promise<{ status: 'up' | 'down'; detail?: string }> {
  if (!client || !isConnected) return { status: 'down', detail: 'not connected' };
  try {
    const reply = await client.ping();
    return reply === 'PONG' ? { status: 'up' } : { status: 'down', detail: `unexpected reply: ${reply}` };
  } catch (err) {
    return { status: 'down', detail: err instanceof Error ? err.message : 'unknown error' };
  }
}

/**
 * Shared client getter for the rest of the app: rate limiting (now),
 * sessions/refresh-token storage (Phase 4), and caching (leaderboard, XP
 * totals — Phase 11/12) will all reuse this single connection.
 */
export function getRedisClient(): Redis {
  if (!client) {
    throw new Error('Redis client has not been initialized yet — connectRedis() must run first.');
  }
  return client;
}

export function isRedisConnected(): boolean {
  return isConnected;
}
