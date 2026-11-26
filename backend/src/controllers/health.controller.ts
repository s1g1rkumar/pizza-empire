import { NextFunction, Request, Response } from 'express';
import { HealthService } from '../services/health.service';

export class HealthController {
  private readonly healthService = new HealthService();

  getHealth = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const health = await this.healthService.getHealthStatus();
      const httpStatus = health.status === 'ok' ? 200 : 503;
      res.status(httpStatus).json({
        success: health.status === 'ok',
        data: health,
      });
    } catch (error) {
      next(error);
    }
  };
}
