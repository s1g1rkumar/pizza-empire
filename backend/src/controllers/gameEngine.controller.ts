import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { GameEngineService } from '../services/gameEngine.service';
import { OfflineService } from '../services/offline.service';

export class GameEngineController {
  private readonly gameEngineService = new GameEngineService();
  private readonly offlineService = new OfflineService();

  syncEmpire = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.gameEngineService.syncEmpire(req.user!.playerId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  claimOffline = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.offlineService.claimOfflineSession(
        req.user!.playerId,
        Number(req.body.sessionId)
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };
}
