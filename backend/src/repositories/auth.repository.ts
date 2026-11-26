import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { dbPool } from '../database/pool';
import { GameOverviewDTO, PlayerProfileDTO, UserRecord, UserRole } from '../types/auth.types';

export class AuthRepository {
  async findUserByEmail(email: string, conn?: PoolConnection): Promise<UserRecord | null> {
    const executor = conn ?? dbPool;
    const [rows] = await executor.query<RowDataPacket[]>(
      `SELECT id, email, username, password_hash, role, status, last_login_at, created_at
       FROM users
       WHERE email = ? AND deleted_at IS NULL
       LIMIT 1`,
      [email]
    );
    return (rows[0] as UserRecord | undefined) ?? null;
  }

  async findUserByUsername(username: string, conn?: PoolConnection): Promise<UserRecord | null> {
    const executor = conn ?? dbPool;
    const [rows] = await executor.query<RowDataPacket[]>(
      `SELECT id, email, username, password_hash, role, status, last_login_at, created_at
       FROM users
       WHERE username = ? AND deleted_at IS NULL
       LIMIT 1`,
      [username]
    );
    return (rows[0] as UserRecord | undefined) ?? null;
  }

  async findUserById(userId: number, conn?: PoolConnection): Promise<UserRecord | null> {
    const executor = conn ?? dbPool;
    const [rows] = await executor.query<RowDataPacket[]>(
      `SELECT id, email, username, password_hash, role, status, last_login_at, created_at
       FROM users
       WHERE id = ? AND deleted_at IS NULL
       LIMIT 1`,
      [userId]
    );
    return (rows[0] as UserRecord | undefined) ?? null;
  }

  async createUser(
    email: string,
    username: string,
    passwordHash: string,
    role: UserRole = 'PLAYER',
    conn: PoolConnection
  ): Promise<number> {
    const [result] = await conn.query<ResultSetHeader>(
      `INSERT INTO users (email, username, password_hash, role, status)
       VALUES (?, ?, ?, ?, 'ACTIVE')`,
      [email, username, passwordHash, role]
    );
    return result.insertId;
  }

  async updateLastLogin(userId: number, conn?: PoolConnection): Promise<void> {
    const executor = conn ?? dbPool;
    await executor.query(`UPDATE users SET last_login_at = UTC_TIMESTAMP() WHERE id = ?`, [userId]);
  }

  async updatePasswordHash(
    userId: number,
    passwordHash: string,
    conn?: PoolConnection
  ): Promise<void> {
    const executor = conn ?? dbPool;
    await executor.query(`UPDATE users SET password_hash = ? WHERE id = ?`, [passwordHash, userId]);
  }

