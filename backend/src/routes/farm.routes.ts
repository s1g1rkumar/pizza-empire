import { Router } from 'express';
import Joi from 'joi';
import { FarmController } from '../controllers/farm.controller';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();
const farmController = new FarmController();

const plotParamsSchema = Joi.object({
  plotId: Joi.number().integer().positive().required(),
});

const buySeedsSchema = Joi.object({
  cropId: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().min(1).max(100).required(),
});

const plantSchema = Joi.object({
  cropId: Joi.number().integer().positive().required(),
  autoBuySeed: Joi.boolean().default(true),
});

const fertilizeSchema = Joi.object({
  fertilizerType: Joi.string().valid('COMPOST', 'BIO_NUTRIENT').required(),
});

const sellCropsSchema = Joi.object({
  itemId: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().min(1).max(10000).required(),
});

const upgradeParamsSchema = Joi.object({
  upgradeCode: Joi.string()
    .pattern(/^[A-Z0-9_]+$/)
    .max(64)
    .required(),
});

router.use(authenticateJWT);

router.get('/', farmController.getDashboard);
router.post('/seeds/buy', validateRequest(buySeedsSchema), farmController.buySeeds);
router.post(
  '/plots/:plotId/unlock',
  validateRequest(plotParamsSchema, 'params'),
  farmController.unlockPlot
);
router.post(
  '/plots/:plotId/plant',
  validateRequest(plotParamsSchema, 'params'),
  validateRequest(plantSchema),
  farmController.plantCrop
);
router.post(
  '/plots/:plotId/water',
  validateRequest(plotParamsSchema, 'params'),
  farmController.waterPlot
);
router.post(
  '/plots/:plotId/fertilize',
  validateRequest(plotParamsSchema, 'params'),
  validateRequest(fertilizeSchema),
  farmController.fertilizePlot
);
router.post(
  '/plots/:plotId/harvest',
  validateRequest(plotParamsSchema, 'params'),
  farmController.harvestPlot
);
router.post('/crops/sell', validateRequest(sellCropsSchema), farmController.sellCrops);
router.post(
  '/upgrades/:upgradeCode',
  validateRequest(upgradeParamsSchema, 'params'),
  farmController.purchaseUpgrade
);

export default router;
