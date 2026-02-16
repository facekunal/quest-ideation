import { serverConfig } from '../config/snag.config';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const logLevelMap: Record<string, LogLevel> = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
};

const currentLogLevel = logLevelMap[serverConfig.logLevel] || LogLevel.INFO;

function formatMessage(level: string, message: string, meta?: any): string {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level}] ${message}${metaStr}`;
}

export const logger = {
  debug(message: string, meta?: any): void {
    if (currentLogLevel <= LogLevel.DEBUG) {
      console.log(formatMessage('DEBUG', message, meta));
    }
  },

  info(message: string, meta?: any): void {
    if (currentLogLevel <= LogLevel.INFO) {
      console.log(formatMessage('INFO', message, meta));
    }
  },

  warn(message: string, meta?: any): void {
    if (currentLogLevel <= LogLevel.WARN) {
      console.warn(formatMessage('WARN', message, meta));
    }
  },

  error(message: string, meta?: any): void {
    if (currentLogLevel <= LogLevel.ERROR) {
      console.error(formatMessage('ERROR', message, meta));
    }
  },
};
