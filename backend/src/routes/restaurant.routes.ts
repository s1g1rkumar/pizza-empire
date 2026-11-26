import { Router } from 'express';
import Joi from 'joi';
import { RestaurantController } from '../controllers/restaurant.controller';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();
const restaurantController = new RestaurantController();

const restaurantParamsSchema = Joi.object({
  restaurantId: Joi.number().integer().positive().required(),
});

const menuParamsSchema = Joi.object({
  restaurantId: Joi.number().integer().positive().required(),
  menuId: Joi.number().integer().positive().required(),
});

const constructSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  restaurantType: Joi.string()
    .valid('SMALL_SHOP', 'STANDARD', 'PREMIUM', 'FAMILY', 'LUXURY')
    .required(),
  locationId: Joi.number().integer().positive().required(),
});

const upgradeSchema = Joi.object({
  upgradeType: Joi.string().valid('OVEN', 'TABLES', 'DECOR').required(),
});

const updateMenuSchema = Joi.object({
  customPrice: Joi.number().positive().max(1000).optional(),
  isEnabled: Joi.boolean().optional(),
  upgradeStarQuality: Joi.boolean().optional(),
});

router.use(authenticateJWT);

router.get('/', restaurantController.getDashboard);
router.post('/construct', validateRequest(constructSchema), restaurantController.construct);
router.post(
  '/:restaurantId/upgrade',
  validateRequest(restaurantParamsSchema, 'params'),
  validateRequest(upgradeSchema),
  restaurantController.upgrade
);
router.patch(
  '/:restaurantId/menu/:menuId',
  validateRequest(menuParamsSchema, 'params'),
  validateRequest(updateMenuSchema),
  restaurantController.updateMenu
);
router.post(
  '/:restaurantId/serve',
  validateRequest(restaurantParamsSchema, 'params'),
  restaurantController.serve
);

export default router;
