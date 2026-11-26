import { Router } from 'express';
import Joi from 'joi';
import { MallController } from '../controllers/mall.controller';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();
const controller = new MallController();

const mallParamSchema = Joi.object({
  mallId: Joi.number().integer().positive().required(),
});

const unitParamSchema = Joi.object({
  mallId: Joi.number().integer().positive().required(),
  unitId: Joi.number().integer().positive().required(),
});

const purchaseLandSchema = Joi.object({
  locationId: Joi.number().integer().positive().required(),
  parcelName: Joi.string().trim().min(2).max(100).required(),
  maxFloors: Joi.number().integer().min(2).max(8).required(),
});

const constructMallSchema = Joi.object({
  mallLandId: Joi.number().integer().positive().required(),
  name: Joi.string().trim().min(2).max(100).required(),
  mallTier: Joi.string().valid('BOUTIQUE_PLAZA', 'CITY_GALLERIA', 'MEGA_MALL').required(),
});

const createUnitSchema = Joi.object({
  floorNumber: Joi.number().integer().min(1).max(8).required(),
  unitType: Joi.string()
    .valid('RETAIL_SHOP', 'FOOD_COURT', 'SUPERMARKET', 'RESTAURANT', 'ENTERTAINMENT_ZONE')
    .required(),
  unitName: Joi.string().trim().min(2).max(100).required(),
  occupancyStatus: Joi.string().valid('VACANT', 'LEASED', 'SELF_OPERATED').required(),
  tenantName: Joi.string().trim().max(100).allow('', null).optional(),
  monthlyRent: Joi.number().min(0).max(50000).optional(),
});

const updateLeaseSchema = Joi.object({
  occupancyStatus: Joi.string().valid('VACANT', 'LEASED', 'SELF_OPERATED').required(),
  tenantName: Joi.string().trim().max(100).allow('', null).required(),
  monthlyRent: Joi.number().min(0).max(50000).required(),
  leaseMonths: Joi.number().integer().min(1).max(60).required(),
});

router.use(authenticateJWT);

router.get('/', controller.getDashboard);
router.post('/lands/purchase', validateRequest(purchaseLandSchema), controller.purchaseLand);
router.post('/construct', validateRequest(constructMallSchema), controller.constructMall);
router.post('/:mallId/floors/add', validateRequest(mallParamSchema, 'params'), controller.addFloor);
router.post(
  '/:mallId/parking/upgrade',
  validateRequest(mallParamSchema, 'params'),
  controller.upgradeParking
);
router.post(
  '/:mallId/units',
  validateRequest(mallParamSchema, 'params'),
  validateRequest(createUnitSchema),
  controller.createUnit
);
router.patch(
  '/:mallId/units/:unitId/lease',
  validateRequest(unitParamSchema, 'params'),
  validateRequest(updateLeaseSchema),
  controller.updateLease
);
router.post(
  '/:mallId/rent/collect',
  validateRequest(mallParamSchema, 'params'),
  controller.collectRent
);

export default router;
