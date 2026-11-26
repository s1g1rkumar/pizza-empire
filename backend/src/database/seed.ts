import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { env } from '../config/env';
import { logger } from '../utils/logger';

async function runSeeds(): Promise<void> {
  const seedsDir = path.resolve(__dirname, '../../../database/seeds');
  if (!fs.existsSync(seedsDir)) {
    throw new Error(`Seeds directory not found: ${seedsDir}`);
  }

  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
    multipleStatements: true,
    timezone: '+00:00',
  });

  try {
    const files = fs
      .readdirSync(seedsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const sql = fs.readFileSync(path.join(seedsDir, file), 'utf8');
      logger.info(`Executing seed file: ${file}`);
      await connection.query(sql);
      logger.info(`Completed seed file: ${file}`);
    }

    logger.info('All database seeds completed.');
  } finally {
    await connection.end();
  }
}

runSeeds().catch((err) => {
  logger.error('Seed execution failed', {
    error: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
