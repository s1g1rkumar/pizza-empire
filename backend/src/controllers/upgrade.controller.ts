import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { UpgradeService } from '../services/upgrade.service';

export class UpgradeController {
  private readonly upgradeService = new UpgradeService();

  getDashboard = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.upgradeService.getDashboard(req.user!.playerId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  purchase = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.upgradeService.purchaseUpgrade(
        req.user!.playerId,
        String(req.params.upgradeCode)
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}
