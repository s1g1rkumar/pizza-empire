import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { RestaurantService } from '../services/restaurant.service';
import { RestaurantType } from '../utils/restaurantCalculator';

export class RestaurantController {
  private readonly restaurantService = new RestaurantService();

  getDashboard = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.restaurantService.getDashboard(req.user!.playerId);
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
      const data = await this.restaurantService.constructRestaurant(
        req.user!.playerId,
        String(req.body.name),
        req.body.restaurantType as RestaurantType,
        Number(req.body.locationId)
      );
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  upgrade = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.restaurantService.upgradeRestaurant(
        req.user!.playerId,
        Number(req.params.restaurantId),
        req.body.upgradeType
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  updateMenu = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.restaurantService.updateMenuItem(
        req.user!.playerId,
        Number(req.params.restaurantId),
        Number(req.params.menuId),
        req.body
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  serve = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.restaurantService.serveCustomers(
        req.user!.playerId,
        Number(req.params.restaurantId)
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}
