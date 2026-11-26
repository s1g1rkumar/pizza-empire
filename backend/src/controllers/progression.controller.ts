import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { ProgressionService } from '../services/progression.service';

export class ProgressionController {
  private readonly progressionService = new ProgressionService();

  getDashboard = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.progressionService.getDashboard(req.user!.playerId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  unlockNextLevel = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.progressionService.unlockNextLevel(req.user!.playerId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  claimMission = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.progressionService.claimMissionReward(
        req.user!.playerId,
        Number(req.params.missionId)
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  claimAchievement = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.progressionService.claimAchievementReward(
        req.user!.playerId,
        Number(req.params.achievementId)
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}
