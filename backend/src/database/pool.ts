import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import { env } from '../config/env';

export const dbPool: Pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  connectionLimit: env.db.connectionLimit,
  waitForConnections: true,
  queueLimit: 0,
  timezone: '+00:00',
  decimalNumbers: true,
});

export async function withTransaction<T>(
  callback: (connection: PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await dbPool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function checkDatabaseConnection(): Promise<boolean> {
  const connection = await dbPool.getConnection();
  try {
    await connection.ping();
    return true;
  } finally {
    connection.release();
  }
}
