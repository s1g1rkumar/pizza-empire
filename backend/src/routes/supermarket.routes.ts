import { Router } from 'express';
import Joi from 'joi';
import { SupermarketController } from '../controllers/supermarket.controller';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();
const controller = new SupermarketController();

const storeParamSchema = Joi.object({
  supermarketId: Joi.number().integer().positive().required(),
});

const listingParamSchema = Joi.object({
  supermarketId: Joi.number().integer().positive().required(),
  itemId: Joi.number().integer().positive().required(),
});

const constructSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  storeTier: Joi.string().valid('MINI_MART', 'SUPERMARKET', 'HYPERMARKET').required(),
  locationId: Joi.number().integer().positive().required(),
});

const purchaseSchema = Joi.object({
  itemId: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().min(1).max(2000).required(),
});

const supplySchema = Joi.object({
  factoryId: Joi.number().integer().positive().required(),
  itemId: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().min(1).max(5000).required(),
});

const updateListingSchema = Joi.object({
  customPrice: Joi.number().positive().max(1000).required(),
  isEnabled: Joi.boolean().required(),
});

const upgradeSchema = Joi.object({
  upgradeType: Joi.string()
    .valid('AISLES', 'CHECKOUT_LANES', 'COLD_STORAGE', 'DECOR', 'STORAGE')
    .required(),
});

const assignEmployeeSchema = Joi.object({
  employeeId: Joi.number().integer().positive().required(),
});

router.use(authenticateJWT);

router.get('/', controller.getDashboard);
router.post('/construct', validateRequest(constructSchema), controller.construct);
router.post(
  '/:supermarketId/purchase',
  validateRequest(storeParamSchema, 'params'),
  validateRequest(purchaseSchema),
  controller.purchaseProduct
);
router.post(
  '/:supermarketId/supply-from-factory',
  validateRequest(storeParamSchema, 'params'),
  validateRequest(supplySchema),
  controller.supplyFromFactory
);
router.patch(
  '/:supermarketId/listings/:itemId',
  validateRequest(listingParamSchema, 'params'),
  validateRequest(updateListingSchema),
  controller.updateListing
);
router.post(
  '/:supermarketId/upgrade',
  validateRequest(storeParamSchema, 'params'),
  validateRequest(upgradeSchema),
  controller.upgrade
);
router.post(
  '/:supermarketId/assign-employee',
  validateRequest(storeParamSchema, 'params'),
  validateRequest(assignEmployeeSchema),
  controller.assignEmployee
);
router.post(
  '/:supermarketId/sales/run',
  validateRequest(storeParamSchema, 'params'),
  controller.runSales
);

export default router;
