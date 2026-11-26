import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { FinanceService } from '../services/finance.service';

export class FinanceController {
  private readonly financeService = new FinanceService();

  getDashboard = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.financeService.getDashboard(req.user!.playerId, {
        transactionType: req.query.transactionType as string | undefined,
        category: req.query.category as string | undefined,
      });
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  payOperatingExpense = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.financeService.payOperatingExpense(req.user!.playerId, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };
}
