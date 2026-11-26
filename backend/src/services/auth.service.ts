import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { env } from '../config/env';
import { withTransaction } from '../database/pool';
import { AuthRepository } from '../repositories/auth.repository';
import {
  AuthResponseDTO,
  GameOverviewDTO,
  PlayerProfileDTO,
  PublicUser,
  UserRecord,
} from '../types/auth.types';
import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from '../utils/errors';
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { EmailService } from './email.service';

function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    status: user.status,
    lastLoginAt: user.last_login_at,
    createdAt: user.created_at,
  };
}

function getRefreshExpiryDate(): Date {
  const days = 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export class AuthService {
  private readonly authRepository = new AuthRepository();
  private readonly emailService = new EmailService();

  async register(input: {
    email: string;
    username: string;
    password: string;
    displayName?: string;
  }): Promise<{ auth: AuthResponseDTO; refreshToken: string }> {
    const email = input.email.trim().toLowerCase();
    const username = input.username.trim();
    const displayName = (input.displayName ?? username).trim();

    const existingEmail = await this.authRepository.findUserByEmail(email);
    if (existingEmail) {
      throw new ConflictError('An account with this email already exists');
    }

    const existingUsername = await this.authRepository.findUserByUsername(username);
    if (existingUsername) {
      throw new ConflictError('This username is already taken');
    }

    const passwordHash = await bcrypt.hash(input.password, env.security.bcryptRounds);

    const { userId, playerId } = await withTransaction(async (conn) => {
      const createdUserId = await this.authRepository.createUser(
        email,
        username,
        passwordHash,
        'PLAYER',
        conn
      );
      const createdPlayerId = await this.authRepository.initializePlayerWorld(
        createdUserId,
        displayName,
        conn
      );
      return { userId: createdUserId, playerId: createdPlayerId };
    });

    const user = await this.authRepository.findUserById(userId);
    const profile = await this.authRepository.getPlayerProfileByUserId(userId);
    const overview = await this.authRepository.getGameOverview(playerId);

    if (!user || !profile) {
      throw new Error('Failed to load newly created player account');
    }

    const payload = { userId: user.id, playerId: profile.id, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await this.authRepository.saveRefreshToken(
      user.id,
      hashToken(refreshToken),
      getRefreshExpiryDate()
    );

    return {
      auth: {
        accessToken,
        user: toPublicUser(user),
        profile,
        overview,
      },
      refreshToken,
    };
  }

  async login(input: {
    email: string;
    password: string;
  }): Promise<{ auth: AuthResponseDTO; refreshToken: string }> {
    const email = input.email.trim().toLowerCase();
    const user = await this.authRepository.findUserByEmail(email);

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const passwordMatch = await bcrypt.compare(input.password, user.password_hash);
    if (!passwordMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenError(`Account is ${user.status.toLowerCase()}. Please contact support.`);
    }

    await this.authRepository.updateLastLogin(user.id);
    const profile = await this.authRepository.getPlayerProfileByUserId(user.id);
    if (!profile) {
      throw new NotFoundError('Player profile not found');
    }

    const overview = await this.authRepository.getGameOverview(profile.id);
    const payload = { userId: user.id, playerId: profile.id, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await this.authRepository.saveRefreshToken(
      user.id,
      hashToken(refreshToken),
      getRefreshExpiryDate()
    );

    return {
      auth: {
        accessToken,
        user: toPublicUser(user),
        profile,
        overview,
      },
      refreshToken,
    };
  }

  async refresh(rawRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    if (!rawRefreshToken) {
      throw new UnauthorizedError('Refresh token missing');
    }

    let decoded: { userId: number; playerId: number };
    try {
      decoded = verifyRefreshToken(rawRefreshToken);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const tokenHash = hashToken(rawRefreshToken);
    const storedToken = await this.authRepository.findValidRefreshToken(tokenHash);
    if (!storedToken) {
      throw new UnauthorizedError('Refresh token has been revoked or expired');
    }

    const user = await this.authRepository.findUserById(decoded.userId);
    if (!user || user.status !== 'ACTIVE') {
      throw new ForbiddenError('Account is inactive or unavailable');
    }

    const profile = await this.authRepository.getPlayerProfileByUserId(user.id);
    if (!profile) {
      throw new NotFoundError('Player profile not found');
    }

    await this.authRepository.revokeRefreshToken(tokenHash);

    const payload = { userId: user.id, playerId: profile.id, role: user.role };
    const newAccessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);

    await this.authRepository.saveRefreshToken(
      user.id,
      hashToken(newRefreshToken),
      getRefreshExpiryDate()
    );

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(rawRefreshToken?: string): Promise<void> {
    if (!rawRefreshToken) {
      return;
    }
    await this.authRepository.revokeRefreshToken(hashToken(rawRefreshToken));
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const matches = await bcrypt.compare(currentPassword, user.password_hash);
    if (!matches) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(newPassword, env.security.bcryptRounds);
    await withTransaction(async (conn) => {
      await this.authRepository.updatePasswordHash(user.id, newHash, conn);
      await this.authRepository.revokeAllUserRefreshTokens(user.id, conn);
    });
  }

  async getProfile(userId: number): Promise<{
    user: PublicUser;
    profile: PlayerProfileDTO;
    overview: GameOverviewDTO;
  }> {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const profile = await this.authRepository.getPlayerProfileByUserId(userId);
    if (!profile) {
      throw new NotFoundError('Player profile not found');
    }

    const overview = await this.authRepository.getGameOverview(profile.id);
    return { user: toPublicUser(user), profile, overview };
  }

  async updateProfile(
    userId: number,
    playerId: number,
    displayName: string,
    avatarKey?: string
  ): Promise<{ user: PublicUser; profile: PlayerProfileDTO; overview: GameOverviewDTO }> {
    await this.authRepository.updatePlayerProfile(playerId, displayName.trim(), avatarKey);
    return this.getProfile(userId);
  }

  async forgotPassword(emailInput: string): Promise<void> {
    const email = emailInput.trim().toLowerCase();
    const user = await this.authRepository.findUserByEmail(email);
    if (!user || user.status !== 'ACTIVE') {
      // Return silently to prevent email enumeration
      return;
    }

    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawResetToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.authRepository.savePasswordResetToken(user.id, tokenHash, expiresAt);
    await this.emailService.sendPasswordReset(user.email, rawResetToken);
  }

  async resetPassword(rawResetToken: string, newPassword: string): Promise<void> {
    const tokenHash = hashToken(rawResetToken);
    const record = await this.authRepository.findValidPasswordResetToken(tokenHash);
    if (!record) {
      throw new UnauthorizedError('Password reset token is invalid or expired');
    }

    const newHash = await bcrypt.hash(newPassword, env.security.bcryptRounds);
    await withTransaction(async (conn) => {
      await this.authRepository.updatePasswordHash(record.user_id, newHash, conn);
      await this.authRepository.markPasswordResetTokenUsed(record.id, conn);
      await this.authRepository.revokeAllUserRefreshTokens(record.user_id, conn);
    });
  }
}
