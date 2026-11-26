import { RowDataPacket } from 'mysql2/promise';
import { withTransaction } from '../database/pool';
import {
  ProgressionDashboardDTO,
  ProgressionRepository,
} from '../repositories/progression.repository';
import { AppError, ConflictError, NotFoundError } from '../utils/errors';
import { checkLevelUnlockEligibility } from '../utils/progressionCalculator';
import { applyXpGain } from '../utils/simulationTime';
import { EconomyService } from './economy.service';

export class ProgressionService {
  private readonly progressionRepo = new ProgressionRepository();
  private readonly economyService = new EconomyService();

  async getDashboard(playerId: number): Promise<ProgressionDashboardDTO> {
    await withTransaction(async (conn) => {
      const { snapshot } = await this.progressionRepo.getMetricsSnapshot(playerId, conn);
      await this.progressionRepo.syncMissionsAndAchievements(conn, playerId, snapshot);
    });
    return this.progressionRepo.getProgressionDashboard(playerId);
  }

  async unlockNextLevel(playerId: number): Promise<ProgressionDashboardDTO> {
    await withTransaction(async (conn) => {
      const metrics = await this.progressionRepo.getMetricsSnapshot(playerId, conn);
      const nextLevelNumber = metrics.currentLevelNumber + 1;

      const [nextRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, name, min_xp AS minXp, min_cash AS minCash, min_net_worth AS minNetWorth, max_employees_cap AS maxEmployeesCap
         FROM game_levels WHERE level_number = ? LIMIT 1`,
        [nextLevelNumber]
      );
      const nextLevel = nextRows[0];
      if (!nextLevel) {
        throw new ConflictError(
          'You have already reached the maximum Global Business Empire stage!'
        );
      }

      const totalApproxXp = metrics.snapshot.xpLevel * 100 + metrics.currentXp;
      const elig = checkLevelUnlockEligibility({
        playerXp: totalApproxXp,
        playerCash: metrics.snapshot.cashBalance,
        playerNetWorth: metrics.snapshot.netWorth,
        minXp: Number(nextLevel.minXp),
        minCash: Number(nextLevel.minCash),
        minNetWorth: Number(nextLevel.minNetWorth),
      });

      if (!elig.eligible) {
        throw new AppError(
          `Unlock requirements not met: ${elig.reasons.join(', ')}`,
          422,
          'LEVEL_REQUIREMENTS_UNMET'
        );
      }

      await conn.query(`UPDATE player_progression SET current_level_id = ? WHERE player_id = ?`, [
        Number(nextLevel.id),
        playerId,
      ]);

      await conn.query(`UPDATE player_profiles SET max_employees_allowed = ? WHERE id = ?`, [
        Number(nextLevel.maxEmployeesCap),
        playerId,
      ]);

      await conn.query(
        `INSERT INTO notifications (player_id, type, title, message)
         VALUES (?, 'INFO', ?, ?)`,
        [
          playerId,
          `Stage ${nextLevelNumber} Unlocked: ${String(nextLevel.name)}!`,
          `Workforce capacity expanded to ${nextLevel.maxEmployeesCap} employees.`,
        ]
      );
    });

    return this.getDashboard(playerId);
  }

  async claimMissionReward(
    playerId: number,
    playerMissionId: number
  ): Promise<ProgressionDashboardDTO> {
    await withTransaction(async (conn) => {
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT pm.id, pm.status, m.title, m.reward_cash AS rewardCash, m.reward_xp AS rewardXp, m.reward_gems AS rewardGems
         FROM player_missions pm
         INNER JOIN missions m ON m.id = pm.mission_id
         WHERE pm.id = ? AND pm.player_id = ?
         FOR UPDATE`,
        [playerMissionId, playerId]
      );
      const mission = rows[0];
      if (!mission) throw new NotFoundError('Mission not found');
      if (mission.status === 'CLAIMED') {
        throw new ConflictError('Mission reward already claimed');
      }
      if (mission.status !== 'COMPLETED') {
        throw new AppError('Mission is not completed yet', 422, 'MISSION_NOT_COMPLETED');
      }

      await conn.query(
        `UPDATE player_missions SET status = 'CLAIMED', claimed_at = UTC_TIMESTAMP() WHERE id = ? AND status = 'COMPLETED'`,
        [playerMissionId]
      );

      await this.economyService.recordCashTransaction(conn, {
        playerId,
        transactionType: 'REWARD',
        category: 'MISSION_REWARD',
        amount: Number(mission.rewardCash),
        isCredit: true,
        referenceId: `mission_claim_${playerMissionId}`,
        description: `Mission reward: ${String(mission.title)}`,
      });

      const rewardGems = Number(mission.rewardGems ?? 0);
      if (rewardGems > 0) {
        await conn.query(
          `UPDATE player_profiles SET gems_balance = gems_balance + ? WHERE id = ?`,
          [rewardGems, playerId]
        );
      }

      const rewardXp = Number(mission.rewardXp ?? 0);
      if (rewardXp > 0) {
        const [progRows] = await conn.query<RowDataPacket[]>(
          `SELECT xp_level AS xpLevel, current_xp AS currentXp FROM player_progression WHERE player_id = ? FOR UPDATE`,
          [playerId]
        );
        if (progRows[0]) {
          const next = applyXpGain(
            Number(progRows[0].xpLevel),
            Number(progRows[0].currentXp),
            rewardXp
          );
          await conn.query(
            `UPDATE player_progression SET xp_level = ?, current_xp = ? WHERE player_id = ?`,
            [next.xpLevel, next.currentXp, playerId]
          );
        }
      }
    });

    return this.getDashboard(playerId);
  }

