import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import Joi from 'joi';
import { AuthController } from '../controllers/auth.controller';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();
const authController = new AuthController();

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again later.',
    },
  },
});

const registerSchema = Joi.object({
  email: Joi.string().email().max(255).required(),
  username: Joi.string().alphanum().min(3).max(32).required(),
  password: Joi.string().min(8).max(128).required(),
  displayName: Joi.string().min(2).max(64).optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().max(255).required(),
  password: Joi.string().min(1).max(128).required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(1).max(128).required(),
  newPassword: Joi.string().min(8).max(128).required(),
});

const updateProfileSchema = Joi.object({
  displayName: Joi.string().min(2).max(64).required(),
  avatarKey: Joi.string().min(2).max(64).optional(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().max(255).required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().min(16).max(256).required(),
  newPassword: Joi.string().min(8).max(128).required(),
});

router.post('/register', authRateLimiter, validateRequest(registerSchema), authController.register);
router.post('/login', authRateLimiter, validateRequest(loginSchema), authController.login);
router.post('/refresh', authRateLimiter, authController.refresh);
router.post('/logout', authController.logout);
router.post(
  '/forgot-password',
  authRateLimiter,
  validateRequest(forgotPasswordSchema),
  authController.forgotPassword
);
router.post(
  '/reset-password',
  authRateLimiter,
  validateRequest(resetPasswordSchema),
  authController.resetPassword
);

router.post(
  '/change-password',
  authenticateJWT,
  validateRequest(changePasswordSchema),
  authController.changePassword
);
router.get('/profile', authenticateJWT, authController.getProfile);
router.patch(
  '/profile',
  authenticateJWT,
  validateRequest(updateProfileSchema),
  authController.updateProfile
);

export default router;
