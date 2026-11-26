import app from './app';
import { env } from './config/env';
import { checkDatabaseConnection, dbPool } from './database/pool';
import { SimulationScheduler } from './jobs/scheduler';
import { logger } from './utils/logger';

const scheduler = new SimulationScheduler();

async function bootstrap(): Promise<void> {
  try {
    await checkDatabaseConnection();
    logger.info('MySQL connection pool established', { database: env.db.database });
    scheduler.start();
  } catch (error) {
    logger.warn('MySQL not reachable at startup; /api/v1/health will report degraded status', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const server = app.listen(env.port, () => {
    logger.info(`Pizza Empire Tycoon API listening on port ${env.port}`, {
      env: env.nodeEnv,
    });
  });

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    scheduler.stop();
    server.close(async () => {
      await dbPool.end();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

void bootstrap();
