import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { MallService } from '../services/mall.service';
import { MallTier, MallUnitType } from '../utils/mallCalculator';

export class MallController {
  private readonly mallService = new MallService();

  getDashboard = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.mallService.getDashboard(req.user!.playerId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  purchaseLand = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { locationId, parcelName, maxFloors } = req.body as {
        locationId: number;
        parcelName: string;
        maxFloors: number;
      };
      const data = await this.mallService.purchaseLand(
        req.user!.playerId,
        locationId,
        parcelName,
        maxFloors
      );
      res.status(201).json({ success: true, message: 'Commercial land parcel purchased', data });
    } catch (error) {
      next(error);
    }
  };

  constructMall = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { mallLandId, name, mallTier } = req.body as {
        mallLandId: number;
        name: string;
        mallTier: MallTier;
      };
      const data = await this.mallService.constructMall(
        req.user!.playerId,
        mallLandId,
        name,
        mallTier
      );
      res.status(201).json({ success: true, message: 'Shopping mall constructed', data });
    } catch (error) {
      next(error);
    }
  };

  addFloor = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const mallId = Number(req.params.mallId);
      const data = await this.mallService.addFloor(req.user!.playerId, mallId);
      res.status(200).json({ success: true, message: 'New mall floor constructed', data });
    } catch (error) {
      next(error);
    }
  };

  upgradeParking = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const mallId = Number(req.params.mallId);
      const data = await this.mallService.upgradeParking(req.user!.playerId, mallId);
      res.status(200).json({ success: true, message: 'Mall parking expanded', data });
    } catch (error) {
      next(error);
    }
  };

  createUnit = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const mallId = Number(req.params.mallId);
      const { floorNumber, unitType, unitName, occupancyStatus, tenantName, monthlyRent } =
        req.body as {
          floorNumber: number;
          unitType: MallUnitType;
          unitName: string;
          occupancyStatus: 'VACANT' | 'LEASED' | 'SELF_OPERATED';
          tenantName?: string;
          monthlyRent?: number;
        };
      const data = await this.mallService.createUnit(
        req.user!.playerId,
        mallId,
        floorNumber,
        unitType,
        unitName,
        occupancyStatus,
        tenantName,
        monthlyRent
      );
      res.status(201).json({ success: true, message: 'Mall unit built', data });
    } catch (error) {
      next(error);
    }
  };

  updateLease = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const mallId = Number(req.params.mallId);
      const unitId = Number(req.params.unitId);
      const { occupancyStatus, tenantName, monthlyRent, leaseMonths } = req.body as {
        occupancyStatus: 'VACANT' | 'LEASED' | 'SELF_OPERATED';
        tenantName: string | null;
        monthlyRent: number;
        leaseMonths: number;
      };
      const data = await this.mallService.updateLease(
        req.user!.playerId,
        mallId,
        unitId,
        occupancyStatus,
        tenantName,
        monthlyRent,
        leaseMonths
      );
      res.status(200).json({ success: true, message: 'Rental agreement updated', data });
    } catch (error) {
      next(error);
    }
  };

  collectRent = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const mallId = Number(req.params.mallId);
      const data = await this.mallService.collectRentAndRevenue(req.user!.playerId, mallId);
      res.status(200).json({
        success: true,
        message: 'Collected mall rental and visitor revenue',
        data,
      });
    } catch (error) {
      next(error);
    }
  };
}
