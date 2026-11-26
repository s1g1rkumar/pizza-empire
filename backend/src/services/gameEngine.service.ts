import { RowDataPacket } from 'mysql2/promise';
import { withTransaction } from '../database/pool';
import { UpgradeRepository } from '../repositories/upgrade.repository';
import { AppError } from '../utils/errors';
import { applyXpGain, calculateElapsedSeconds, secondsToHours } from '../utils/simulationTime';
import { EconomyService } from './economy.service';
import { OfflineService, PendingOfflineSessionDTO } from './offline.service';
import { ProductionProcessorService } from './productionProcessor.service';

const OFFLINE_THRESHOLD_SECONDS = 300; // 5 minutes idle triggers Welcome-Back modal
const DEFAULT_OFFLINE_EFFICIENCY = 0.6;

export interface SyncEmpireResult {
  syncedAt: string;
  elapsedSeconds: number;
  cashBalance: number;
  xpLevel: number;
  currentXp: number;
  plotsMatured: number;
  ordersCompleted: number;
  pendingOfflineSession: PendingOfflineSessionDTO | null;
}

export class GameEngineService {
  private readonly economyService = new EconomyService();
  private readonly productionProcessor = new ProductionProcessorService();
  private readonly offlineService = new OfflineService();
  private readonly upgradeRepo = new UpgradeRepository();

