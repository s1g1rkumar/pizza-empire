import { Router } from 'express';
import Joi from 'joi';
import { UpgradeController } from '../controllers/upgrade.controller';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();
const upgradeController = new UpgradeController();

const upgradeParamsSchema = Joi.object({
  upgradeCode: Joi.string()
    .pattern(/^[A-Z0-9_]+$/)
    .max(64)
    .required(),
});

router.use(authenticateJWT);

router.get('/', upgradeController.getDashboard);
router.post(
  '/:upgradeCode/purchase',
  validateRequest(upgradeParamsSchema, 'params'),
  upgradeController.purchase
);

export default router;
