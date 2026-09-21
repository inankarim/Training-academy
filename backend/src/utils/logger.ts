import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { env } from '../config/env';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const logDir = path.resolve(process.cwd(), env.log.dir);

// Human-readable console format for local development.
const consoleFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ timestamp: ts, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${ts} [${level}] ${stack || message}${metaStr}`;
  }),
);

// Structured JSON format for files/log aggregation (ELK, CloudWatch, etc.)
const fileFormat = combine(timestamp(), errors({ stack: true }), json());

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: consoleFormat,
    level: env.log.level,
  }),
  new DailyRotateFile({
    dirname: logDir,
    filename: 'app-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    format: fileFormat,
    level: env.log.level,
  }),
  new DailyRotateFile({
    dirname: logDir,
    filename: 'error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '90d',
    format: fileFormat,
    level: 'error',
  }),
];

export const logger = winston.createLogger({
  level: env.log.level,
  defaultMeta: { service: env.appName, env: env.nodeEnv },
  transports,
  exitOnError: false,
});

// Convenience wrapper so modules can log with consistent structured context,
// e.g. logger.child({ module: 'auth', userId }) — used from Phase 4 onward.
export function childLogger(meta: Record<string, unknown>) {
  return logger.child(meta);
}
