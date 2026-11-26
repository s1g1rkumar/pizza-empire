import { Router } from 'express';
import Joi from 'joi';
import { EmployeeController } from '../controllers/employee.controller';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();
const employeeController = new EmployeeController();

const DEPARTMENTS = [
  'FARMING',
  'PRODUCTION',
  'RESTAURANT',
  'DELIVERY',
  'RETAIL',
  'LOGISTICS',
  'MANAGEMENT',
  'CORPORATE',
];

const listQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(15),
  department: Joi.string()
    .valid(...DEPARTMENTS)
    .optional(),
  status: Joi.string().valid('ACTIVE', 'ON_LEAVE', 'STRIKING').optional(),
  businessId: Joi.number().integer().positive().optional(),
  search: Joi.string().max(64).allow('').optional(),
});

const employeeParamsSchema = Joi.object({
  employeeId: Joi.number().integer().positive().required(),
});

const hireSchema = Joi.object({
  fullName: Joi.string().min(2).max(128).required(),
  department: Joi.string()
    .valid(...DEPARTMENTS)
    .required(),
  role: Joi.string().max(64).required(),
  skillLevel: Joi.number().integer().min(1).max(10).required(),
  hourlyWage: Joi.number().positive().max(1000).required(),
  businessId: Joi.number().integer().positive().optional(),
});

const assignSchema = Joi.object({
  businessId: Joi.number().integer().positive().required(),
  department: Joi.string()
    .valid(...DEPARTMENTS)
    .optional(),
});

const salarySchema = Joi.object({
  hourlyWage: Joi.number().positive().max(1000).required(),
});

router.use(authenticateJWT);

router.get('/', validateRequest(listQuerySchema, 'query'), employeeController.getDashboard);
router.get('/candidates', employeeController.getCandidates);
router.post('/hire', validateRequest(hireSchema), employeeController.hire);
router.post('/payroll/run', employeeController.runPayroll);
router.post(
  '/:employeeId/assign',
  validateRequest(employeeParamsSchema, 'params'),
  validateRequest(assignSchema),
  employeeController.assign
);
router.post(
  '/:employeeId/train',
  validateRequest(employeeParamsSchema, 'params'),
  employeeController.train
);
router.post(
  '/:employeeId/promote',
  validateRequest(employeeParamsSchema, 'params'),
  employeeController.promote
);
router.patch(
  '/:employeeId/salary',
  validateRequest(employeeParamsSchema, 'params'),
  validateRequest(salarySchema),
  employeeController.updateSalary
);
router.post(
  '/:employeeId/fire',
  validateRequest(employeeParamsSchema, 'params'),
  employeeController.fire
);

export default router;
