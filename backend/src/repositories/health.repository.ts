import { RowDataPacket } from 'mysql2/promise';
import { dbPool } from '../database/pool';

export class HealthRepository {
  async pingDatabase(): Promise<{ ok: boolean; serverTimeUtc: string }> {
    const [rows] = await dbPool.query<RowDataPacket[]>('SELECT UTC_TIMESTAMP() AS serverTimeUtc');
    const serverTimeUtc = rows[0]?.serverTimeUtc
      ? new Date(rows[0].serverTimeUtc as string).toISOString()
      : new Date().toISOString();

    return { ok: true, serverTimeUtc };
  }
}
