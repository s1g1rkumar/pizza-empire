import { Router } from 'express';
import Joi from 'joi';
import { DeliveryController } from '../controllers/delivery.controller';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();
const deliveryController = new DeliveryController();

const vehicleParamsSchema = Joi.object({
  vehicleId: Joi.number().integer().positive().required(),
});

const buyVehicleSchema = Joi.object({
  vehicleType: Joi.string()
    .valid('BICYCLE', 'SCOOTER', 'MOTORCYCLE', 'CAR', 'DELIVERY_VAN')
    .required(),
  name: Joi.string().min(2).max(64).required(),
});

const dispatchSchema = Joi.object({
  restaurantId: Joi.number().integer().positive().required(),
  itemId: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().min(1).max(50).required(),
  zoneId: Joi.number().integer().positive().required(),
  vehicleId: Joi.number().integer().positive().required(),
  driverEmployeeId: Joi.number().integer().positive().optional(),
});

router.use(authenticateJWT);

router.get('/', deliveryController.getDashboard);
router.post('/vehicles/buy', validateRequest(buyVehicleSchema), deliveryController.buyVehicle);
router.post(
  '/vehicles/:vehicleId/upgrade',
  validateRequest(vehicleParamsSchema, 'params'),
  deliveryController.upgradeVehicle
);
router.post('/dispatch', validateRequest(dispatchSchema), deliveryController.dispatchOrder);

export default router;
