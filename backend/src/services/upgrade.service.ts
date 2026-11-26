import { RowDataPacket } from 'mysql2/promise';
import { withTransaction } from '../database/pool';
import { UpgradeRepository, UpgradesDashboardDTO } from '../repositories/upgrade.repository';
import { AppError, ConflictError, NotFoundError } from '../utils/errors';
import { calculateBusinessUpgradeCost } from '../utils/upgradeCalculator';
import { EconomyService } from './economy.service';

export class UpgradeService {
  private readonly upgradeRepo = new UpgradeRepository();
  private readonly economyService = new EconomyService();

  async getDashboard(playerId: number): Promise<UpgradesDashboardDTO> {
    return this.upgradeRepo.getUpgradesDashboard(playerId);
  }

  async purchaseUpgrade(playerId: number, upgradeCode: string): Promise<UpgradesDashboardDTO> {
    await withTransaction(async (conn) => {
      const [stageRows] = await conn.query<RowDataPacket[]>(
        `SELECT gl.level_number AS currentStageLevel
         FROM player_progression pg
         INNER JOIN game_levels gl ON gl.id = pg.current_level_id
         WHERE pg.player_id = ? LIMIT 1`,
        [playerId]
      );
      const currentStage = Number(stageRows[0]?.currentStageLevel ?? 1);

      const [upgRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, name, business_type AS businessType, max_level AS maxLevel,
                base_cost AS baseCost, cost_growth_factor AS growthFactor,
                effect_per_level AS effectPerLevel, unlock_level_number AS unlockLevelNumber
         FROM business_upgrades
         WHERE code = ? LIMIT 1`,
        [upgradeCode]
      );
      const upg = upgRows[0];
      if (!upg) throw new NotFoundError('Upgrade not found');

      if (currentStage < Number(upg.unlockLevelNumber)) {
        throw new AppError(
          `Requires Business Stage ${upg.unlockLevelNumber} to unlock ${String(upg.name)}`,
          403,
          'UPGRADE_LOCKED'
        );
      }

      let businessId: number | null = null;
      if (upg.businessType !== 'GLOBAL') {
        const [bizRows] = await conn.query<RowDataPacket[]>(
          `SELECT id FROM businesses
           WHERE player_id = ? AND business_type = ? AND deleted_at IS NULL
           ORDER BY id ASC LIMIT 1`,
          [playerId, String(upg.businessType)]
        );
        businessId = bizRows[0] ? Number(bizRows[0].id) : null;
      }

      const businessScopeId = businessId ?? 0;

      const [puRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, current_level AS currentLevel
         FROM player_upgrades
         WHERE player_id = ? AND upgrade_id = ? AND business_scope_id = ?
         FOR UPDATE`,
        [playerId, Number(upg.id), businessScopeId]
      );

      const currentLevel = Number(puRows[0]?.currentLevel ?? 0);
      if (currentLevel >= Number(upg.maxLevel)) {
        throw new ConflictError(`${String(upg.name)} is already at maximum level`);
      }

      const cost = calculateBusinessUpgradeCost(
        Number(upg.baseCost),
        Number(upg.growthFactor),
        currentLevel
      );

      await this.economyService.recordCashTransaction(conn, {
        playerId,
        businessId,
        transactionType: 'CAPEX',
        category: 'UPGRADE',
        amount: cost,
        isCredit: false,
        description: `Upgraded ${String(upg.name)} to Lv ${currentLevel + 1}`,
      });

      if (puRows[0]) {
        await conn.query(
          `UPDATE player_upgrades SET current_level = current_level + 1 WHERE id = ?`,
          [Number(puRows[0].id)]
        );
      } else {
        await conn.query(
          `INSERT INTO player_upgrades (player_id, upgrade_id, business_id, current_level)
           VALUES (?, ?, ?, 1)`,
          [playerId, Number(upg.id), businessId]
        );
      }

      // Apply immediate facility effects where applicable
      if (upgradeCode === 'FARM_DRIP_IRRIGATION') {
        await conn.query(
          `UPDATE farms SET irrigation_level = irrigation_level + 1 WHERE player_id = ?`,
          [playerId]
        );
      } else if (upgradeCode === 'UPG_FARM_LAND' || upgradeCode === 'FARM_BARN_SILO') {
        await conn.query(`UPDATE farms SET barn_capacity = barn_capacity + ? WHERE player_id = ?`, [
          Math.floor(Number(upg.effectPerLevel)),
          playerId,
        ]);
      } else if (upgradeCode === 'REST_DINING_TABLES') {
        await conn.query(
          `UPDATE restaurants SET dining_tables_count = dining_tables_count + 1 WHERE player_id = ?`,
          [playerId]
        );
      } else if (upgradeCode === 'REST_BRICK_OVEN') {
        await conn.query(`UPDATE restaurants SET oven_count = oven_count + 1 WHERE player_id = ?`, [
          playerId,
        ]);
      } else if (upgradeCode === 'UPG_REST_DECOR') {
        await conn.query(
          `UPDATE restaurants SET decor_level = decor_level + 1 WHERE player_id = ?`,
          [playerId]
        );
      } else if (upgradeCode === 'TECH_OFFLINE_CAP') {
        await conn.query(
          `UPDATE player_profiles SET offline_cap_seconds = offline_cap_seconds + 3600 WHERE id = ?`,
          [playerId]
        );
      }
    });

    return this.upgradeRepo.getUpgradesDashboard(playerId);
  }
}
