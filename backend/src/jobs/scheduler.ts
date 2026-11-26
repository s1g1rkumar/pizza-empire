import { RowDataPacket } from 'mysql2/promise';
import { dbPool, withTransaction } from '../database/pool';
import { DeliveryService } from '../services/delivery.service';
import { logger } from '../utils/logger';

interface ScheduledJob {
  name: string;
  intervalMs: number;
  handler: () => Promise<void>;
  running: boolean;
  timer?: NodeJS.Timeout;
}

export class SimulationScheduler {
  private readonly jobs: ScheduledJob[] = [];

  constructor() {
    this.registerJob('cleanup-expired-tokens', 60 * 60 * 1000, async () => {
      await dbPool.query(
        `DELETE FROM refresh_tokens WHERE expires_at < (UTC_TIMESTAMP() - INTERVAL 1 DAY)`
      );
      await dbPool.query(
        `DELETE FROM password_reset_tokens WHERE expires_at < (UTC_TIMESTAMP() - INTERVAL 1 DAY)`
      );
    });

    this.registerJob('settle-arrived-deliveries', 60 * 1000, async () => {
      const [playerRows] = await dbPool.query<RowDataPacket[]>(
        `SELECT DISTINCT player_id AS playerId
         FROM deliveries
         WHERE status = 'DISPATCHED' AND eta_at <= UTC_TIMESTAMP()`
      );
      const deliveryService = new DeliveryService();
      for (const row of playerRows) {
        const playerId = Number(row.playerId);
        await withTransaction(async (conn) => {
          await deliveryService.settleArrivedDeliveries(conn, playerId);
        });
      }
    });
  }

  registerJob(name: string, intervalMs: number, handler: () => Promise<void>): void {
    this.jobs.push({ name, intervalMs, handler, running: false });
  }

  async runJobOnce(name: string): Promise<boolean> {
    const job = this.jobs.find((j) => j.name === name);
    if (!job || job.running) {
      return false;
    }

    job.running = true;
    try {
      await job.handler();
      return true;
    } catch (error) {
      logger.warn(`Background job "${job.name}" failed`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    } finally {
      job.running = false;
    }
  }

  start(): void {
    for (const job of this.jobs) {
      if (job.timer) continue;
      job.timer = setInterval(() => {
        void this.runJobOnce(job.name);
      }, job.intervalMs);
      job.timer.unref();
    }
    logger.info('Simulation background scheduler started', {
      jobCount: this.jobs.length,
    });
  }

  stop(): void {
    for (const job of this.jobs) {
      if (job.timer) {
        clearInterval(job.timer);
        job.timer = undefined;
      }
    }
    logger.info('Simulation background scheduler stopped');
  }
}
