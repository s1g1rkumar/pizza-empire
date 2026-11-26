import { RowDataPacket } from 'mysql2/promise';
import { withTransaction } from '../database/pool';
import { FarmDashboardDTO, FarmRepository } from '../repositories/farm.repository';
import { AppError, ConflictError, NotFoundError } from '../utils/errors';
import {
  calculateEffectiveGrowthSeconds,
  calculateHarvestYield,
  calculatePlotUnlockCost,
  calculateUpgradeCost,
  FERTILIZER_COSTS,
  FertilizerType,
} from '../utils/farmingCalculator';
import { applyXpGain } from '../utils/simulationTime';
import { EconomyService } from './economy.service';

export class FarmService {
  private readonly farmRepository = new FarmRepository();
  private readonly economyService = new EconomyService();

  async getDashboard(playerId: number): Promise<FarmDashboardDTO> {
    return this.farmRepository.getFarmDashboard(playerId);
  }

  async buySeeds(playerId: number, cropId: number, quantity: number): Promise<FarmDashboardDTO> {
    await withTransaction(async (conn) => {
      const [cropRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, name, seed_cost AS seedCost, unlock_xp_level AS unlockXpLevel
         FROM crops WHERE id = ? LIMIT 1`,
        [cropId]
      );
      const crop = cropRows[0];
      if (!crop) throw new NotFoundError('Crop not found');

      const [progRows] = await conn.query<RowDataPacket[]>(
        `SELECT xp_level AS xpLevel FROM player_progression WHERE player_id = ? LIMIT 1`,
        [playerId]
      );
      const xpLevel = Number(progRows[0]?.xpLevel ?? 1);
      if (xpLevel < Number(crop.unlockXpLevel)) {
        throw new AppError(
          `Requires XP Level ${crop.unlockXpLevel} to buy ${crop.name} seeds`,
          403,
          'CROP_LOCKED'
        );
      }

      const totalCost = Number((Number(crop.seedCost) * quantity).toFixed(2));
      const farmBusinessId = await this.farmRepository.getFarmBusinessId(playerId, conn);

      await this.economyService.recordCashTransaction(conn, {
        playerId,
        businessId: farmBusinessId,
        transactionType: 'EXPENSE',
        category: 'SEED_COST',
        amount: totalCost,
        isCredit: false,
        description: `Purchased ${quantity}x ${crop.name} seeds`,
      });

      await conn.query(
        `INSERT INTO player_seed_inventory (player_id, crop_id, quantity)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
        [playerId, cropId, quantity]
      );
    });

    return this.farmRepository.getFarmDashboard(playerId);
  }

  async unlockPlot(playerId: number, plotId: number): Promise<FarmDashboardDTO> {
    await withTransaction(async (conn) => {
      const [plotRows] = await conn.query<RowDataPacket[]>(
        `SELECT fp.id, fp.farm_id AS farmId, fp.plot_index AS plotIndex, fp.is_unlocked AS isUnlocked, f.land_id AS landId
         FROM farm_plots fp
         INNER JOIN farms f ON f.id = fp.farm_id
         WHERE fp.id = ? AND fp.player_id = ?
         FOR UPDATE`,
        [plotId, playerId]
      );
      const plot = plotRows[0];
      if (!plot) throw new NotFoundError('Farm plot not found');
      if (plot.isUnlocked) throw new ConflictError('Plot is already unlocked');

      const cost = calculatePlotUnlockCost(Number(plot.plotIndex));
      const farmBusinessId = await this.farmRepository.getFarmBusinessId(playerId, conn);

      await this.economyService.recordCashTransaction(conn, {
        playerId,
        businessId: farmBusinessId,
        transactionType: 'CAPEX',
        category: 'UPGRADE',
        amount: cost,
        isCredit: false,
        description: `Unlocked Farm Plot #${plot.plotIndex}`,
      });

      await conn.query(`UPDATE farm_plots SET is_unlocked = 1 WHERE id = ?`, [plotId]);
      await conn.query(
        `UPDATE lands SET unlocked_plots_count = unlocked_plots_count + 1 WHERE id = ?`,
        [Number(plot.landId)]
      );
    });

    return this.farmRepository.getFarmDashboard(playerId);
  }

