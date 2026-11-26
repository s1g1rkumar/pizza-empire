import { Router } from 'express';
import Joi from 'joi';
import { FinanceController } from '../controllers/finance.controller';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();
const financeController = new FinanceController();

const filterQuerySchema = Joi.object({
  transactionType: Joi.string()
    .valid('REVENUE', 'EXPENSE', 'CAPEX', 'LOAN_IN', 'LOAN_REPAY', 'REWARD', 'ADMIN_ADJUST')
    .optional(),
  category: Joi.string().max(64).optional(),
});

const payOpexSchema = Joi.object({
  category: Joi.string().valid('ELECTRICITY', 'MAINTENANCE', 'RENT', 'MARKETING').required(),
  amount: Joi.number().positive().max(1000000).required(),
  idempotencyKey: Joi.string().min(4).max(48).required(),
  description: Joi.string().max(200).optional(),
});

router.use(authenticateJWT);

router.get('/', validateRequest(filterQuerySchema, 'query'), financeController.getDashboard);
router.post(
  '/operating-costs/pay',
  validateRequest(payOpexSchema),
  financeController.payOperatingExpense
);

export default router;
