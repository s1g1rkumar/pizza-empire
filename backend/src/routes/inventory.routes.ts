import { Router } from 'express';
import Joi from 'joi';
import { InventoryController } from '../controllers/inventory.controller';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();
const inventoryController = new InventoryController();

const marketTradeSchema = Joi.object({
  businessId: Joi.number().integer().positive().required(),
  itemId: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().min(1).max(10000).required(),
});

const transferSchema = Joi.object({
  fromBusinessId: Joi.number().integer().positive().required(),
  toBusinessId: Joi.number().integer().positive().required(),
  itemId: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().min(1).max(10000).required(),
});

router.use(authenticateJWT);

router.get('/', inventoryController.getDashboard);
router.post('/buy', validateRequest(marketTradeSchema), inventoryController.buyItem);
router.post('/sell', validateRequest(marketTradeSchema), inventoryController.sellItem);
router.post('/transfer', validateRequest(transferSchema), inventoryController.transferItem);

export default router;
