import { Router } from 'express';
import Joi from 'joi';
import { ChainController } from '../controllers/chain.controller';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();
const chainController = new ChainController();

const restaurantParamsSchema = Joi.object({
  restaurantId: Joi.number().integer().positive().required(),
});

const assignManagerSchema = Joi.object({
  managerEmployeeId: Joi.number().integer().positive().required(),
});

router.use(authenticateJWT);

router.get('/', chainController.getDashboard);
router.post(
  '/restaurants/:restaurantId/assign-manager',
  validateRequest(restaurantParamsSchema, 'params'),
  validateRequest(assignManagerSchema),
  chainController.assignManager
);
router.post(
  '/restaurants/:restaurantId/rent/pay',
  validateRequest(restaurantParamsSchema, 'params'),
  chainController.payRent
);

export default router;