  async plantCrop(
    playerId: number,
    plotId: number,
    cropId: number,
    autoBuySeed = true
  ): Promise<FarmDashboardDTO> {
    await withTransaction(async (conn) => {
      const [plotRows] = await conn.query<RowDataPacket[]>(
        `SELECT fp.id, fp.is_unlocked AS isUnlocked, fp.status, fp.hydration_pct AS hydrationPct,
                fp.fertilizer_type AS fertilizerType, f.irrigation_level AS irrigationLevel
         FROM farm_plots fp
         INNER JOIN farms f ON f.id = fp.farm_id
         WHERE fp.id = ? AND fp.player_id = ?
         FOR UPDATE`,
        [plotId, playerId]
      );
      const plot = plotRows[0];
      if (!plot) throw new NotFoundError('Farm plot not found');
      if (!plot.isUnlocked) throw new AppError('Plot is locked', 403, 'PLOT_LOCKED');
      if (plot.status !== 'EMPTY') throw new ConflictError('Plot is not empty');

      const [cropRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, name, seed_cost AS seedCost, growth_seconds AS growthSeconds,
                water_requirement AS waterRequirement, unlock_xp_level AS unlockXpLevel
         FROM crops WHERE id = ? LIMIT 1`,
        [cropId]
      );
      const crop = cropRows[0];
      if (!crop) throw new NotFoundError('Crop not found');

      const [progRows] = await conn.query<RowDataPacket[]>(
        `SELECT xp_level AS xpLevel FROM player_progression WHERE player_id = ? LIMIT 1`,
        [playerId]
      );
      if (Number(progRows[0]?.xpLevel ?? 1) < Number(crop.unlockXpLevel)) {
        throw new AppError(`Requires XP Level ${crop.unlockXpLevel}`, 403, 'CROP_LOCKED');
      }

      // Consume owned seed or auto-buy 1 seed
      const [seedRows] = await conn.query<RowDataPacket[]>(
        `SELECT quantity FROM player_seed_inventory WHERE player_id = ? AND crop_id = ? FOR UPDATE`,
        [playerId, cropId]
      );
      const ownedSeeds = Number(seedRows[0]?.quantity ?? 0);

      if (ownedSeeds >= 1) {
        await conn.query(
          `UPDATE player_seed_inventory SET quantity = quantity - 1 WHERE player_id = ? AND crop_id = ?`,
          [playerId, cropId]
        );
      } else if (autoBuySeed) {
        const farmBusinessId = await this.farmRepository.getFarmBusinessId(playerId, conn);
        await this.economyService.recordCashTransaction(conn, {
          playerId,
          businessId: farmBusinessId,
          transactionType: 'EXPENSE',
          category: 'SEED_COST',
          amount: Number(crop.seedCost),
          isCredit: false,
          description: `Auto-bought 1x ${crop.name} seed for planting`,
        });
      } else {
        throw new AppError('No seeds available for this crop', 422, 'NO_SEEDS');
      }

      const irrigationLevel = Number(plot.irrigationLevel);
      const hydrationPct = irrigationLevel > 0 ? 100 : Number(plot.hydrationPct);
      const effectiveSeconds = calculateEffectiveGrowthSeconds({
        baseGrowthSeconds: Number(crop.growthSeconds),
        irrigationLevel,
        hydrationPct,
        waterRequirement: Number(crop.waterRequirement),
        fertilizerType: plot.fertilizerType as FertilizerType,
      });

      const now = new Date();
      const readyAt = new Date(now.getTime() + effectiveSeconds * 1000);

      await conn.query(
        `UPDATE farm_plots
         SET crop_id = ?, status = 'GROWING', hydration_pct = ?, planted_at = ?, ready_at = ?
         WHERE id = ?`,
        [cropId, hydrationPct, now, readyAt, plotId]
      );
    });

    return this.farmRepository.getFarmDashboard(playerId);
  }

  async waterPlot(playerId: number, plotId: number): Promise<FarmDashboardDTO> {
    await withTransaction(async (conn) => {
      const [plotRows] = await conn.query<RowDataPacket[]>(
        `SELECT fp.id, fp.status, fp.hydration_pct AS hydrationPct, fp.ready_at AS readyAt
         FROM farm_plots fp
         WHERE fp.id = ? AND fp.player_id = ?
         FOR UPDATE`,
        [plotId, playerId]
      );
      const plot = plotRows[0];
      if (!plot) throw new NotFoundError('Farm plot not found');
      if (Number(plot.hydrationPct) >= 100) {
        return;
      }

      if (plot.status === 'GROWING' && plot.readyAt) {
        const nowMs = Date.now();
        const readyMs = new Date(String(plot.readyAt)).getTime();
        const remainingMs = Math.max(0, readyMs - nowMs);
        const boostedReadyAt = new Date(nowMs + Math.floor(remainingMs * 0.75));
        await conn.query(`UPDATE farm_plots SET hydration_pct = 100, ready_at = ? WHERE id = ?`, [
          boostedReadyAt,
          plotId,
        ]);
      } else {
        await conn.query(`UPDATE farm_plots SET hydration_pct = 100 WHERE id = ?`, [plotId]);
      }
    });

    return this.farmRepository.getFarmDashboard(playerId);
  }

  async fertilizePlot(
    playerId: number,
    plotId: number,
    fertilizerType: Exclude<FertilizerType, 'NONE'>
  ): Promise<FarmDashboardDTO> {
    await withTransaction(async (conn) => {
      const [plotRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, is_unlocked AS isUnlocked, fertilizer_type AS fertilizerType
         FROM farm_plots WHERE id = ? AND player_id = ? FOR UPDATE`,
        [plotId, playerId]
      );
      const plot = plotRows[0];
      if (!plot) throw new NotFoundError('Farm plot not found');
      if (!plot.isUnlocked) throw new AppError('Plot is locked', 403, 'PLOT_LOCKED');
      if (plot.fertilizerType === fertilizerType) {
        throw new ConflictError(`${fertilizerType} is already applied to this plot`);
      }

      const cost = FERTILIZER_COSTS[fertilizerType];
      const farmBusinessId = await this.farmRepository.getFarmBusinessId(playerId, conn);

      await this.economyService.recordCashTransaction(conn, {
        playerId,
        businessId: farmBusinessId,
        transactionType: 'EXPENSE',
        category: 'OTHER',
        amount: cost,
        isCredit: false,
        description: `Applied ${fertilizerType} fertilizer to Plot`,
      });

      await conn.query(`UPDATE farm_plots SET fertilizer_type = ? WHERE id = ?`, [
        fertilizerType,
        plotId,
      ]);
    });

    return this.farmRepository.getFarmDashboard(playerId);
  }

