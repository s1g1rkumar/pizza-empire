import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { DeliveryService } from '../services/delivery.service';
import { VehicleType } from '../utils/deliveryCalculator';

export class DeliveryController {
  private readonly deliveryService = new DeliveryService();

  getDashboard = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.deliveryService.getDashboard(req.user!.playerId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  buyVehicle = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.deliveryService.buyVehicle(
        req.user!.playerId,
        req.body.vehicleType as VehicleType,
        String(req.body.name)
      );
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  upgradeVehicle = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.deliveryService.upgradeVehicle(
        req.user!.playerId,
        Number(req.params.vehicleId)
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  dispatchOrder = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.deliveryService.dispatchDeliveryOrder(req.user!.playerId, {
        restaurantId: Number(req.body.restaurantId),
        itemId: Number(req.body.itemId),
        quantity: Number(req.body.quantity),
        zoneId: Number(req.body.zoneId),
        vehicleId: Number(req.body.vehicleId),
        driverEmployeeId: req.body.driverEmployeeId ? Number(req.body.driverEmployeeId) : undefined,
      });
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}