  async claimAchievementReward(
    playerId: number,
    playerAchievementId: number
  ): Promise<ProgressionDashboardDTO> {
    await withTransaction(async (conn) => {
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT pa.id, pa.is_unlocked AS isUnlocked, pa.is_claimed AS isClaimed,
                a.name, a.reward_cash AS rewardCash, a.reward_xp AS rewardXp, a.reward_gems AS rewardGems
         FROM player_achievements pa
         INNER JOIN achievements a ON a.id = pa.achievement_id
         WHERE pa.id = ? AND pa.player_id = ?
         FOR UPDATE`,
        [playerAchievementId, playerId]
      );
      const ach = rows[0];
      if (!ach) throw new NotFoundError('Achievement not found');
      if (ach.isClaimed) throw new ConflictError('Achievement reward already claimed');
      if (!ach.isUnlocked) {
        throw new AppError('Achievement is not unlocked yet', 422, 'ACHIEVEMENT_LOCKED');
      }

      await conn.query(
        `UPDATE player_achievements SET is_claimed = 1, claimed_at = UTC_TIMESTAMP() WHERE id = ? AND is_claimed = 0`,
        [playerAchievementId]
      );

      await this.economyService.recordCashTransaction(conn, {
        playerId,
        transactionType: 'REWARD',
        category: 'MISSION_REWARD',
        amount: Number(ach.rewardCash),
        isCredit: true,
        referenceId: `ach_claim_${playerAchievementId}`,
        description: `Achievement reward: ${String(ach.name)}`,
      });

      const rewardGems = Number(ach.rewardGems ?? 0);
      if (rewardGems > 0) {
        await conn.query(
          `UPDATE player_profiles SET gems_balance = gems_balance + ? WHERE id = ?`,
          [rewardGems, playerId]
        );
      }

      const rewardXp = Number(ach.rewardXp ?? 0);
      if (rewardXp > 0) {
        const [progRows] = await conn.query<RowDataPacket[]>(
          `SELECT xp_level AS xpLevel, current_xp AS currentXp FROM player_progression WHERE player_id = ? FOR UPDATE`,
          [playerId]
        );
        if (progRows[0]) {
          const next = applyXpGain(
            Number(progRows[0].xpLevel),
            Number(progRows[0].currentXp),
            rewardXp
          );
          await conn.query(
            `UPDATE player_progression SET xp_level = ?, current_xp = ? WHERE player_id = ?`,
            [next.xpLevel, next.currentXp, playerId]
          );
        }
      }
    });

    return this.getDashboard(playerId);
  }
}
