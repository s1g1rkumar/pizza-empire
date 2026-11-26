import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { FactoryService } from '../services/factory.service';
import { FactoryType } from '../utils/factoryCalculator';

export class FactoryController {
  private readonly factoryService = new FactoryService();

  getDashboard = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.factoryService.getDashboard(req.user!.playerId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  construct = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.factoryService.constructFactory(
        req.user!.playerId,
        String(req.body.name),
        req.body.factoryType as FactoryType,
        Number(req.body.locationId)
      );
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  purchaseMachine = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.factoryService.purchaseMachine(
        req.user!.playerId,
        Number(req.params.factoryId)
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  upgradeStorage = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.factoryService.upgradeStorage(
        req.user!.playerId,
        Number(req.params.factoryId)
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  startOrder = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.factoryService.startBatchOrder(
        req.user!.playerId,
        Number(req.params.factoryId),
        Number(req.body.quantity)
      );
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  transferOutput = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.factoryService.transferOutputToBusiness(
        req.user!.playerId,
        Number(req.params.factoryId),
        Number(req.body.toBusinessId),
        Number(req.body.itemId),
        Number(req.body.quantity)
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}
