import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { env } from '../config/env';
import { logger } from '../utils/logger';

async function runMigrations(): Promise<void> {
  const migrationsDir = path.resolve(__dirname, '../../../database/migrations');
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found: ${migrationsDir}`);
  }

  const bootstrapConn = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    multipleStatements: true,
    timezone: '+00:00',
  });

  try {
    await bootstrapConn.query(
      `CREATE DATABASE IF NOT EXISTS \`${env.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await bootstrapConn.changeUser({ database: env.db.database });

    await bootstrapConn.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        filename VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_schema_migrations_filename (filename)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const [appliedRows] = await bootstrapConn.query<mysql.RowDataPacket[]>(
      'SELECT filename FROM schema_migrations'
    );
    const applied = new Set(appliedRows.map((row) => String(row.filename)));

    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (applied.has(file)) {
        logger.info(`Skipping already applied migration: ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      logger.info(`Applying migration: ${file}`);
      await bootstrapConn.query(sql);
      await bootstrapConn.query('INSERT INTO schema_migrations (filename) VALUES (?)', [file]);
      logger.info(`Applied migration: ${file}`);
    }

    logger.info('All database migrations completed.');
  } finally {
    await bootstrapConn.end();
  }
}

runMigrations().catch((err) => {
  logger.error('Migration failed', { error: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
