import { Router } from 'express';
import Joi from 'joi';
import { AdminController } from '../controllers/admin.controller';
import { authenticateJWT, requireRole } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();
const controller = new AdminController();

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const playerAccountSchema = Joi.object({
  status: Joi.string().valid('ACTIVE', 'SUSPENDED', 'BANNED').optional(),
  role: Joi.string().valid('PLAYER', 'MODERATOR', 'ADMIN').optional(),
  cashBalance: Joi.number().min(0).optional(),
  gemsBalance: Joi.number().integer().min(0).optional(),
});

const playerProgressionSchema = Joi.object({
  xpLevel: Joi.number().integer().min(1).max(200).optional(),
  currentXp: Joi.number().integer().min(0).optional(),
  stageNumber: Joi.number().integer().min(1).max(8).optional(),
  reputation: Joi.number().min(0).max(100).optional(),
});

const cropSchema = Joi.object({
  seedCost: Joi.number().positive().required(),
  growthSeconds: Joi.number().integer().min(5).required(),
  baseYield: Joi.number().integer().min(1).required(),
  marketSellPrice: Joi.number().positive().required(),
  unlockXpLevel: Joi.number().integer().min(1).required(),
});

const productSchema = Joi.object({
  unitWholesaleBuy: Joi.number().min(0).required(),
  unitWholesaleSell: Joi.number().min(0).required(),
  lowStockThreshold: Joi.number().integer().min(0).required(),
});

const locationSchema = Joi.object({
  demandMultiplier: Joi.number().min(0.2).max(5).required(),
  rentMultiplier: Joi.number().min(0.2).max(5).required(),
  priceElasticity: Joi.number().min(0.2).max(3).required(),
});

const upgradeSchema = Joi.object({
  baseCost: Joi.number().positive().required(),
  costMultiplier: Joi.number().min(1.05).max(5).required(),
  effectValue: Joi.number().min(0).required(),
  maxLevel: Joi.number().integer().min(1).max(50).required(),
  isActive: Joi.boolean().required(),
});

const rewardTargetSchema = Joi.object({
  targetValue: Joi.number().integer().min(1).required(),
  rewardCash: Joi.number().min(0).required(),
  rewardXp: Joi.number().integer().min(0).required(),
  rewardGems: Joi.number().integer().min(0).required(),
  isActive: Joi.boolean().required(),
});

const settingSchema = Joi.object({
  settingValue: Joi.string().trim().min(1).max(255).required(),
});

const announcementSchema = Joi.object({
  title: Joi.string().trim().min(3).max(160).required(),
  message: Joi.string().trim().min(5).max(2000).required(),
  severity: Joi.string().valid('INFO', 'WARNING', 'EVENT', 'MAINTENANCE').required(),
});

const toggleAnnouncementSchema = Joi.object({
  isActive: Joi.boolean().required(),
});

// Public admin login (role verified in service)
router.post('/auth/login', validateRequest(loginSchema), controller.login);

// Protected Admin/Moderator read endpoints
router.use(authenticateJWT);
router.use(requireRole('ADMIN', 'MODERATOR'));

router.get('/analytics', controller.getAnalytics);
router.get('/players', controller.getPlayers);
router.get('/config', controller.getConfiguration);
router.get('/reports', controller.getReports);

const idParam = (name: string) =>
  Joi.object({
    [name]: Joi.number().integer().positive().required(),
  });

// Strict ADMIN-only configuration & account mutation endpoints
router.patch(
  '/players/:userId/account',
  requireRole('ADMIN'),
  validateRequest(idParam('userId'), 'params'),
  validateRequest(playerAccountSchema),
  controller.updatePlayerAccount
);
router.patch(
  '/players/:playerId/progression',
  requireRole('ADMIN'),
  validateRequest(idParam('playerId'), 'params'),
  validateRequest(playerProgressionSchema),
  controller.updatePlayerProgression
);
router.patch(
  '/config/crops/:cropId',
  requireRole('ADMIN'),
  validateRequest(idParam('cropId'), 'params'),
  validateRequest(cropSchema),
  controller.updateCrop
);
router.patch(
  '/config/products/:itemId',
  requireRole('ADMIN'),
  validateRequest(idParam('itemId'), 'params'),
  validateRequest(productSchema),
  controller.updateProduct
);
router.patch(
  '/config/locations/:locationId',
  requireRole('ADMIN'),
  validateRequest(idParam('locationId'), 'params'),
  validateRequest(locationSchema),
  controller.updateLocation
);
router.patch(
  '/config/upgrades/:upgradeId',
  requireRole('ADMIN'),
  validateRequest(idParam('upgradeId'), 'params'),
  validateRequest(upgradeSchema),
  controller.updateUpgrade
);
router.patch(
  '/config/missions/:missionId',
  requireRole('ADMIN'),
  validateRequest(idParam('missionId'), 'params'),
  validateRequest(rewardTargetSchema),
  controller.updateMission
);
router.patch(
  '/config/achievements/:achievementId',
  requireRole('ADMIN'),
  validateRequest(idParam('achievementId'), 'params'),
  validateRequest(rewardTargetSchema),
  controller.updateAchievement
);
const settingKeyParamSchema = Joi.object({
  settingKey: Joi.string().trim().min(3).max(64).required(),
});

router.patch(
  '/config/settings/:settingKey',
  requireRole('ADMIN'),
  validateRequest(settingKeyParamSchema, 'params'),
  validateRequest(settingSchema),
  controller.updateSetting
);
router.post(
  '/announcements',
  requireRole('ADMIN'),
  validateRequest(announcementSchema),
  controller.createAnnouncement
);
router.patch(
  '/announcements/:announcementId',
  requireRole('ADMIN'),
  validateRequest(idParam('announcementId'), 'params'),
  validateRequest(toggleAnnouncementSchema),
  controller.toggleAnnouncement
);

export default router;