  async initializePlayerWorld(
    userId: number,
    displayName: string,
    conn: PoolConnection
  ): Promise<number> {
    const [levelRows] = await conn.query<RowDataPacket[]>(
      `SELECT id, max_employees_cap FROM game_levels WHERE level_number = 1 LIMIT 1`
    );
    if (!levelRows[0]) {
      throw new Error('Seed data missing: Level 1 (SMALL_FARMER) not found in game_levels');
    }
    const level1Id = Number(levelRows[0].id);
    const maxEmployeesCap = Number(levelRows[0].max_employees_cap);

    const [locRows] = await conn.query<RowDataPacket[]>(
      `SELECT id FROM locations WHERE unlock_level_number = 1 ORDER BY id ASC LIMIT 1`
    );
    if (!locRows[0]) {
      throw new Error('Seed data missing: Starter location not found in locations');
    }
    const starterLocationId = Number(locRows[0].id);

    // 1. Player profile with $500.00 starting cash
    const [profileResult] = await conn.query<ResultSetHeader>(
      `INSERT INTO player_profiles
         (user_id, display_name, cash_balance, net_worth, max_employees_allowed)
       VALUES (?, ?, 500.00, 500.00, ?)`,
      [userId, displayName, maxEmployeesCap]
    );
    const playerId = profileResult.insertId;

    // 2. Player progression at Level 1
    await conn.query(
      `INSERT INTO player_progression (player_id, current_level_id, xp_level, current_xp)
       VALUES (?, ?, 1, 0)`,
      [playerId, level1Id]
    );

    // 3. Starting land & farm & business registry
    const [landResult] = await conn.query<ResultSetHeader>(
      `INSERT INTO lands (player_id, location_id, name, total_plots_capacity, unlocked_plots_count)
       VALUES (?, ?, 'Starter Acreage', 12, 2)`,
      [playerId, starterLocationId]
    );
    const landId = landResult.insertId;

    const [farmResult] = await conn.query<ResultSetHeader>(
      `INSERT INTO farms (player_id, land_id, name, barn_capacity)
       VALUES (?, ?, 'Green Valley Farm', 200)`,
      [playerId, landId]
    );
    const farmId = farmResult.insertId;

    const [bizResult] = await conn.query<ResultSetHeader>(
      `INSERT INTO businesses (player_id, location_id, business_type, name, storage_capacity)
       VALUES (?, ?, 'FARM', 'Green Valley Farm', 200)`,
      [playerId, starterLocationId]
    );
    const farmBusinessId = bizResult.insertId;

    // 4. Create 12 farm plots (first 2 unlocked)
    for (let plotIdx = 1; plotIdx <= 12; plotIdx += 1) {
      await conn.query(
        `INSERT INTO farm_plots (player_id, farm_id, plot_index, is_unlocked, status)
         VALUES (?, ?, ?, ?, 'EMPTY')`,
        [playerId, farmId, plotIdx, plotIdx <= 2 ? 1 : 0]
      );
    }

    // 5. Initialize crop inventory slots (0 quantity for all RAW_CROP items)
    await conn.query(
      `INSERT INTO business_inventory (player_id, business_id, item_id, quantity)
       SELECT ?, ?, id, 0
       FROM inventory_items
       WHERE category = 'RAW_CROP'`,
      [playerId, farmBusinessId]
    );

    // 6. Assign initial Level 1 missions
    await conn.query(
      `INSERT INTO player_missions (player_id, mission_id, progress_value, status)
       SELECT ?, id, 0, 'ACTIVE'
       FROM missions
       WHERE unlock_level_number = 1`,
      [playerId]
    );

    return playerId;
  }

  async getPlayerProfileByUserId(
    userId: number,
    conn?: PoolConnection
  ): Promise<PlayerProfileDTO | null> {
    const executor = conn ?? dbPool;
    const [rows] = await executor.query<RowDataPacket[]>(
      `SELECT
         id,
         user_id AS userId,
         display_name AS displayName,
         avatar_key AS avatarKey,
         cash_balance AS cashBalance,
         gems_balance AS gemsBalance,
         net_worth AS netWorth,
         reputation,
         max_employees_allowed AS maxEmployeesAllowed,
         offline_cap_seconds AS offlineCapSeconds,
         last_active_at AS lastActiveAt
       FROM player_profiles
       WHERE user_id = ? AND deleted_at IS NULL
       LIMIT 1`,
      [userId]
    );
    return (rows[0] as PlayerProfileDTO | undefined) ?? null;
  }

  async updatePlayerProfile(
    playerId: number,
    displayName: string,
    avatarKey?: string
  ): Promise<void> {
    if (avatarKey) {
      await dbPool.query(
        `UPDATE player_profiles SET display_name = ?, avatar_key = ? WHERE id = ?`,
        [displayName, avatarKey, playerId]
      );
      return;
    }
    await dbPool.query(`UPDATE player_profiles SET display_name = ? WHERE id = ?`, [
      displayName,
      playerId,
    ]);
  }