  /**
   * Central server-authoritative tick/sync for a player.
   * Uses SELECT ... FOR UPDATE on player_profiles to serialize concurrent requests.
   */
  async syncEmpire(playerId: number): Promise<SyncEmpireResult> {
    return withTransaction(async (conn) => {
      const [playerRows] = await conn.query<RowDataPacket[]>(
        `SELECT
           pp.id,
           pp.cash_balance AS cashBalance,
           pp.offline_cap_seconds AS offlineCapSeconds,
           pp.last_tick_at AS lastTickAt,
           pg.xp_level AS xpLevel,
           pg.current_xp AS currentXp
         FROM player_profiles pp
         INNER JOIN player_progression pg ON pg.player_id = pp.id
         WHERE pp.id = ? AND pp.deleted_at IS NULL
         FOR UPDATE`,
        [playerId]
      );

      const player = playerRows[0];
      if (!player) {
        throw new AppError('Player profile not found', 404, 'PLAYER_NOT_FOUND');
      }

      const now = new Date();
      const lastTickAt =
        player.lastTickAt instanceof Date ? player.lastTickAt : new Date(String(player.lastTickAt));
      const offlineCapSeconds = Number(player.offlineCapSeconds ?? 14400);
      const { rawElapsedSeconds } = calculateElapsedSeconds(lastTickAt, now, offlineCapSeconds);

      // 1. Always process matured farm plots and completed production orders
      const prodSummary = await this.productionProcessor.processCompletedProduction(conn, playerId);

      // 2. Load active businesses & assigned employees
      const [bizRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, hourly_upkeep AS hourlyUpkeep
         FROM businesses
         WHERE player_id = ? AND is_operational = 1 AND deleted_at IS NULL`,
        [playerId]
      );

      const [empRows] = await conn.query<RowDataPacket[]>(
        `SELECT
           e.skill_level AS skillLevel,
           e.happiness,
           e.hourly_wage AS hourlyWage,
           e.is_shift_lead AS isShiftLead
         FROM employees e
         INNER JOIN employee_assignments ea ON ea.employee_id = e.id AND ea.active_flag = 1
         WHERE e.player_id = ? AND e.deleted_at IS NULL`,
        [playerId]
      );

      const workforce = this.economyService.summarizeWorkforce(
        empRows.map((r) => ({
          skillLevel: Number(r.skillLevel),
          happiness: Number(r.happiness),
          hourlyWage: Number(r.hourlyWage),
          isShiftLead: Boolean(r.isShiftLead),
        }))
      );

      const upgradeMultipliers = await this.upgradeRepo.getPlayerUpgradeMultipliers(playerId, conn);
      const effectiveProductivity = Number(
        (workforce.totalProductivity * upgradeMultipliers.employeeProductivityBonus).toFixed(2)
      );
      const totalHourlyUpkeep = Number(
        (
          bizRows.reduce((sum, b) => sum + Number(b.hourlyUpkeep ?? 0), 0) *
          upgradeMultipliers.upkeepReductionFactor
        ).toFixed(2)
      );

      let cashBalance = Number(player.cashBalance);
      let pendingOfflineSession = await this.offlineService.getUnclaimedSession(conn, playerId);
      let earnedXp = prodSummary.plotsMatured * 5 + prodSummary.ordersCompleted * 10;

      // 3. Offline vs Active Tick Evaluation
      if (rawElapsedSeconds >= OFFLINE_THRESHOLD_SECONDS && !pendingOfflineSession) {
        const breakdown = this.offlineService.calculateOfflineEarnings({
          lastTickAt,
          now,
          offlineCapSeconds,
          efficiencyRate: Number(
            (DEFAULT_OFFLINE_EFFICIENCY * upgradeMultipliers.automationBonus).toFixed(4)
          ),
          activeBusinessCount: bizRows.length,
          totalProductivity: effectiveProductivity * upgradeMultipliers.revenueMultiplier,
          totalHourlyWage: workforce.totalHourlyWage,
          totalHourlyUpkeep,
        });

        if (breakdown.netCashEarned > 0 || breakdown.xpEarned > 0) {
          pendingOfflineSession = await this.offlineService.stageOfflineSession(
            conn,
            playerId,
            lastTickAt,
            now,
            breakdown
          );
        }
      } else if (rawElapsedSeconds > 0 && rawElapsedSeconds < OFFLINE_THRESHOLD_SECONDS) {
        // Active session prorated operating costs (only if player has active workforce)
        const hours = secondsToHours(rawElapsedSeconds);
        const operatingExpense = Number(
          ((workforce.totalHourlyWage + totalHourlyUpkeep) * hours).toFixed(2)
        );
        const automatedRevenue = Number(
          (
            effectiveProductivity *
            25 *
            upgradeMultipliers.revenueMultiplier *
            upgradeMultipliers.automationBonus *
            Math.max(1, bizRows.length) *
            hours
          ).toFixed(2)
        );

        const netDelta = Number((automatedRevenue - operatingExpense).toFixed(2));
        if (netDelta !== 0 && cashBalance + netDelta >= 0) {
          const tickRef = `tick_${playerId}_${Math.floor(now.getTime() / 1000)}`;
          const txResult = await this.economyService.recordCashTransaction(conn, {
            playerId,
            transactionType: netDelta > 0 ? 'REVENUE' : 'EXPENSE',
            category: netDelta > 0 ? 'PIZZA_SALE' : 'UPKEEP',
            amount: Math.abs(netDelta),
            isCredit: netDelta > 0,
            referenceId: tickRef,
            description: 'Automated empire simulation tick',
          });
          cashBalance = txResult.balanceAfter;
        }
        earnedXp += Math.floor(rawElapsedSeconds / 30);
      }

      // 4. Update XP & Level Progression
      const nextProg = applyXpGain(Number(player.xpLevel), Number(player.currentXp), earnedXp);
      await conn.query(
        `UPDATE player_progression SET xp_level = ?, current_xp = ? WHERE player_id = ?`,
        [nextProg.xpLevel, nextProg.currentXp, playerId]
      );

      // 5. Advance tick timestamp
      await conn.query(
        `UPDATE player_profiles
         SET last_tick_at = UTC_TIMESTAMP(), last_active_at = UTC_TIMESTAMP()
         WHERE id = ?`,
        [playerId]
      );

      return {
        syncedAt: now.toISOString(),
        elapsedSeconds: rawElapsedSeconds,
        cashBalance,
        xpLevel: nextProg.xpLevel,
        currentXp: nextProg.currentXp,
        plotsMatured: prodSummary.plotsMatured,
        ordersCompleted: prodSummary.ordersCompleted,
        pendingOfflineSession,
      };
    });
  }
}
