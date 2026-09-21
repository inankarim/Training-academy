import express, { Application } from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { applySecurityMiddleware } from './middleware/security';
import { requestIdMiddleware, httpLogger } from './middleware/requestLogger';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler';
import { apiRouter } from './routes';
import { UPLOADS_DIR } from './middleware/upload';

export function createApp(): Application {
  const app = express();

  // --- Request tracing & logging (first, so every request is captured) ---
  app.use(requestIdMiddleware);
  app.use(httpLogger);

  // --- Security ---
  applySecurityMiddleware(app);

  // --- Body parsing & performance ---
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());
  app.use(compression());

  // --- Routes ---
  app.get('/', (_req, res) => {
    res.json({ success: true, message: `${env.appName} is running (${env.nodeEnv})` });
  });
  // Uploaded media is served as plain static files — course/lesson content
  // only ever stores a reference URL to files here, never binary data in
  // Postgres/MongoDB (see middleware/upload.ts).
  app.use('/uploads', express.static(UPLOADS_DIR));
  app.use(`/api/${env.apiVersion}`, apiRouter);

  // --- Error handling (must be last) ---
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