  async harvestPlot(playerId: number, plotId: number): Promise<FarmDashboardDTO> {
    await withTransaction(async (conn) => {
      const [plotRows] = await conn.query<RowDataPacket[]>(
        `SELECT
           fp.id, fp.farm_id AS farmId, fp.crop_id AS cropId, fp.status,
           fp.fertilizer_type AS fertilizerType, fp.ready_at AS readyAt,
           f.barn_capacity AS barnCapacity, f.irrigation_level AS irrigationLevel,
           c.base_yield AS baseYield, c.quality, c.code AS cropCode, c.name AS cropName
         FROM farm_plots fp
         INNER JOIN farms f ON f.id = fp.farm_id
         LEFT JOIN crops c ON c.id = fp.crop_id
         WHERE fp.id = ? AND fp.player_id = ?
         FOR UPDATE`,
        [plotId, playerId]
      );
      const plot = plotRows[0];
      if (!plot) throw new NotFoundError('Farm plot not found');
      if (!plot.cropId || plot.status === 'EMPTY') {
        throw new ConflictError('Nothing planted on this plot');
      }

      const readyAt = plot.readyAt ? new Date(String(plot.readyAt)) : null;
      if (plot.status !== 'READY' && (!readyAt || readyAt.getTime() > Date.now())) {
        throw new ConflictError('Crop is not ready for harvest yet');
      }

      const yieldQty = calculateHarvestYield({
        baseYield: Number(plot.baseYield),
        quality: Number(plot.quality),
        fertilizerType: plot.fertilizerType as FertilizerType,
      });

      const farmBusinessId = await this.farmRepository.getFarmBusinessId(playerId, conn);

      const [invSumRows] = await conn.query<RowDataPacket[]>(
        `SELECT COALESCE(SUM(bi.quantity), 0) AS totalUsed
         FROM business_inventory bi
         INNER JOIN inventory_items ii ON ii.id = bi.item_id
         WHERE bi.business_id = ? AND ii.category = 'RAW_CROP'`,
        [farmBusinessId]
      );
      const barnUsed = Number(invSumRows[0]?.totalUsed ?? 0);
      const barnCapacity = Number(plot.barnCapacity);

      if (barnUsed + yieldQty > barnCapacity) {
        throw new AppError(
          `Barn storage full (${barnUsed}/${barnCapacity}). Sell crops or upgrade Barn Silo.`,
          422,
          'BARN_FULL'
        );
      }

      const [itemRows] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM inventory_items WHERE crop_id = ? LIMIT 1`,
        [Number(plot.cropId)]
      );
      if (!itemRows[0]) throw new NotFoundError('Inventory item for crop not found');
      const itemId = Number(itemRows[0].id);

      await conn.query(
        `INSERT INTO business_inventory (player_id, business_id, item_id, quantity)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
        [playerId, farmBusinessId, itemId, yieldQty]
      );

      // Reset plot (keep hydration at 100 if irrigation > 0, else drop to 50)
      const nextHydration = Number(plot.irrigationLevel) > 0 ? 100 : 50;
      await conn.query(
        `UPDATE farm_plots
         SET crop_id = NULL, status = 'EMPTY', hydration_pct = ?, fertilizer_type = 'NONE', planted_at = NULL, ready_at = NULL
         WHERE id = ?`,
        [nextHydration, plotId]
      );

      // Award XP & update progression + missions
      const [progRows] = await conn.query<RowDataPacket[]>(
        `SELECT xp_level AS xpLevel, current_xp AS currentXp
         FROM player_progression WHERE player_id = ? FOR UPDATE`,
        [playerId]
      );
      if (progRows[0]) {
        const nextProg = applyXpGain(
          Number(progRows[0].xpLevel),
          Number(progRows[0].currentXp),
          yieldQty * 4
        );
        await conn.query(
          `UPDATE player_progression
           SET xp_level = ?, current_xp = ?, total_crops_harvested = total_crops_harvested + ?
           WHERE player_id = ?`,
          [nextProg.xpLevel, nextProg.currentXp, yieldQty, playerId]
        );
      }

      // Update matching onboarding harvest mission
      await conn.query(
        `UPDATE player_missions pm
         INNER JOIN missions m ON m.id = pm.mission_id
         SET pm.progress_value = LEAST(m.target_value, pm.progress_value + ?),
             pm.status = IF(pm.progress_value + ? >= m.target_value, 'COMPLETED', pm.status),
             pm.completed_at = IF(pm.progress_value + ? >= m.target_value AND pm.completed_at IS NULL, UTC_TIMESTAMP(), pm.completed_at)
         WHERE pm.player_id = ? AND pm.status = 'ACTIVE' AND m.target_metric = ?`,
        [yieldQty, yieldQty, yieldQty, playerId, `CROPS_HARVESTED_${String(plot.cropCode)}`]
      );
    });

