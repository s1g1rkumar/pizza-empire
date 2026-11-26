import { Router } from 'express';
import Joi from 'joi';
import { FactoryController } from '../controllers/factory.controller';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();
const factoryController = new FactoryController();

const factoryParamsSchema = Joi.object({
  factoryId: Joi.number().integer().positive().required(),
});

const constructSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  factoryType: Joi.string()
    .valid(
      'FLOUR_MILL',
      'TOMATO_SAUCE_FACTORY',
      'DAIRY_FACTORY',
      'VEGETABLE_PROCESSING_FACTORY',
      'PACKAGING_FACTORY'
    )
    .required(),
  locationId: Joi.number().integer().positive().required(),
});

const orderSchema = Joi.object({
  quantity: Joi.number().integer().min(1).max(100).required(),
});

const transferSchema = Joi.object({
  toBusinessId: Joi.number().integer().positive().required(),
  itemId: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().min(1).max(10000).required(),
});

router.use(authenticateJWT);

router.get('/', factoryController.getDashboard);
router.post('/construct', validateRequest(constructSchema), factoryController.construct);
router.post(
  '/:factoryId/machines',
  validateRequest(factoryParamsSchema, 'params'),
  factoryController.purchaseMachine
);
router.post(
  '/:factoryId/storage',
  validateRequest(factoryParamsSchema, 'params'),
  factoryController.upgradeStorage
);
router.post(
  '/:factoryId/orders',
  validateRequest(factoryParamsSchema, 'params'),
  validateRequest(orderSchema),
  factoryController.startOrder
);
router.post(
  '/:factoryId/transfer',
  validateRequest(factoryParamsSchema, 'params'),
  validateRequest(transferSchema),
  factoryController.transferOutput
);

export default router;
