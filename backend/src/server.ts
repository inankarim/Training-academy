import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { connectMongo, disconnectMongo } from './database/mongo';
import { connectPostgres, disconnectPostgres } from './database/postgres';
import { connectRedis, disconnectRedis } from './database/redis';

// Catch anything that escapes Express's own error handling.
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception - shutting down', { message: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection - shutting down', { reason });
  process.exit(1);
});

async function bootstrap() {
  // Connect to all data stores BEFORE accepting traffic and BEFORE building
  // the Express app — security middleware (rate limiter) checks Redis's
  // connection state at app-creation time to decide its storage backend.
  await Promise.all([connectMongo(), connectPostgres(), connectRedis()]);

  const app = createApp();

  const server = app.listen(env.port, () => {
    logger.info(`${env.appName} listening on port ${env.port} [${env.nodeEnv}]`);
  });

  function gracefulShutdown(signal: string) {
    logger.info(`${signal} received: closing server gracefully`);
    server.close(async () => {
      logger.info('HTTP server closed.');
      await Promise.all([disconnectMongo(), disconnectPostgres(), disconnectRedis()]);
      process.exit(0);
    });
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

bootstrap();
