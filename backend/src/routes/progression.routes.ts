import { Router } from 'express';
import Joi from 'joi';
import { ProgressionController } from '../controllers/progression.controller';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();
const progressionController = new ProgressionController();

const missionParamsSchema = Joi.object({
  missionId: Joi.number().integer().positive().required(),
});

const achievementParamsSchema = Joi.object({
  achievementId: Joi.number().integer().positive().required(),
});

router.use(authenticateJWT);

router.get('/', progressionController.getDashboard);
router.post('/levels/unlock', progressionController.unlockNextLevel);
router.post(
  '/missions/:missionId/claim',
  validateRequest(missionParamsSchema, 'params'),
  progressionController.claimMission
);
router.post(
  '/achievements/:achievementId/claim',
  validateRequest(achievementParamsSchema, 'params'),
  progressionController.claimAchievement
);

export default router;
