import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { FarmService } from '../services/farm.service';

export class FarmController {
  private readonly farmService = new FarmService();

  getDashboard = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.farmService.getDashboard(req.user!.playerId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  buySeeds = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.farmService.buySeeds(
        req.user!.playerId,
        Number(req.body.cropId),
        Number(req.body.quantity)
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  unlockPlot = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.farmService.unlockPlot(req.user!.playerId, Number(req.params.plotId));
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  plantCrop = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.farmService.plantCrop(
        req.user!.playerId,
        Number(req.params.plotId),
        Number(req.body.cropId),
        Boolean(req.body.autoBuySeed ?? true)
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  waterPlot = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.farmService.waterPlot(req.user!.playerId, Number(req.params.plotId));
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  fertilizePlot = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.farmService.fertilizePlot(
        req.user!.playerId,
        Number(req.params.plotId),
        req.body.fertilizerType
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  harvestPlot = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.farmService.harvestPlot(
        req.user!.playerId,
        Number(req.params.plotId)
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  sellCrops = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.farmService.sellCrops(
        req.user!.playerId,
        Number(req.body.itemId),
        Number(req.body.quantity)
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  purchaseUpgrade = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.farmService.purchaseUpgrade(
        req.user!.playerId,
        String(req.params.upgradeCode)
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}
