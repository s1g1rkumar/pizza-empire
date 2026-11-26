import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { AuthService } from '../services/auth.service';

const REFRESH_COOKIE_NAME = 'pizza_refresh_token';

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth',
  });
}

export class AuthController {
  private readonly authService = new AuthService();

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { auth, refreshToken } = await this.authService.register(req.body);
      setRefreshCookie(res, refreshToken);
      res.status(201).json({ success: true, data: auth });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { auth, refreshToken } = await this.authService.login(req.body);
      setRefreshCookie(res, refreshToken);
      res.status(200).json({ success: true, data: auth });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cookieToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
      const { accessToken, refreshToken } = await this.authService.refresh(cookieToken ?? '');
      setRefreshCookie(res, refreshToken);
      res.status(200).json({ success: true, data: { accessToken } });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cookieToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
      await this.authService.logout(cookieToken);
      clearRefreshCookie(res);
      res.status(200).json({ success: true, data: { message: 'Logged out successfully' } });
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.authService.changePassword(
        req.user!.userId,
        req.body.currentPassword,
        req.body.newPassword
      );
      clearRefreshCookie(res);
      res.status(200).json({
        success: true,
        data: { message: 'Password updated successfully. Please log in again.' },
      });
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.authService.getProfile(req.user!.userId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.authService.updateProfile(
        req.user!.userId,
        req.user!.playerId,
        req.body.displayName,
        req.body.avatarKey
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.authService.forgotPassword(req.body.email);
      res.status(200).json({
        success: true,
        data: {
          message: 'If an account with that email exists, a password reset link has been sent.',
        },
      });
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.authService.resetPassword(req.body.token, req.body.newPassword);
      res.status(200).json({
        success: true,
        data: { message: 'Password has been reset successfully.' },
      });
    } catch (error) {
      next(error);
    }
  };
}
