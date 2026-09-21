import mongoose from 'mongoose';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const MAX_STARTUP_ATTEMPTS = 3; // fast attempts before we stop blocking boot
const STARTUP_RETRY_DELAY_MS = 2000;
const BACKGROUND_RETRY_INTERVAL_MS = 10000; // keep trying quietly after that

let isConnected = false;
let backgroundRetryHandle: NodeJS.Timeout | null = null;

// Mongoose-level event listeners — these fire for the lifetime of the process,
// covering both the initial connect and any later drops/reconnects.
mongoose.connection.on('connected', () => {
  isConnected = true;
  logger.info('MongoDB connection established', {
    db: mongoose.connection.name,
    host: mongoose.connection.host,
  });
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  logger.info('MongoDB reconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error', { message: err.message });
});

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tryConnectOnce(): Promise<boolean> {
  try {
    await mongoose.connect(env.mongo.uri, {
      maxPoolSize: env.mongo.maxPoolSize,
      serverSelectionTimeoutMS: 3000,
    });
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('MongoDB connection attempt failed', { message });
    return false;
  }
}

/**
 * Makes a few quick attempts to connect during boot (so a normal "Mongo is
 * up" startup isn't artificially slow), then — if still unreachable — stops
 * blocking and keeps retrying quietly in the background. The HTTP server
 * starts regardless; the /health endpoint reflects the real, current state
 * at all times via pingMongo().
 */
export async function connectMongo(): Promise<void> {
  mongoose.set('strictQuery', true);

  for (let attempt = 1; attempt <= MAX_STARTUP_ATTEMPTS; attempt++) {
    const ok = await tryConnectOnce();
    if (ok) return;
    if (attempt < MAX_STARTUP_ATTEMPTS) {
      await delay(STARTUP_RETRY_DELAY_MS);
    }
  }

  logger.warn(
    `MongoDB unreachable after ${MAX_STARTUP_ATTEMPTS} startup attempts — ` +
      'continuing boot and retrying in the background. Content-related endpoints ' +
      'will fail until MongoDB is available.',
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
    const ok = await tryConnectOnce();
    if (ok && backgroundRetryHandle) {
      clearInterval(backgroundRetryHandle);
      backgroundRetryHandle = null;
    }
  }, BACKGROUND_RETRY_INTERVAL_MS);
  // Don't let this timer keep the process alive on its own during shutdown.
  backgroundRetryHandle.unref();
}

export async function disconnectMongo(): Promise<void> {
  if (backgroundRetryHandle) {
    clearInterval(backgroundRetryHandle);
    backgroundRetryHandle = null;
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('MongoDB connection closed gracefully.');
  }
}

/**
 * True liveness check — pings the actual database rather than trusting
 * readyState alone, since readyState can lag briefly during network blips.
 */
export async function pingMongo(): Promise<{ status: 'up' | 'down'; detail?: string }> {
  try {
    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
      return { status: 'down', detail: 'not connected' };
    }
    await mongoose.connection.db.admin().ping();
    return { status: 'up' };
  } catch (err) {
    return { status: 'down', detail: err instanceof Error ? err.message : 'unknown error' };
  }
}

export function isMongoConnected(): boolean {
  return isConnected;
}
