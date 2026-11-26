import { Router } from 'express';
import Joi from 'joi';
import { GameEngineController } from '../controllers/gameEngine.controller';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();
const gameEngineController = new GameEngineController();

const claimOfflineSchema = Joi.object({
  sessionId: Joi.number().integer().positive().required(),
});

router.post('/sync', authenticateJWT, gameEngineController.syncEmpire);
router.post(
  '/offline/claim',
  authenticateJWT,
  validateRequest(claimOfflineSchema),
  gameEngineController.claimOffline
);

export default router;
