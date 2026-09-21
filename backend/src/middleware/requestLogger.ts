import morgan from 'morgan';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';

// Attaches a unique request ID to every incoming request so a single
// request can be traced across logs, error responses, and (later) audit logs.
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const incomingId = req.headers['x-request-id'];
  const requestId = typeof incomingId === 'string' && incomingId.length > 0 ? incomingId : randomUUID();
  (req as Request & { requestId: string }).requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}

morgan.token('id', (req: Request) => (req as Request & { requestId?: string }).requestId || '-');

// Structured access log: every request/response pair goes through Winston,
// not console.log, so it ends up in the rotating file transports too.
export const httpLogger = morgan(
  ':id :method :url :status :res[content-length] - :response-time ms',
  {
    stream: {
      write: (message: string) => logger.info(message.trim(), { type: 'http' }),
    },
  },
);
