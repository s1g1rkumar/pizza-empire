import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { SupermarketService } from '../services/supermarket.service';
import { SupermarketTier, SupermarketUpgradeType } from '../utils/supermarketCalculator';

export class SupermarketController {
  private readonly supermarketService = new SupermarketService();

  getDashboard = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.supermarketService.getDashboard(req.user!.playerId);
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
      const { name, storeTier, locationId } = req.body as {
        name: string;
        storeTier: SupermarketTier;
        locationId: number;
      };
      const data = await this.supermarketService.constructSupermarket(
        req.user!.playerId,
        name,
        storeTier,
        locationId
      );
      res.status(201).json({ success: true, message: 'Supermarket constructed', data });
    } catch (error) {
      next(error);
    }
  };

  purchaseProduct = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const supermarketId = Number(req.params.supermarketId);
      const { itemId, quantity } = req.body as { itemId: number; quantity: number };
      const data = await this.supermarketService.purchaseProduct(
        req.user!.playerId,
        supermarketId,
        itemId,
        quantity
      );
      res.status(200).json({ success: true, message: 'Wholesale stock purchased', data });
    } catch (error) {
      next(error);
    }
  };

  supplyFromFactory = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const supermarketId = Number(req.params.supermarketId);
      const { factoryId, itemId, quantity } = req.body as {
        factoryId: number;
        itemId: number;
        quantity: number;
      };
      const data = await this.supermarketService.supplyFromFactory(
        req.user!.playerId,
        supermarketId,
        factoryId,
        itemId,
        quantity
      );
      res.status(200).json({
        success: true,
        message: 'Transferred factory products to supermarket',
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  updateListing = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const supermarketId = Number(req.params.supermarketId);
      const itemId = Number(req.params.itemId);
      const { customPrice, isEnabled } = req.body as { customPrice: number; isEnabled: boolean };
      const data = await this.supermarketService.updateListing(
        req.user!.playerId,
        supermarketId,
        itemId,
        customPrice,
        isEnabled
      );
      res.status(200).json({ success: true, message: 'Product listing updated', data });
    } catch (error) {
      next(error);
    }
  };

  upgrade = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const supermarketId = Number(req.params.supermarketId);
      const { upgradeType } = req.body as { upgradeType: SupermarketUpgradeType };
      const data = await this.supermarketService.upgradeSupermarket(
        req.user!.playerId,
        supermarketId,
        upgradeType
      );
      res.status(200).json({ success: true, message: 'Supermarket upgraded', data });
    } catch (error) {
      next(error);
    }
  };

  assignEmployee = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const supermarketId = Number(req.params.supermarketId);
      const { employeeId } = req.body as { employeeId: number };
      const data = await this.supermarketService.assignEmployee(
        req.user!.playerId,
        supermarketId,
        employeeId
      );
      res.status(200).json({ success: true, message: 'Employee assigned to supermarket', data });
    } catch (error) {
      next(error);
    }
  };

  runSales = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const supermarketId = Number(req.params.supermarketId);
      const data = await this.supermarketService.runDailySales(req.user!.playerId, supermarketId);
      res.status(200).json({ success: true, message: 'Daily supermarket sales processed', data });
    } catch (error) {
      next(error);
    }
  };
}
