import { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { dbPool } from '../database/pool';
import {
  checkLevelUnlockEligibility,
  PlayerMetricsSnapshot,
  resolveMetricValue,
} from '../utils/progressionCalculator';
import { xpRequiredForLevel } from '../utils/simulationTime';

export interface ProgressionDashboardDTO {
  summary: {
    currentLevelNumber: number;
    currentLevelName: string;
    xpLevel: number;
    currentXp: number;
    nextLevelXp: number;
    cashBalance: number;
    gemsBalance: number;
    netWorth: number;
    stats: PlayerMetricsSnapshot;
  };
  levels: Array<{
    id: number;
    levelNumber: number;
    code: string;
    name: string;
    description: string;
    minXp: number;
    minCash: number;
    minNetWorth: number;
    maxEmployeesCap: number;
    isUnlocked: boolean;
    isCurrent: boolean;
    isNextTarget: boolean;
    eligibleToUnlock: boolean;
    missingReasons: string[];
  }>;
  missions: Array<{
    id: number;
    missionId: number;
    code: string;
    title: string;
    missionType: string;
    progressValue: number;
    targetValue: number;
    rewardCash: number;
    rewardXp: number;
    rewardGems: number;
    status: 'ACTIVE' | 'COMPLETED' | 'CLAIMED';
  }>;
  achievements: Array<{
    id: number;
    achievementId: number;
    code: string;
    name: string;
    category: string;
    description: string;
    progressValue: number;
    targetValue: number;
    rewardCash: number;
    rewardXp: number;
    rewardGems: number;
    isUnlocked: boolean;
    isClaimed: boolean;
  }>;
}

export class ProgressionRepository {
  async getMetricsSnapshot(
    playerId: number,
    conn?: PoolConnection
  ): Promise<{
    snapshot: PlayerMetricsSnapshot;
    currentLevelNumber: number;
    currentLevelName: string;
    currentXp: number;
    gemsBalance: number;
  }> {
    const exec = conn ?? dbPool;

    const [rows] = await exec.query<RowDataPacket[]>(
      `SELECT
         pp.cash_balance AS cashBalance,
         pp.gems_balance AS gemsBalance,
         pp.net_worth AS netWorth,
         pg.xp_level AS xpLevel,
         pg.current_xp AS currentXp,
         pg.total_crops_harvested AS totalCropsHarvested,
         pg.total_pizzas_sold AS totalPizzasSold,
         pg.total_batches_processed AS totalBatchesProcessed,
         pg.total_deliveries_completed AS totalDeliveriesCompleted,
         gl.level_number AS currentLevelNumber,
         gl.name AS currentLevelName,
         (SELECT COUNT(*) FROM employees e WHERE e.player_id = ? AND e.deleted_at IS NULL) AS activeEmployees,
         (SELECT COUNT(*) FROM farm_plots fp WHERE fp.player_id = ? AND fp.is_unlocked = 1) AS unlockedPlots,
         (SELECT COUNT(*) FROM restaurants r WHERE r.player_id = ? AND r.deleted_at IS NULL) AS restaurantsOwned,
         (SELECT COALESCE(SUM(pu.current_level), 0) FROM player_upgrades pu WHERE pu.player_id = ?) AS farmUpgrades
       FROM player_profiles pp
       INNER JOIN player_progression pg ON pg.player_id = pp.id
       INNER JOIN game_levels gl ON gl.id = pg.current_level_id
       WHERE pp.id = ?
       LIMIT 1`,
      [playerId, playerId, playerId, playerId, playerId]
    );

    const r = rows[0];
    if (!r) throw new Error('Player progression record not found');

    return {
      snapshot: {
        totalCropsHarvested: Number(r.totalCropsHarvested ?? 0),
        totalPizzasSold: Number(r.totalPizzasSold ?? 0),
        totalBatchesProcessed: Number(r.totalBatchesProcessed ?? 0),
        totalDeliveriesCompleted: Number(r.totalDeliveriesCompleted ?? 0),
        activeEmployees: Number(r.activeEmployees ?? 0),
        unlockedPlots: Number(r.unlockedPlots ?? 2),
        restaurantsOwned: Number(r.restaurantsOwned ?? 0),
        farmUpgrades: Number(r.farmUpgrades ?? 0),
        cashBalance: Number(r.cashBalance ?? 0),
        netWorth: Number(r.netWorth ?? 0),
        xpLevel: Number(r.xpLevel ?? 1),
      },
      currentLevelNumber: Number(r.currentLevelNumber ?? 1),
      currentLevelName: String(r.currentLevelName ?? 'Small Farmer'),
      currentXp: Number(r.currentXp ?? 0),
      gemsBalance: Number(r.gemsBalance ?? 0),
    };
  }

  async syncMissionsAndAchievements(
    conn: PoolConnection,
    playerId: number,
    stats: PlayerMetricsSnapshot
  ): Promise<void> {
    // Ensure all catalog missions & achievements exist for this player
    await conn.query(
      `INSERT IGNORE INTO player_missions (player_id, mission_id, progress_value, status)
       SELECT ?, id, 0, 'ACTIVE' FROM missions`,
      [playerId]
    );

    await conn.query(
      `INSERT IGNORE INTO player_achievements (player_id, achievement_id, progress_value, is_unlocked, is_claimed)
       SELECT ?, id, 0, 0, 0 FROM achievements`,
      [playerId]
    );

    const [mRows] = await conn.query<RowDataPacket[]>(
      `SELECT pm.id, m.target_metric AS targetMetric, m.target_value AS targetValue, pm.status
       FROM player_missions pm
       INNER JOIN missions m ON m.id = pm.mission_id
       WHERE pm.player_id = ? AND pm.status = 'ACTIVE'`,
      [playerId]
    );

    for (const m of mRows) {
      const val = resolveMetricValue(String(m.targetMetric), stats);
      const target = Number(m.targetValue);
      const clamped = Math.min(target, val);
      const completed = val >= target;

      await conn.query(
        `UPDATE player_missions
         SET progress_value = ?,
             status = IF(?, 'COMPLETED', 'ACTIVE'),
             completed_at = IF(?, UTC_TIMESTAMP(), NULL)
         WHERE id = ? AND status = 'ACTIVE'`,
        [clamped, completed ? 1 : 0, completed ? 1 : 0, Number(m.id)]
      );
    }

    const [aRows] = await conn.query<RowDataPacket[]>(
      `SELECT pa.id, a.name, a.target_metric AS targetMetric, a.target_value AS targetValue, pa.is_unlocked AS isUnlocked
       FROM player_achievements pa
       INNER JOIN achievements a ON a.id = pa.achievement_id
       WHERE pa.player_id = ? AND pa.is_unlocked = 0`,
      [playerId]
    );

    for (const a of aRows) {
      const val = resolveMetricValue(String(a.targetMetric), stats);
      const target = Number(a.targetValue);
      const clamped = Math.min(target, val);
      const unlocked = val >= target;

      await conn.query(
        `UPDATE player_achievements
         SET progress_value = ?,
             is_unlocked = ?,
             unlocked_at = IF(?, UTC_TIMESTAMP(), NULL)
         WHERE id = ? AND is_unlocked = 0`,
        [clamped, unlocked ? 1 : 0, unlocked ? 1 : 0, Number(a.id)]
      );

      if (unlocked) {
        await conn.query(
          `INSERT INTO notifications (player_id, type, title, message)
           VALUES (?, 'ACHIEVEMENT', ?, ?)`,
          [playerId, `Achievement Unlocked: ${String(a.name)}`, `Claim your reward in Missions!`]
        );
      }
    }
  }

  async getProgressionDashboard(playerId: number): Promise<ProgressionDashboardDTO> {
    const metrics = await this.getMetricsSnapshot(playerId);
    const { snapshot, currentLevelNumber, currentLevelName, currentXp, gemsBalance } = metrics;
    const totalApproxXp = snapshot.xpLevel * 100 + currentXp;

    const [levelRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT id, level_number AS levelNumber, code, name, description,
              min_xp AS minXp, min_cash AS minCash, min_net_worth AS minNetWorth,
              max_employees_cap AS maxEmployeesCap
       FROM game_levels
       ORDER BY level_number ASC`
    );

    const levels = levelRows.map((l) => {
      const lvlNum = Number(l.levelNumber);
      const isUnlocked = lvlNum <= currentLevelNumber;
      const isNextTarget = lvlNum === currentLevelNumber + 1;
      const elig = checkLevelUnlockEligibility({
        playerXp: totalApproxXp,
        playerCash: snapshot.cashBalance,
        playerNetWorth: snapshot.netWorth,
        minXp: Number(l.minXp),
        minCash: Number(l.minCash),
        minNetWorth: Number(l.minNetWorth),
      });

      return {
        id: Number(l.id),
        levelNumber: lvlNum,
        code: String(l.code),
        name: String(l.name),
        description: String(l.description),
        minXp: Number(l.minXp),
        minCash: Number(l.minCash),
        minNetWorth: Number(l.minNetWorth),
        maxEmployeesCap: Number(l.maxEmployeesCap),
        isUnlocked,
        isCurrent: lvlNum === currentLevelNumber,
        isNextTarget,
        eligibleToUnlock: isNextTarget && elig.eligible,
        missingReasons: isNextTarget ? elig.reasons : [],
      };
    });

    const [missionRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         pm.id, pm.mission_id AS missionId, m.code, m.title, m.mission_type AS missionType,
         pm.progress_value AS progressValue, m.target_value AS targetValue,
         m.reward_cash AS rewardCash, m.reward_xp AS rewardXp, m.reward_gems AS rewardGems,
         pm.status
       FROM player_missions pm
       INNER JOIN missions m ON m.id = pm.mission_id
       WHERE pm.player_id = ?
       ORDER BY FIELD(pm.status, 'COMPLETED', 'ACTIVE', 'CLAIMED'), m.unlock_level_number ASC, m.id ASC`,
      [playerId]
    );

    const [achRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         pa.id, pa.achievement_id AS achievementId, a.code, a.name, a.category, a.description,
         pa.progress_value AS progressValue, a.target_value AS targetValue,
         a.reward_cash AS rewardCash, a.reward_xp AS rewardXp, a.reward_gems AS rewardGems,
         pa.is_unlocked AS isUnlocked, pa.is_claimed AS isClaimed
       FROM player_achievements pa
       INNER JOIN achievements a ON a.id = pa.achievement_id
       WHERE pa.player_id = ?
       ORDER BY pa.is_unlocked DESC, pa.is_claimed ASC, a.id ASC`,
      [playerId]
    );

    return {
      summary: {
        currentLevelNumber,
        currentLevelName,
        xpLevel: snapshot.xpLevel,
        currentXp,
        nextLevelXp: xpRequiredForLevel(snapshot.xpLevel),
        cashBalance: snapshot.cashBalance,
        gemsBalance,
        netWorth: snapshot.netWorth,
        stats: snapshot,
      },
      levels,
      missions: missionRows.map((m) => ({
        id: Number(m.id),
        missionId: Number(m.missionId),
        code: String(m.code),
        title: String(m.title),
        missionType: String(m.missionType),
        progressValue: Number(m.progressValue),
        targetValue: Number(m.targetValue),
        rewardCash: Number(m.rewardCash),
        rewardXp: Number(m.rewardXp),
        rewardGems: Number(m.rewardGems),
        status: m.status as 'ACTIVE' | 'COMPLETED' | 'CLAIMED',
      })),
      achievements: achRows.map((a) => ({
        id: Number(a.id),
        achievementId: Number(a.achievementId),
        code: String(a.code),
        name: String(a.name),
        category: String(a.category),
        description: String(a.description),
        progressValue: Number(a.progressValue),
        targetValue: Number(a.targetValue),
        rewardCash: Number(a.rewardCash),
        rewardXp: Number(a.rewardXp),
        rewardGems: Number(a.rewardGems),
        isUnlocked: Boolean(a.isUnlocked),
        isClaimed: Boolean(a.isClaimed),
      })),
    };
  }
}
