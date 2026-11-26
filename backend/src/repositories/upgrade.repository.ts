import { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { dbPool } from '../database/pool';
import {
  calculateBusinessUpgradeCost,
  computeUpgradeMultipliers,
  UpgradeMultiplierSummary,
} from '../utils/upgradeCalculator';

export interface UpgradeDTO {
  id: number;
  code: string;
  name: string;
  category: string;
  businessType: string;
  description: string;
  currentLevel: number;
  maxLevel: number;
  effectPerLevel: number;
  nextCost: number;
  unlockLevelNumber: number;
  isUnlocked: boolean;
}

export interface UpgradesDashboardDTO {
  cashBalance: number;
  currentStageLevel: number;
  multipliers: UpgradeMultiplierSummary;
  upgrades: UpgradeDTO[];
}

export class UpgradeRepository {
  async getPlayerUpgradeMultipliers(
    playerId: number,
    conn?: PoolConnection
  ): Promise<UpgradeMultiplierSummary> {
    const exec = conn ?? dbPool;
    const [rows] = await exec.query<RowDataPacket[]>(
      `SELECT bu.code, COALESCE(pu.current_level, 0) AS currentLevel, bu.effect_per_level AS effectPerLevel
       FROM business_upgrades bu
       LEFT JOIN player_upgrades pu ON pu.upgrade_id = bu.id AND pu.player_id = ?`,
      [playerId]
    );

    return computeUpgradeMultipliers(
      rows.map((r) => ({
        code: String(r.code),
        currentLevel: Number(r.currentLevel),
        effectPerLevel: Number(r.effectPerLevel),
      }))
    );
  }

  async getUpgradesDashboard(playerId: number): Promise<UpgradesDashboardDTO> {
    const [pRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT pp.cash_balance AS cashBalance, gl.level_number AS currentStageLevel
       FROM player_profiles pp
       INNER JOIN player_progression pg ON pg.player_id = pp.id
       INNER JOIN game_levels gl ON gl.id = pg.current_level_id
       WHERE pp.id = ? LIMIT 1`,
      [playerId]
    );
    const cashBalance = Number(pRows[0]?.cashBalance ?? 0);
    const currentStageLevel = Number(pRows[0]?.currentStageLevel ?? 1);

    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         bu.id, bu.code, bu.name, bu.category, bu.business_type AS businessType,
         bu.max_level AS maxLevel, bu.base_cost AS baseCost,
         bu.cost_growth_factor AS growthFactor, bu.effect_per_level AS effectPerLevel,
         bu.unlock_level_number AS unlockLevelNumber, bu.description,
         COALESCE(MAX(pu.current_level), 0) AS currentLevel
       FROM business_upgrades bu
       LEFT JOIN player_upgrades pu ON pu.upgrade_id = bu.id AND pu.player_id = ?
       GROUP BY bu.id, bu.code, bu.name, bu.category, bu.business_type, bu.max_level,
                bu.base_cost, bu.cost_growth_factor, bu.effect_per_level,
                bu.unlock_level_number, bu.description
       ORDER BY bu.unlock_level_number ASC, bu.id ASC`,
      [playerId]
    );

    const upgrades: UpgradeDTO[] = rows.map((r) => {
      const currentLevel = Number(r.currentLevel);
      const unlockLevelNumber = Number(r.unlockLevelNumber);
      return {
        id: Number(r.id),
        code: String(r.code),
        name: String(r.name),
        category: String(r.category),
        businessType: String(r.businessType),
        description: String(r.description),
        currentLevel,
        maxLevel: Number(r.maxLevel),
        effectPerLevel: Number(r.effectPerLevel),
        nextCost: calculateBusinessUpgradeCost(
          Number(r.baseCost),
          Number(r.growthFactor),
          currentLevel
        ),
        unlockLevelNumber,
        isUnlocked: currentStageLevel >= unlockLevelNumber,
      };
    });

    const multipliers = computeUpgradeMultipliers(
      upgrades.map((u) => ({
        code: u.code,
        currentLevel: u.currentLevel,
        effectPerLevel: u.effectPerLevel,
      }))
    );

    return {
      cashBalance,
      currentStageLevel,
      multipliers,
      upgrades,
    };
  }
}
