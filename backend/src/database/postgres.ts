import { Pool, PoolClient } from 'pg';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const MAX_STARTUP_ATTEMPTS = 3;
const STARTUP_RETRY_DELAY_MS = 2000;
const BACKGROUND_RETRY_INTERVAL_MS = 10000;

let pool: Pool | null = null;
let isConnected = false;
let backgroundRetryHandle: NodeJS.Timeout | null = null;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createPool(): Pool {
  const newPool = new Pool({
    host: env.postgres.host,
    port: env.postgres.port,
    database: env.postgres.database,
    user: env.postgres.user,
    password: env.postgres.password,
    ssl: env.postgres.ssl ? { rejectUnauthorized: false } : undefined,
    min: env.postgres.poolMin,
    max: env.postgres.poolMax,
    connectionTimeoutMillis: 3000,
    idleTimeoutMillis: 30000,
  });

  // Fires for errors on IDLE clients in the pool (e.g. the DB restarting) —
  // without this handler, such errors crash the whole Node process.
  newPool.on('error', (err) => {
    isConnected = false;
    logger.error('Unexpected PostgreSQL pool error on idle client', { message: err.message });
  });

  return newPool;
}

async function tryConnectOnce(): Promise<boolean> {
  try {
    const candidate = pool ?? createPool();
    const client: PoolClient = await candidate.connect();
    await client.query('SELECT 1');
    client.release();
    pool = candidate;
    if (!isConnected) {
      isConnected = true;
      logger.info('PostgreSQL connection established', {
        host: env.postgres.host,
        database: env.postgres.database,
      });
    }
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('PostgreSQL connection attempt failed', { message });
    isConnected = false;
    return false;
  }
}

/**
 * Same boot pattern as MongoDB: a few quick attempts so a healthy Postgres
 * doesn't slow down boot, then hand off to a quiet background retry loop if
 * it's still unreachable. The HTTP server starts regardless of the outcome.
 */
export async function connectPostgres(): Promise<void> {
  for (let attempt = 1; attempt <= MAX_STARTUP_ATTEMPTS; attempt++) {
    const ok = await tryConnectOnce();
    if (ok) return;
    if (attempt < MAX_STARTUP_ATTEMPTS) {
      await delay(STARTUP_RETRY_DELAY_MS);
    }
  }

  logger.warn(
    `PostgreSQL unreachable after ${MAX_STARTUP_ATTEMPTS} startup attempts — ` +
      'continuing boot and retrying in the background. Relational-data endpoints ' +
      'will fail until PostgreSQL is available.',
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

export async function disconnectPostgres(): Promise<void> {
  if (backgroundRetryHandle) {
    clearInterval(backgroundRetryHandle);
    backgroundRetryHandle = null;
  }
  if (pool) {
    await pool.end();
    logger.info('PostgreSQL pool closed gracefully.');
    pool = null;
    isConnected = false;
  }
}

/** Real liveness check — runs an actual query, not just a flag. */
export async function pingPostgres(): Promise<{ status: 'up' | 'down'; detail?: string }> {
  if (!pool) return { status: 'down', detail: 'not connected' };
  try {
    await pool.query('SELECT 1');
    return { status: 'up' };
  } catch (err) {
    return { status: 'down', detail: err instanceof Error ? err.message : 'unknown error' };
  }
}

/**
 * Shared query helper for the rest of the app (used from Phase 2 onward once
 * the schema/migrations exist). Throws clearly if called before a pool exists
 * rather than silently failing.
 */
export function getPool(): Pool {
  if (!pool) {
    throw new Error('PostgreSQL pool has not been initialized yet — connectPostgres() must run first.');
  }
  return pool;
}

export function isPostgresConnected(): boolean {
  return isConnected;
}
