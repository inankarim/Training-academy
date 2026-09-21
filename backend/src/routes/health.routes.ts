import { Router, Request, Response } from 'express';
import { env } from '../config/env';
import { pingMongo } from '../database/mongo';
import { pingPostgres } from '../database/postgres';
import { pingRedis } from '../database/redis';

export const healthRouter = Router();

healthRouter.get('/', async (_req: Request, res: Response) => {
  const [mongo, postgres, redis] = await Promise.all([pingMongo(), pingPostgres(), pingRedis()]);

  const dependencies = {
    postgres: postgres.status,
    mongodb: mongo.status,
    redis: redis.status,
  };

  const anyDown = Object.values(dependencies).some((v) => v === 'down');

  res.status(anyDown ? 503 : 200).json({
    success: !anyDown,
    service: env.appName,
    env: env.nodeEnv,
    timestamp: new Date().toISOString(),
    dependencies,
  });
});
