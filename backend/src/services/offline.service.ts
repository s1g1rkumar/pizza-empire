import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { withTransaction } from '../database/pool';
import { AppError } from '../utils/errors';
import { applyXpGain, calculateElapsedSeconds, secondsToHours } from '../utils/simulationTime';
import { EconomyService } from './economy.service';

export interface OfflineCalculationInput {
  lastTickAt: Date;
  now: Date;
  offlineCapSeconds: number;
  efficiencyRate: number;
  activeBusinessCount: number;
  totalProductivity: number;
  totalHourlyWage: number;
  totalHourlyUpkeep: number;
}

export interface OfflineEarningsBreakdown {
  effectiveSeconds: number;
  wasCapped: boolean;
  grossRevenue: number;
  wagesDeducted: number;
  upkeepDeducted: number;
  netCashEarned: number;
  xpEarned: number;
}

export interface PendingOfflineSessionDTO {
  id: number;
  effectiveSeconds: number;
  grossRevenue: number;
  wagesDeducted: number;
  upkeepDeducted: number;
  netCashEarned: number;
  xpEarned: number;
}

export class OfflineService {
  private readonly economyService = new EconomyService();

  /**
   * Pure server-side offline earnings calculation with zero-negative protection.
   * Automated output scales with active workforce productivity and business count at 60% offline rate.
   */
  calculateOfflineEarnings(input: OfflineCalculationInput): OfflineEarningsBreakdown {
    const { effectiveSeconds, wasCapped } = calculateElapsedSeconds(
      input.lastTickAt,
      input.now,
      input.offlineCapSeconds
    );

    if (effectiveSeconds <= 0 || input.totalProductivity <= 0 || input.activeBusinessCount <= 0) {
      return {
        effectiveSeconds,
        wasCapped,
        grossRevenue: 0,
        wagesDeducted: 0,
        upkeepDeducted: 0,
        netCashEarned: 0,
        xpEarned: 0,
      };
    }

    const hours = secondsToHours(effectiveSeconds);
    const baseHourlyRevenuePerUnit = 25;
    const grossRevenue = Number(
      (
        input.totalProductivity *
        baseHourlyRevenuePerUnit *
        Math.max(1, input.activeBusinessCount) *
        input.efficiencyRate *
        hours
      ).toFixed(2)
    );

    const wagesDeducted = Number((input.totalHourlyWage * hours).toFixed(2));
    const upkeepDeducted = Number((input.totalHourlyUpkeep * hours).toFixed(2));
    const rawNet = grossRevenue - wagesDeducted - upkeepDeducted;
    const netCashEarned = Number(Math.max(0, rawNet).toFixed(2));
    const xpEarned = Math.floor(effectiveSeconds / 60) * Math.max(1, input.activeBusinessCount);

    return {
      effectiveSeconds,
      wasCapped,
      grossRevenue,
      wagesDeducted,
      upkeepDeducted,
      netCashEarned,
      xpEarned,
    };
  }

  /**
   * Stages an unclaimed offline earnings session inside the sync transaction.
   */
  async stageOfflineSession(
    conn: PoolConnection,
    playerId: number,
    startedAt: Date,
    endedAt: Date,
    breakdown: OfflineEarningsBreakdown
  ): Promise<PendingOfflineSessionDTO> {
    const [result] = await conn.query<ResultSetHeader>(
      `INSERT INTO offline_earnings_sessions
         (player_id, started_at, ended_at, effective_seconds, gross_revenue, wages_deducted, upkeep_deducted, net_cash_earned, xp_earned, summary_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        playerId,
        startedAt,
        endedAt,
        breakdown.effectiveSeconds,
        breakdown.grossRevenue,
        breakdown.wagesDeducted,
        breakdown.upkeepDeducted,
        breakdown.netCashEarned,
        breakdown.xpEarned,
        JSON.stringify(breakdown),
      ]
    );

    return {
      id: result.insertId,
      effectiveSeconds: breakdown.effectiveSeconds,
      grossRevenue: breakdown.grossRevenue,
      wagesDeducted: breakdown.wagesDeducted,
      upkeepDeducted: breakdown.upkeepDeducted,
      netCashEarned: breakdown.netCashEarned,
      xpEarned: breakdown.xpEarned,
    };
  }

  async getUnclaimedSession(
    conn: PoolConnection,
    playerId: number
  ): Promise<PendingOfflineSessionDTO | null> {
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT
         id,
         effective_seconds AS effectiveSeconds,
         gross_revenue AS grossRevenue,
         wages_deducted AS wagesDeducted,
         upkeep_deducted AS upkeepDeducted,
         net_cash_earned AS netCashEarned,
         xp_earned AS xpEarned
       FROM offline_earnings_sessions
       WHERE player_id = ? AND claimed_at IS NULL
       ORDER BY id DESC
       LIMIT 1`,
      [playerId]
    );

    const row = rows[0];
    if (!row) return null;

    return {
      id: Number(row.id),
      effectiveSeconds: Number(row.effectiveSeconds),
      grossRevenue: Number(row.grossRevenue),
      wagesDeducted: Number(row.wagesDeducted),
      upkeepDeducted: Number(row.upkeepDeducted),
      netCashEarned: Number(row.netCashEarned),
      xpEarned: Number(row.xpEarned),
    };
  }

  /**
   * Idempotently claims a pending offline earnings session using FOR UPDATE + reference_id.
   */
  async claimOfflineSession(
    playerId: number,
    sessionId: number
  ): Promise<{ netCashEarned: number; balanceAfter: number; xpEarned: number }> {
    return withTransaction(async (conn) => {
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT id, net_cash_earned AS netCashEarned, xp_earned AS xpEarned, claimed_at AS claimedAt
         FROM offline_earnings_sessions
         WHERE id = ? AND player_id = ?
         FOR UPDATE`,
        [sessionId, playerId]
      );

      const session = rows[0];
      if (!session) {
        throw new AppError('Offline earnings session not found', 404, 'OFFLINE_SESSION_NOT_FOUND');
      }
      if (session.claimedAt !== null) {
        throw new AppError('Offline earnings already claimed', 409, 'ALREADY_CLAIMED');
      }

      const netCashEarned = Number(session.netCashEarned);
      const xpEarned = Number(session.xpEarned);

      await conn.query(
        `UPDATE offline_earnings_sessions SET claimed_at = UTC_TIMESTAMP() WHERE id = ?`,
        [sessionId]
      );

      const { balanceAfter } = await this.economyService.recordCashTransaction(conn, {
        playerId,
        transactionType: 'REVENUE',
        category: 'OFFLINE_EARNINGS',
        amount: netCashEarned,
        isCredit: true,
        referenceId: `offline_session_${sessionId}`,
        description: `Offline earnings claimed (${netCashEarned.toFixed(2)})`,
      });

      if (xpEarned > 0) {
        const [progRows] = await conn.query<RowDataPacket[]>(
          `SELECT xp_level AS xpLevel, current_xp AS currentXp
           FROM player_progression
           WHERE player_id = ?
           FOR UPDATE`,
          [playerId]
        );
        if (progRows[0]) {
          const nextProg = applyXpGain(
            Number(progRows[0].xpLevel),
            Number(progRows[0].currentXp),
            xpEarned
          );
          await conn.query(
            `UPDATE player_progression SET xp_level = ?, current_xp = ? WHERE player_id = ?`,
            [nextProg.xpLevel, nextProg.currentXp, playerId]
          );
        }
      }

      return { netCashEarned, balanceAfter, xpEarned };
    });
  }
}
