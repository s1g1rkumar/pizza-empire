import { RowDataPacket } from 'mysql2/promise';
import { dbPool } from '../database/pool';

export interface AdminAnalyticsDTO {
  totalRegistrations: number;
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  retentionRate7d: number;
  avgSessionDurationMinutes: number;
  monetizationRevenueUsd: number;
  mostPopularBusinesses: Array<{ businessType: string; count: number }>;
  progressionStats: Array<{ levelNumber: number; levelName: string; playerCount: number }>;
  registrationTrend: Array<{ date: string; count: number }>;
}

export class AdminRepository {
  async getAnalytics(): Promise<AdminAnalyticsDTO> {
    const [regRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS totalRegistrations,
              SUM(CASE WHEN last_login_at >= (UTC_TIMESTAMP() - INTERVAL 1 DAY) THEN 1 ELSE 0 END) AS dau,
              SUM(CASE WHEN last_login_at >= (UTC_TIMESTAMP() - INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS mau,
              SUM(CASE WHEN created_at <= (UTC_TIMESTAMP() - INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS cohort7d,
              SUM(CASE WHEN created_at <= (UTC_TIMESTAMP() - INTERVAL 7 DAY)
                        AND last_login_at >= (UTC_TIMESTAMP() - INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS retained7d
       FROM users
       WHERE role = 'PLAYER' AND deleted_at IS NULL`
    );

    const r = regRows[0] ?? {};
    const cohort7d = Number(r.cohort7d ?? 0);
    const retained7d = Number(r.retained7d ?? 0);
    const retentionRate7d = cohort7d > 0 ? Number(((retained7d / cohort7d) * 100).toFixed(1)) : 100;

    const [sessionRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT COALESCE(AVG(offline_cap_seconds) / 60, 24) AS avgMinutes
       FROM player_profiles WHERE deleted_at IS NULL`
    );

    const [monetizationRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(amount_usd), 0) AS totalUsd FROM monetization_transactions`
    );

    const [bizRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT business_type AS businessType, COUNT(*) AS cnt
       FROM businesses
       WHERE deleted_at IS NULL
       GROUP BY business_type
       ORDER BY cnt DESC`
    );

    const [progRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT gl.level_number AS levelNumber, gl.name AS levelName,
              COUNT(pp.id) AS playerCount
       FROM game_levels gl
       LEFT JOIN player_progression pp ON pp.current_level_id = gl.id
       GROUP BY gl.id, gl.level_number, gl.name
       ORDER BY gl.level_number ASC`
    );

    const [trendRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS regDate, COUNT(*) AS cnt
       FROM users
       WHERE role = 'PLAYER' AND created_at >= (UTC_TIMESTAMP() - INTERVAL 7 DAY)
       GROUP BY regDate
       ORDER BY regDate ASC`
    );

    return {
      totalRegistrations: Number(r.totalRegistrations ?? 0),
      dailyActiveUsers: Number(r.dau ?? 0),
      monthlyActiveUsers: Number(r.mau ?? 0),
      retentionRate7d,
      avgSessionDurationMinutes: Number(Number(sessionRows[0]?.avgMinutes ?? 24).toFixed(1)),
      monetizationRevenueUsd: Number(monetizationRows[0]?.totalUsd ?? 0),
      mostPopularBusinesses: bizRows.map((b) => ({
        businessType: String(b.businessType),
        count: Number(b.cnt),
      })),
      progressionStats: progRows.map((p) => ({
        levelNumber: Number(p.levelNumber),
        levelName: String(p.levelName),
        playerCount: Number(p.playerCount),
      })),
      registrationTrend: trendRows.map((t) => ({
        date: String(t.regDate),
        count: Number(t.cnt),
      })),
    };
  }

  async getPlayers(search?: string, status?: string): Promise<RowDataPacket[]> {
    const conditions = [`u.deleted_at IS NULL`];
    const params: unknown[] = [];

    if (search && search.trim()) {
      conditions.push(`(u.username LIKE ? OR u.email LIKE ? OR pp.display_name LIKE ?)`);
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }
    if (status && status !== 'ALL') {
      conditions.push(`u.status = ?`);
      params.push(status);
    }

    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT u.id AS userId, u.email, u.username, u.role, u.status, u.last_login_at AS lastLoginAt,
              u.created_at AS createdAt,
              pp.id AS playerId, pp.display_name AS displayName, pp.cash_balance AS cashBalance,
              pp.gems_balance AS gemsBalance, pp.net_worth AS netWorth, pp.reputation,
              pr.xp_level AS xpLevel, pr.current_xp AS currentXp,
              gl.level_number AS stageNumber, gl.name AS stageName
       FROM users u
       LEFT JOIN player_profiles pp ON pp.user_id = u.id
       LEFT JOIN player_progression pr ON pr.player_id = pp.id
       LEFT JOIN game_levels gl ON gl.id = pr.current_level_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY u.id DESC
       LIMIT 100`,
      params
    );
    return rows;
  }

  async getAllConfigurationData(): Promise<{
    crops: RowDataPacket[];
    products: RowDataPacket[];
    locations: RowDataPacket[];
    upgrades: RowDataPacket[];
    missions: RowDataPacket[];
    achievements: RowDataPacket[];
    settings: RowDataPacket[];
    announcements: RowDataPacket[];
  }> {
    const [crops] = await dbPool.query<RowDataPacket[]>(
      `SELECT id, code, name, seed_cost AS seedCost, growth_seconds AS growthSeconds,
              base_yield AS baseYield, market_sell_price AS marketSellPrice,
              unlock_xp_level AS unlockXpLevel
       FROM crops ORDER BY id ASC`
    );
    const [products] = await dbPool.query<RowDataPacket[]>(
      `SELECT id, code, name, category, unit_wholesale_buy AS unitWholesaleBuy,
              unit_wholesale_sell AS unitWholesaleSell, low_stock_threshold AS lowStockThreshold
       FROM inventory_items ORDER BY category ASC, name ASC`
    );
    const [locations] = await dbPool.query<RowDataPacket[]>(
      `SELECT id, code, name, district_type AS districtType, demand_multiplier AS demandMultiplier,
              rent_multiplier AS rentMultiplier, price_elasticity AS priceElasticity
       FROM locations ORDER BY id ASC`
    );
    const [upgrades] = await dbPool.query<RowDataPacket[]>(
      `SELECT id, code, category, name, base_cost AS baseCost, cost_multiplier AS costMultiplier,
              max_level AS maxLevel, effect_value AS effectValue, is_active AS isActive
       FROM upgrades ORDER BY category ASC, id ASC`
    );
    const [missions] = await dbPool.query<RowDataPacket[]>(
      `SELECT id, code, title, mission_type AS missionType, target_metric AS targetMetric,
              target_value AS targetValue, reward_cash AS rewardCash, reward_xp AS rewardXp,
              reward_gems AS rewardGems, is_active AS isActive
       FROM missions ORDER BY id ASC`
    );
    const [achievements] = await dbPool.query<RowDataPacket[]>(
      `SELECT id, code, title, target_metric AS targetMetric, target_value AS targetValue,
              reward_cash AS rewardCash, reward_xp AS rewardXp, reward_gems AS rewardGems,
              is_active AS isActive
       FROM achievements ORDER BY id ASC`
    );
    const [settings] = await dbPool.query<RowDataPacket[]>(
      `SELECT setting_key AS settingKey, setting_group AS settingGroup, label,
              setting_value AS settingValue, value_type AS valueType, description,
              updated_at AS updatedAt
       FROM game_settings ORDER BY setting_group ASC, setting_key ASC`
    );
    const [announcements] = await dbPool.query<RowDataPacket[]>(
      `SELECT id, title, message, severity, is_active AS isActive, expires_at AS expiresAt,
              created_at AS createdAt
       FROM game_announcements ORDER BY id DESC LIMIT 50`
    );

    return {
      crops,
      products,
      locations,
      upgrades,
      missions,
      achievements,
      settings,
      announcements,
    };
  }

  async getReports(): Promise<{
    auditLogs: RowDataPacket[];
    economyByCategory: RowDataPacket[];
    topPlayers: RowDataPacket[];
  }> {
    const [auditLogs] = await dbPool.query<RowDataPacket[]>(
      `SELECT al.id, al.actor_user_id AS actorUserId, u.username AS actorUsername,
              al.target_player_id AS targetPlayerId, al.action_type AS actionType,
              al.before_state AS beforeState, al.after_state AS afterState,
              al.ip_address AS ipAddress, al.created_at AS createdAt
       FROM audit_logs al
       INNER JOIN users u ON u.id = al.actor_user_id
       ORDER BY al.id DESC
       LIMIT 100`
    );

    const [economyByCategory] = await dbPool.query<RowDataPacket[]>(
      `SELECT transaction_type AS transactionType, category,
              COUNT(*) AS txCount, COALESCE(SUM(amount), 0) AS totalAmount
       FROM financial_transactions
       GROUP BY transaction_type, category
       ORDER BY totalAmount DESC`
    );

    const [topPlayers] = await dbPool.query<RowDataPacket[]>(
      `SELECT pp.id AS playerId, u.username, pp.display_name AS displayName,
              pp.cash_balance AS cashBalance, pp.net_worth AS netWorth, pp.reputation,
              gl.name AS stageName
       FROM player_profiles pp
       INNER JOIN users u ON u.id = pp.user_id
       LEFT JOIN player_progression pr ON pr.player_id = pp.id
       LEFT JOIN game_levels gl ON gl.id = pr.current_level_id
       WHERE pp.deleted_at IS NULL
       ORDER BY pp.net_worth DESC
       LIMIT 20`
    );

    return { auditLogs, economyByCategory, topPlayers };
  }
}
