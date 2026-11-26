import { HealthRepository } from '../repositories/health.repository';
import { logger } from '../utils/logger';

export interface HealthStatus {
  status: 'ok' | 'degraded';
  uptimeSeconds: number;
  timestamp: string;
  database: {
    connected: boolean;
    serverTimeUtc: string | null;
  };
}

export class HealthService {
  private readonly healthRepository = new HealthRepository();

  async getHealthStatus(): Promise<HealthStatus> {
    let dbConnected = false;
    let serverTimeUtc: string | null = null;

    try {
      const result = await this.healthRepository.pingDatabase();
      dbConnected = result.ok;
      serverTimeUtc = result.serverTimeUtc;
    } catch (error) {
      logger.warn('Database health ping failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return {
      status: dbConnected ? 'ok' : 'degraded',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: {
        connected: dbConnected,
        serverTimeUtc,
      },
    };
  }
}
