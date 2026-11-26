import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { DashboardService } from '../services/dashboard.service';

export class DashboardController {
  private readonly dashboardService = new DashboardService();

  getDashboard = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.dashboardService.getDashboard(req.user!.playerId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  markNotificationsRead = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.dashboardService.markNotificationsRead(req.user!.playerId);
      res.status(200).json({ success: true, data: { markedRead: true } });
    } catch (error) {
      next(error);
    }
  };
}
