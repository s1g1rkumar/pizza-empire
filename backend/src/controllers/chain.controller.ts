import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { ChainService } from '../services/chain.service';

export class ChainController {
  private readonly chainService = new ChainService();

  getDashboard = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.chainService.getDashboard(req.user!.playerId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  assignManager = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.chainService.assignManager(
        req.user!.playerId,
        Number(req.params.restaurantId),
        Number(req.body.managerEmployeeId)
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  payRent = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.chainService.payBranchRent(
        req.user!.playerId,
        Number(req.params.restaurantId)
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}
