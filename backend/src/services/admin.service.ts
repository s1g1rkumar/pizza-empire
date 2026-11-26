import bcrypt from 'bcrypt';
import { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { withTransaction } from '../database/pool';
import { AdminRepository } from '../repositories/admin.repository';
import { UserRole } from '../types/auth.types';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '../utils/errors';
import { hashToken, signAccessToken, signRefreshToken } from '../utils/jwt';

export class AdminService {
  private readonly adminRepo = new AdminRepository();

  private async logAudit(
    conn: PoolConnection,
    params: {
      actorUserId: number;
      targetPlayerId?: number | null;
      actionType: string;
      beforeState?: unknown;
      afterState?: unknown;
      ipAddress?: string;
    }
  ): Promise<void> {
    await conn.query(
      `INSERT INTO audit_logs
         (actor_user_id, target_player_id, action_type, before_state, after_state, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        params.actorUserId,
        params.targetPlayerId ?? null,
        params.actionType,
        params.beforeState !== undefined ? JSON.stringify(params.beforeState) : null,
        params.afterState !== undefined ? JSON.stringify(params.afterState) : null,
        params.ipAddress ?? null,
      ]
    );
  }

  async adminLogin(
    email: string,
    password: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: { id: number; email: string; username: string; role: UserRole };
  }> {
    return withTransaction(async (conn) => {
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT id, email, username, password_hash AS passwordHash, role, status
         FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1`,
        [email.trim().toLowerCase()]
      );
      const user = rows[0];
      if (!user) {
        throw new UnauthorizedError('Invalid administrator credentials');
      }

      const valid = await bcrypt.compare(password, String(user.passwordHash));
      if (!valid) {
        throw new UnauthorizedError('Invalid administrator credentials');
      }

      const role = String(user.role) as UserRole;
      if (role !== 'ADMIN' && role !== 'MODERATOR') {
        throw new ForbiddenError('Administrator or moderator privileges required');
      }

      if (String(user.status) !== 'ACTIVE') {
        throw new ForbiddenError('Administrator account is not active');
      }

      const [pRows] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM player_profiles WHERE user_id = ? LIMIT 1`,
        [Number(user.id)]
      );
      const playerId = Number(pRows[0]?.id ?? 0);

      const accessToken = signAccessToken({
        userId: Number(user.id),
        playerId,
        role,
      });

      const refreshToken = signRefreshToken({
        userId: Number(user.id),
        playerId,
        role,
      });
      const expiresAt = new Date(Date.now() + 7 * 86400000);

      await conn.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)`,
        [Number(user.id), hashToken(refreshToken), expiresAt]
      );
      await conn.query(`UPDATE users SET last_login_at = UTC_TIMESTAMP() WHERE id = ?`, [
        Number(user.id),
      ]);

      await this.logAudit(conn, {
        actorUserId: Number(user.id),
        actionType: 'ADMIN_LOGIN',
        afterState: { role },
      });

      return {
        accessToken,
        refreshToken,
        user: {
          id: Number(user.id),
          email: String(user.email),
          username: String(user.username),
          role,
        },
      };
    });
  }

  async getAnalytics() {
    return this.adminRepo.getAnalytics();
  }

  async getPlayers(search?: string, status?: string) {
    return this.adminRepo.getPlayers(search, status);
  }

  async getConfiguration() {
    return this.adminRepo.getAllConfigurationData();
  }

  async getReports() {
    return this.adminRepo.getReports();
  }

  async updatePlayerAccount(
    actorUserId: number,
    userId: number,
    payload: {
      status?: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
      role?: UserRole;
      cashBalance?: number;
      gemsBalance?: number;
    },
    ipAddress?: string
  ) {
    await withTransaction(async (conn) => {
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT u.id, u.status, u.role, pp.id AS playerId, pp.cash_balance AS cashBalance, pp.gems_balance AS gemsBalance
         FROM users u
         LEFT JOIN player_profiles pp ON pp.user_id = u.id
         WHERE u.id = ? AND u.deleted_at IS NULL FOR UPDATE`,
        [userId]
      );
      const target = rows[0];
      if (!target) throw new NotFoundError('User not found');

      const nextStatus = payload.status ?? String(target.status);
      const nextRole = payload.role ?? String(target.role);

      await conn.query(`UPDATE users SET status = ?, role = ? WHERE id = ?`, [
        nextStatus,
        nextRole,
        userId,
      ]);

      if (target.playerId) {
        const nextCash =
          payload.cashBalance !== undefined ? payload.cashBalance : Number(target.cashBalance);
        const nextGems =
          payload.gemsBalance !== undefined ? payload.gemsBalance : Number(target.gemsBalance);
        await conn.query(
          `UPDATE player_profiles SET cash_balance = ?, gems_balance = ? WHERE id = ?`,
          [nextCash, nextGems, Number(target.playerId)]
        );
      }

      await this.logAudit(conn, {
        actorUserId,
        targetPlayerId: target.playerId ? Number(target.playerId) : null,
        actionType: 'UPDATE_PLAYER_ACCOUNT',
        beforeState: target,
        afterState: payload,
        ipAddress,
      });
    });

    return this.adminRepo.getPlayers();
  }

  async updatePlayerProgression(
    actorUserId: number,
    playerId: number,
    payload: {
      xpLevel?: number;
      currentXp?: number;
      stageNumber?: number;
      reputation?: number;
    },
    ipAddress?: string
  ) {
    await withTransaction(async (conn) => {
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT pr.id, pr.xp_level AS xpLevel, pr.current_xp AS currentXp, pr.current_level_id AS currentLevelId,
                pp.reputation
         FROM player_progression pr
         INNER JOIN player_profiles pp ON pp.id = pr.player_id
         WHERE pr.player_id = ? FOR UPDATE`,
        [playerId]
      );
      const prog = rows[0];
      if (!prog) throw new NotFoundError('Player progression record not found');

      let nextLevelId = Number(prog.currentLevelId);
      if (payload.stageNumber !== undefined) {
        const [lvlRows] = await conn.query<RowDataPacket[]>(
          `SELECT id FROM game_levels WHERE level_number = ? LIMIT 1`,
          [payload.stageNumber]
        );
        if (!lvlRows[0]) throw new NotFoundError('Game stage level not found');
        nextLevelId = Number(lvlRows[0].id);
      }

      await conn.query(
        `UPDATE player_progression
         SET xp_level = ?, current_xp = ?, current_level_id = ?
         WHERE player_id = ?`,
        [
          payload.xpLevel ?? Number(prog.xpLevel),
          payload.currentXp ?? Number(prog.currentXp),
          nextLevelId,
          playerId,
        ]
      );

      if (payload.reputation !== undefined) {
        await conn.query(`UPDATE player_profiles SET reputation = ? WHERE id = ?`, [
          payload.reputation,
          playerId,
        ]);
      }

      await this.logAudit(conn, {
        actorUserId,
        targetPlayerId: playerId,
        actionType: 'UPDATE_PLAYER_PROGRESSION',
        beforeState: prog,
        afterState: payload,
        ipAddress,
      });
    });

    return this.adminRepo.getPlayers();
  }

  async updateCrop(
    actorUserId: number,
    cropId: number,
    payload: {
      seedCost: number;
      growthSeconds: number;
      baseYield: number;
      marketSellPrice: number;
      unlockXpLevel: number;
    },
    ipAddress?: string
  ) {
    await withTransaction(async (conn) => {
      const [rows] = await conn.query<RowDataPacket[]>(`SELECT * FROM crops WHERE id = ?`, [
        cropId,
      ]);
      if (!rows[0]) throw new NotFoundError('Crop not found');

      await conn.query(
        `UPDATE crops
         SET seed_cost = ?, growth_seconds = ?, base_yield = ?, market_sell_price = ?, unlock_xp_level = ?
         WHERE id = ?`,
        [
          payload.seedCost,
          payload.growthSeconds,
          payload.baseYield,
          payload.marketSellPrice,
          payload.unlockXpLevel,
          cropId,
        ]
      );

      await this.logAudit(conn, {
        actorUserId,
        actionType: 'UPDATE_CROP_CONFIG',
        beforeState: rows[0],
        afterState: payload,
        ipAddress,
      });
    });

    return this.adminRepo.getAllConfigurationData();
  }

  async updateProduct(
    actorUserId: number,
    itemId: number,
    payload: {
      unitWholesaleBuy: number;
      unitWholesaleSell: number;
      lowStockThreshold: number;
    },
    ipAddress?: string
  ) {
    await withTransaction(async (conn) => {
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT * FROM inventory_items WHERE id = ?`,
        [itemId]
      );
      if (!rows[0]) throw new NotFoundError('Product item not found');

      await conn.query(
        `UPDATE inventory_items
         SET unit_wholesale_buy = ?, unit_wholesale_sell = ?, low_stock_threshold = ?
         WHERE id = ?`,
        [payload.unitWholesaleBuy, payload.unitWholesaleSell, payload.lowStockThreshold, itemId]
      );

      await this.logAudit(conn, {
        actorUserId,
        actionType: 'UPDATE_PRODUCT_CONFIG',
        beforeState: rows[0],
        afterState: payload,
        ipAddress,
      });
    });

    return this.adminRepo.getAllConfigurationData();
  }

  async updateLocation(
    actorUserId: number,
    locationId: number,
    payload: {
      demandMultiplier: number;
      rentMultiplier: number;
      priceElasticity: number;
    },
    ipAddress?: string
  ) {
    await withTransaction(async (conn) => {
      const [rows] = await conn.query<RowDataPacket[]>(`SELECT * FROM locations WHERE id = ?`, [
        locationId,
      ]);
      if (!rows[0]) throw new NotFoundError('Location not found');

      await conn.query(
        `UPDATE locations
         SET demand_multiplier = ?, rent_multiplier = ?, price_elasticity = ?
         WHERE id = ?`,
        [payload.demandMultiplier, payload.rentMultiplier, payload.priceElasticity, locationId]
      );

      await this.logAudit(conn, {
        actorUserId,
        actionType: 'UPDATE_LOCATION_CONFIG',
        beforeState: rows[0],
        afterState: payload,
        ipAddress,
      });
    });

    return this.adminRepo.getAllConfigurationData();
  }

  async updateUpgrade(
    actorUserId: number,
    upgradeId: number,
    payload: {
      baseCost: number;
      costMultiplier: number;
      effectValue: number;
      maxLevel: number;
      isActive: boolean;
    },
    ipAddress?: string
  ) {
    await withTransaction(async (conn) => {
      const [rows] = await conn.query<RowDataPacket[]>(`SELECT * FROM upgrades WHERE id = ?`, [
        upgradeId,
      ]);
      if (!rows[0]) throw new NotFoundError('Upgrade not found');

      await conn.query(
        `UPDATE upgrades
         SET base_cost = ?, cost_multiplier = ?, effect_value = ?, max_level = ?, is_active = ?
         WHERE id = ?`,
        [
          payload.baseCost,
          payload.costMultiplier,
          payload.effectValue,
          payload.maxLevel,
          payload.isActive ? 1 : 0,
          upgradeId,
        ]
      );

      await this.logAudit(conn, {
        actorUserId,
        actionType: 'UPDATE_UPGRADE_CONFIG',
        beforeState: rows[0],
        afterState: payload,
        ipAddress,
      });
    });

    return this.adminRepo.getAllConfigurationData();
  }

  async updateMission(
    actorUserId: number,
    missionId: number,
    payload: {
      targetValue: number;
      rewardCash: number;
      rewardXp: number;
      rewardGems: number;
      isActive: boolean;
    },
    ipAddress?: string
  ) {
    await withTransaction(async (conn) => {
      const [rows] = await conn.query<RowDataPacket[]>(`SELECT * FROM missions WHERE id = ?`, [
        missionId,
      ]);
      if (!rows[0]) throw new NotFoundError('Mission not found');

      await conn.query(
        `UPDATE missions
         SET target_value = ?, reward_cash = ?, reward_xp = ?, reward_gems = ?, is_active = ?
         WHERE id = ?`,
        [
          payload.targetValue,
          payload.rewardCash,
          payload.rewardXp,
          payload.rewardGems,
          payload.isActive ? 1 : 0,
          missionId,
        ]
      );

      await this.logAudit(conn, {
        actorUserId,
        actionType: 'UPDATE_MISSION_CONFIG',
        beforeState: rows[0],
        afterState: payload,
        ipAddress,
      });
    });

    return this.adminRepo.getAllConfigurationData();
  }

  async updateAchievement(
    actorUserId: number,
    achievementId: number,
    payload: {
      targetValue: number;
      rewardCash: number;
      rewardXp: number;
      rewardGems: number;
      isActive: boolean;
    },
    ipAddress?: string
  ) {
    await withTransaction(async (conn) => {
      const [rows] = await conn.query<RowDataPacket[]>(`SELECT * FROM achievements WHERE id = ?`, [
        achievementId,
      ]);
      if (!rows[0]) throw new NotFoundError('Achievement not found');

      await conn.query(
        `UPDATE achievements
         SET target_value = ?, reward_cash = ?, reward_xp = ?, reward_gems = ?, is_active = ?
         WHERE id = ?`,
        [
          payload.targetValue,
          payload.rewardCash,
          payload.rewardXp,
          payload.rewardGems,
          payload.isActive ? 1 : 0,
          achievementId,
        ]
      );

      await this.logAudit(conn, {
        actorUserId,
        actionType: 'UPDATE_ACHIEVEMENT_CONFIG',
        beforeState: rows[0],
        afterState: payload,
        ipAddress,
      });
    });

    return this.adminRepo.getAllConfigurationData();
  }

  async updateSetting(
    actorUserId: number,
    settingKey: string,
    settingValue: string,
    ipAddress?: string
  ) {
    await withTransaction(async (conn) => {
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT * FROM game_settings WHERE setting_key = ?`,
        [settingKey]
      );
      if (!rows[0]) throw new NotFoundError('Game setting not found');

      await conn.query(
        `UPDATE game_settings SET setting_value = ?, updated_by_user_id = ? WHERE setting_key = ?`,
        [settingValue, actorUserId, settingKey]
      );

      await this.logAudit(conn, {
        actorUserId,
        actionType: 'UPDATE_GAME_SETTING',
        beforeState: rows[0],
        afterState: { settingKey, settingValue },
        ipAddress,
      });
    });

    return this.adminRepo.getAllConfigurationData();
  }

  async createAnnouncement(
    actorUserId: number,
    payload: {
      title: string;
      message: string;
      severity: 'INFO' | 'WARNING' | 'EVENT' | 'MAINTENANCE';
    },
    ipAddress?: string
  ) {
    await withTransaction(async (conn) => {
      await conn.query(
        `INSERT INTO game_announcements (title, message, severity, is_active, created_by_user_id)
         VALUES (?, ?, ?, 1, ?)`,
        [payload.title.trim(), payload.message.trim(), payload.severity, actorUserId]
      );

      await this.logAudit(conn, {
        actorUserId,
        actionType: 'CREATE_ANNOUNCEMENT',
        afterState: payload,
        ipAddress,
      });
    });

    return this.adminRepo.getAllConfigurationData();
  }

  async toggleAnnouncement(
    actorUserId: number,
    announcementId: number,
    isActive: boolean,
    ipAddress?: string
  ) {
    await withTransaction(async (conn) => {
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT * FROM game_announcements WHERE id = ?`,
        [announcementId]
      );
      if (!rows[0]) throw new NotFoundError('Announcement not found');

      await conn.query(`UPDATE game_announcements SET is_active = ? WHERE id = ?`, [
        isActive ? 1 : 0,
        announcementId,
      ]);

      await this.logAudit(conn, {
        actorUserId,
        actionType: 'TOGGLE_ANNOUNCEMENT',
        beforeState: rows[0],
        afterState: { announcementId, isActive },
        ipAddress,
      });
    });

    return this.adminRepo.getAllConfigurationData();
  }
}
