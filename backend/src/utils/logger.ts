export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogMeta {
  [key: string]: unknown;
}

function formatLog(level: LogLevel, message: string, meta?: LogMeta): string {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta ?? {}),
  });
}

export const logger = {
  info(message: string, meta?: LogMeta): void {
    console.log(formatLog('info', message, meta));
  },
  warn(message: string, meta?: LogMeta): void {
    console.warn(formatLog('warn', message, meta));
  },
  error(message: string, meta?: LogMeta): void {
    console.error(formatLog('error', message, meta));
  },
  debug(message: string, meta?: LogMeta): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatLog('debug', message, meta));
    }
  },
};
