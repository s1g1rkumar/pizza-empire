import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { ProductionService } from '../services/production.service';

export class ProductionController {
  private readonly productionService = new ProductionService();

  getDashboard = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.productionService.getDashboard(req.user!.playerId);
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
      const data = await this.productionService.startProductionOrder(
        req.user!.playerId,
        Number(req.body.recipeId),
        Number(req.body.quantity)
      );
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  cancelOrder = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.productionService.cancelProductionOrder(
        req.user!.playerId,
        Number(req.params.orderId)
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}
