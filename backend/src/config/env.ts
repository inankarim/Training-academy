import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    // Fail fast: an enterprise system should never boot silently misconfigured.
    // eslint-disable-next-line no-console
    console.error(`[CONFIG ERROR] Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT || '4000', 10),
  appName: process.env.APP_NAME || 'holcim-academy-api',
  apiVersion: process.env.API_VERSION || 'v1',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  postgres: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DB || 'holcim_academy',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || '',
    ssl: process.env.POSTGRES_SSL === 'true',
    poolMin: parseInt(process.env.POSTGRES_POOL_MIN || '2', 10),
    poolMax: parseInt(process.env.POSTGRES_POOL_MAX || '10', 10),
  },

  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/holcim_academy_content',
    maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE || '10', 10),
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_only_insecure_secret_change_me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_only_insecure_secret_change_me_2',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '300', 10),
  },

  log: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || 'logs',
  },
};

// Hard-stop in production if default/insecure secrets are still in use.
if (env.isProduction) {
  if (env.jwt.accessSecret.startsWith('dev_only') || env.jwt.refreshSecret.startsWith('dev_only')) {
    // eslint-disable-next-line no-console
    console.error('[CONFIG ERROR] Refusing to start in production with default JWT secrets.');
    process.exit(1);
  }
}

void required; // reserved for future strictly-required vars (e.g. cloud storage keys)