  async getGameOverview(playerId: number, conn?: PoolConnection): Promise<GameOverviewDTO> {
    const executor = conn ?? dbPool;
    const [rows] = await executor.query<RowDataPacket[]>(
      `SELECT
         gl.level_number AS currentLevelNumber,
         gl.code AS currentLevelCode,
         gl.name AS currentLevelName,
         pp.xp_level AS xpLevel,
         pp.current_xp AS currentXp,
         pp.total_crops_harvested AS totalCropsHarvested,
         pp.total_pizzas_sold AS totalPizzasSold,
         (SELECT COUNT(*) FROM farms f WHERE f.player_id = ? AND f.deleted_at IS NULL) AS farmCount,
         (SELECT COUNT(*) FROM farm_plots fp WHERE fp.player_id = ? AND fp.is_unlocked = 1) AS unlockedPlotsCount,
         (SELECT COUNT(*) FROM player_missions pm WHERE pm.player_id = ? AND pm.status = 'ACTIVE') AS activeMissionsCount,
         (SELECT COUNT(*) FROM notifications n WHERE n.player_id = ? AND n.is_read = 0) AS unreadNotificationsCount
       FROM player_progression pp
       INNER JOIN game_levels gl ON gl.id = pp.current_level_id
       WHERE pp.player_id = ?
       LIMIT 1`,
      [playerId, playerId, playerId, playerId, playerId]
    );

    const row = rows[0];
    return {
      currentLevelNumber: Number(row?.currentLevelNumber ?? 1),
      currentLevelCode: String(row?.currentLevelCode ?? 'SMALL_FARMER'),
      currentLevelName: String(row?.currentLevelName ?? 'Small Farmer'),
      xpLevel: Number(row?.xpLevel ?? 1),
      currentXp: Number(row?.currentXp ?? 0),
      totalCropsHarvested: Number(row?.totalCropsHarvested ?? 0),
      totalPizzasSold: Number(row?.totalPizzasSold ?? 0),
      farmCount: Number(row?.farmCount ?? 1),
      unlockedPlotsCount: Number(row?.unlockedPlotsCount ?? 2),
      activeMissionsCount: Number(row?.activeMissionsCount ?? 0),
      unreadNotificationsCount: Number(row?.unreadNotificationsCount ?? 0),
    };
  }

  async saveRefreshToken(
    userId: number,
    tokenHash: string,
    expiresAt: Date,
    conn?: PoolConnection
  ): Promise<void> {
    const executor = conn ?? dbPool;
    await executor.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)`,
      [userId, tokenHash, expiresAt]
    );
  }

  async findValidRefreshToken(tokenHash: string): Promise<{ id: number; user_id: number } | null> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT id, user_id
       FROM refresh_tokens
       WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > UTC_TIMESTAMP()
       LIMIT 1`,
      [tokenHash]
    );
    return (rows[0] as { id: number; user_id: number } | undefined) ?? null;
  }

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    await dbPool.query(
      `UPDATE refresh_tokens SET revoked_at = UTC_TIMESTAMP() WHERE token_hash = ?`,
      [tokenHash]
    );
  }

  async revokeAllUserRefreshTokens(userId: number, conn?: PoolConnection): Promise<void> {
    const executor = conn ?? dbPool;
    await executor.query(
      `UPDATE refresh_tokens SET revoked_at = UTC_TIMESTAMP() WHERE user_id = ? AND revoked_at IS NULL`,
      [userId]
    );
  }

  async savePasswordResetToken(userId: number, tokenHash: string, expiresAt: Date): Promise<void> {
    await dbPool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)`,
      [userId, tokenHash, expiresAt]
    );
  }

  async findValidPasswordResetToken(
    tokenHash: string
  ): Promise<{ id: number; user_id: number } | null> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT id, user_id
       FROM password_reset_tokens
       WHERE token_hash = ? AND used_at IS NULL AND expires_at > UTC_TIMESTAMP()
       LIMIT 1`,
      [tokenHash]
    );
    return (rows[0] as { id: number; user_id: number } | undefined) ?? null;
  }

  async markPasswordResetTokenUsed(tokenId: number, conn?: PoolConnection): Promise<void> {
    const executor = conn ?? dbPool;
    await executor.query(
      `UPDATE password_reset_tokens SET used_at = UTC_TIMESTAMP() WHERE id = ?`,
      [tokenId]
    );
  }
}
