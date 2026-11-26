import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { AdminService } from '../services/admin.service';
import { UserRole } from '../types/auth.types';

export class AdminController {
  private readonly adminService = new AdminService();

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body as { email: string; password: string };
      const result = await this.adminService.adminLogin(email, password);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: env.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        message: 'Admin authenticated',
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getAnalytics = async (
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.adminService.getAnalytics();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getPlayers = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const data = await this.adminService.getPlayers(search, status);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getConfiguration = async (
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.adminService.getConfiguration();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getReports = async (
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.adminService.getReports();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  updatePlayerAccount = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = Number(req.params.userId);
      const data = await this.adminService.updatePlayerAccount(
        req.user!.userId,
        userId,
        req.body as {
          status?: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
          role?: UserRole;
          cashBalance?: number;
          gemsBalance?: number;
        },
        req.ip
      );
      res.status(200).json({ success: true, message: 'Player account updated', data });
    } catch (error) {
      next(error);
    }
  };

  updatePlayerProgression = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const playerId = Number(req.params.playerId);
      const data = await this.adminService.updatePlayerProgression(
        req.user!.userId,
        playerId,
        req.body as {
          xpLevel?: number;
          currentXp?: number;
          stageNumber?: number;
          reputation?: number;
        },
        req.ip
      );
      res.status(200).json({ success: true, message: 'Player progression updated', data });
    } catch (error) {
      next(error);
    }
  };

  updateCrop = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const cropId = Number(req.params.cropId);
      const data = await this.adminService.updateCrop(
        req.user!.userId,
        cropId,
        req.body as {
          seedCost: number;
          growthSeconds: number;
          baseYield: number;
          marketSellPrice: number;
          unlockXpLevel: number;
        },
        req.ip
      );
      res.status(200).json({ success: true, message: 'Crop configuration updated', data });
    } catch (error) {
      next(error);
    }
  };

  updateProduct = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const itemId = Number(req.params.itemId);
      const data = await this.adminService.updateProduct(
        req.user!.userId,
        itemId,
        req.body as {
          unitWholesaleBuy: number;
          unitWholesaleSell: number;
          lowStockThreshold: number;
        },
        req.ip
      );
      res.status(200).json({ success: true, message: 'Product configuration updated', data });
    } catch (error) {
      next(error);
    }
  };

  updateLocation = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const locationId = Number(req.params.locationId);
      const data = await this.adminService.updateLocation(
        req.user!.userId,
        locationId,
        req.body as {
          demandMultiplier: number;
          rentMultiplier: number;
          priceElasticity: number;
        },
        req.ip
      );
      res.status(200).json({ success: true, message: 'Location configuration updated', data });
    } catch (error) {
      next(error);
    }
  };

  updateUpgrade = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const upgradeId = Number(req.params.upgradeId);
      const data = await this.adminService.updateUpgrade(
        req.user!.userId,
        upgradeId,
        req.body as {
          baseCost: number;
          costMultiplier: number;
          effectValue: number;
          maxLevel: number;
          isActive: boolean;
        },
        req.ip
      );
      res.status(200).json({ success: true, message: 'Upgrade configuration updated', data });
    } catch (error) {
      next(error);
    }
  };

  updateMission = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const missionId = Number(req.params.missionId);
      const data = await this.adminService.updateMission(
        req.user!.userId,
        missionId,
        req.body as {
          targetValue: number;
          rewardCash: number;
          rewardXp: number;
          rewardGems: number;
          isActive: boolean;
        },
        req.ip
      );
      res.status(200).json({ success: true, message: 'Mission configuration updated', data });
    } catch (error) {
      next(error);
    }
  };

  updateAchievement = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const achievementId = Number(req.params.achievementId);
      const data = await this.adminService.updateAchievement(
        req.user!.userId,
        achievementId,
        req.body as {
          targetValue: number;
          rewardCash: number;
          rewardXp: number;
          rewardGems: number;
          isActive: boolean;
        },
        req.ip
      );
      res.status(200).json({ success: true, message: 'Achievement configuration updated', data });
    } catch (error) {
      next(error);
    }
  };

  updateSetting = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const settingKey = String(req.params.settingKey);
      const { settingValue } = req.body as { settingValue: string };
      const data = await this.adminService.updateSetting(
        req.user!.userId,
        settingKey,
        settingValue,
        req.ip
      );
      res.status(200).json({ success: true, message: 'Game setting updated', data });
    } catch (error) {
      next(error);
    }
  };

  createAnnouncement = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.adminService.createAnnouncement(
        req.user!.userId,
        req.body as {
          title: string;
          message: string;
          severity: 'INFO' | 'WARNING' | 'EVENT' | 'MAINTENANCE';
        },
        req.ip
      );
      res.status(201).json({ success: true, message: 'Announcement published', data });
    } catch (error) {
      next(error);
    }
  };

  toggleAnnouncement = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const announcementId = Number(req.params.announcementId);
      const { isActive } = req.body as { isActive: boolean };
      const data = await this.adminService.toggleAnnouncement(
        req.user!.userId,
        announcementId,
        isActive,
        req.ip
      );
      res.status(200).json({ success: true, message: 'Announcement updated', data });
    } catch (error) {
      next(error);
    }
  };
}