    return this.farmRepository.getFarmDashboard(playerId);
  }

  async sellCrops(playerId: number, itemId: number, quantity: number): Promise<FarmDashboardDTO> {
    await withTransaction(async (conn) => {
      const farmBusinessId = await this.farmRepository.getFarmBusinessId(playerId, conn);

      const [invRows] = await conn.query<RowDataPacket[]>(
        `SELECT bi.quantity, ii.name, ii.unit_wholesale_sell AS sellPrice
         FROM business_inventory bi
         INNER JOIN inventory_items ii ON ii.id = bi.item_id
         WHERE bi.business_id = ? AND bi.item_id = ? AND ii.category = 'RAW_CROP'
         FOR UPDATE`,
        [farmBusinessId, itemId]
      );
      const inv = invRows[0];
      if (!inv || Number(inv.quantity) < quantity) {
        throw new AppError('Insufficient crop quantity in Barn', 422, 'INSUFFICIENT_INVENTORY');
      }

      await conn.query(
        `UPDATE business_inventory SET quantity = quantity - ? WHERE business_id = ? AND item_id = ?`,
        [quantity, farmBusinessId, itemId]
      );

      const totalRevenue = Number((Number(inv.sellPrice) * quantity).toFixed(2));
      await this.economyService.recordCashTransaction(conn, {
        playerId,
        businessId: farmBusinessId,
        transactionType: 'REVENUE',
        category: 'CROP_SALE',
        amount: totalRevenue,
        isCredit: true,
        description: `Sold ${quantity}x ${inv.name} at Farmers' Market`,
      });

      await conn.query(
        `UPDATE player_missions pm
         INNER JOIN missions m ON m.id = pm.mission_id
         SET pm.progress_value = LEAST(m.target_value, pm.progress_value + ?),
             pm.status = IF(pm.progress_value + ? >= m.target_value, 'COMPLETED', pm.status),
             pm.completed_at = IF(pm.progress_value + ? >= m.target_value AND pm.completed_at IS NULL, UTC_TIMESTAMP(), pm.completed_at)
         WHERE pm.player_id = ? AND pm.status = 'ACTIVE' AND m.target_metric = 'CROPS_SOLD_TOTAL'`,
        [quantity, quantity, quantity, playerId]
      );
    });

    return this.farmRepository.getFarmDashboard(playerId);
  }

  async purchaseUpgrade(playerId: number, upgradeCode: string): Promise<FarmDashboardDTO> {
    await withTransaction(async (conn) => {
      const farmBusinessId = await this.farmRepository.getFarmBusinessId(playerId, conn);

      const [upgRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, name, max_level AS maxLevel, base_cost AS baseCost, cost_growth_factor AS growthFactor, effect_per_level AS effectPerLevel
         FROM business_upgrades
         WHERE code = ? AND business_type = 'FARM'
         LIMIT 1`,
        [upgradeCode]
      );
      const upg = upgRows[0];
      if (!upg) throw new NotFoundError('Farm upgrade not found');

      const [puRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, current_level AS currentLevel
         FROM player_upgrades
         WHERE player_id = ? AND upgrade_id = ? AND business_id = ?
         FOR UPDATE`,
        [playerId, Number(upg.id), farmBusinessId]
      );
      const currentLevel = Number(puRows[0]?.currentLevel ?? 0);
      if (currentLevel >= Number(upg.maxLevel)) {
        throw new ConflictError('Upgrade is already at maximum level');
      }

      const cost = calculateUpgradeCost(
        Number(upg.baseCost),
        Number(upg.growthFactor),
        currentLevel
      );

      await this.economyService.recordCashTransaction(conn, {
        playerId,
        businessId: farmBusinessId,
        transactionType: 'CAPEX',
        category: 'UPGRADE',
        amount: cost,
        isCredit: false,
        description: `Upgraded ${upg.name} to Lv ${currentLevel + 1}`,
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
          [playerId, Number(upg.id), farmBusinessId]
        );
      }

      if (upgradeCode === 'FARM_DRIP_IRRIGATION') {
        await conn.query(
          `UPDATE farms SET irrigation_level = irrigation_level + 1 WHERE player_id = ?`,
          [playerId]
        );
      } else if (upgradeCode === 'FARM_BARN_SILO') {
        await conn.query(`UPDATE farms SET barn_capacity = barn_capacity + ? WHERE player_id = ?`, [
          Math.floor(Number(upg.effectPerLevel)),
          playerId,
        ]);
      }
    });

    return this.farmRepository.getFarmDashboard(playerId);
  }
}
