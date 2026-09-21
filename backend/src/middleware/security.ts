import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
// @ts-expect-error - xss-clean has no bundled types
import xssClean from 'xss-clean';
import rateLimit, { Store } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { Application } from 'express';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { getRedisClient, isRedisConnected } from '../database/redis';

// Whitelist-based CORS. In development, allow localhost/127.0.0.1 on any port.
const allowedOrigins = [
  env.clientUrl,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const isAllowedOrigin = (origin?: string): boolean => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (!env.isProduction) {
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return true;
    }
  }
  return false;
};

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      logger.warn('Blocked CORS request', { origin });
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'Accept', 'Origin', 'X-Requested-With'],
  optionsSuccessStatus: 200,
};

/**
 * Builds a Redis-backed rate-limit store when Redis is connected, so limits
 * are enforced consistently across multiple server instances/processes.
 * Falls back to express-rate-limit's built-in in-memory store (per-process
 * only) when Redis isn't available yet — better a working fallback than a
 * broken app.
 */
function buildRateLimitStore(): Store | undefined {
  if (!isRedisConnected()) return undefined;
  const client = getRedisClient();
  return new RedisStore({
    // ioredis's `call` overloads don't line up cleanly with rate-limit-redis's
    // expected signature; this narrow, local cast is the standard workaround
    // (documented in rate-limit-redis's own README for ioredis users).
    sendCommand: (...args: string[]) => client.call(...(args as [string, ...string[]])) as unknown as Promise<never>,
  });
}

/** Global limiter applied to all routes. */
export function createGlobalRateLimiter() {
  return rateLimit({
    windowMs: env.rateLimit.windowMs,
    max: env.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    store: buildRateLimitStore(),
    message: { error: 'Too many requests, please try again later.' },
  });
}

/** Tighter limiter for sensitive endpoints (login, password reset) — wired up in Phase 4. */
export function createStrictRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    store: buildRateLimitStore(),
    message: { error: 'Too many attempts, please try again later.' },
  });
}

export function applySecurityMiddleware(app: Application): void {
  // CORS must be before other middlewares so preflight OPTIONS requests are answered immediately
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

  app.use(
    helmet({
      contentSecurityPolicy: env.isProduction ? undefined : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(hpp()); // prevents HTTP parameter pollution
  app.use(xssClean()); // sanitizes user input against XSS in req.body/query/params

  const usingRedis = isRedisConnected();
  app.use(createGlobalRateLimiter());
  logger.info(`Rate limiting backed by ${usingRedis ? 'Redis (shared/distributed)' : 'in-memory store (Redis unavailable — per-process only)'}`);

  app.disable('x-powered-by');
}
