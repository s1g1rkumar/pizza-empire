import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { InventoryService } from '../services/inventory.service';

export class InventoryController {
  private readonly inventoryService = new InventoryService();

  getDashboard = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.inventoryService.getDashboard(req.user!.playerId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  buyItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.inventoryService.buyFromMarket(
        req.user!.playerId,
        Number(req.body.businessId),
        Number(req.body.itemId),
        Number(req.body.quantity)
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  sellItem = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.inventoryService.sellToMarket(
        req.user!.playerId,
        Number(req.body.businessId),
        Number(req.body.itemId),
        Number(req.body.quantity)
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  transferItem = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.inventoryService.transferStock(
        req.user!.playerId,
        Number(req.body.fromBusinessId),
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
