import { Router } from 'express';
import Joi from 'joi';
import { ProductionController } from '../controllers/production.controller';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();
const productionController = new ProductionController();

const startOrderSchema = Joi.object({
  recipeId: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().min(1).max(100).required(),
});

const orderParamsSchema = Joi.object({
  orderId: Joi.number().integer().positive().required(),
});

router.use(authenticateJWT);

router.get('/', productionController.getDashboard);
router.post('/orders', validateRequest(startOrderSchema), productionController.startOrder);
router.post(
  '/orders/:orderId/cancel',
  validateRequest(orderParamsSchema, 'params'),
  productionController.cancelOrder
);

export default router;
