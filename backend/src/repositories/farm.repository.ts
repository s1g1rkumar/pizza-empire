import { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { dbPool } from '../database/pool';
import {
  calculatePlotUnlockCost,
  calculateUpgradeCost,
  FertilizerType,
} from '../utils/farmingCalculator';

export interface FarmDashboardDTO {
  farm: {
    id: number;
    businessId: number;
    name: string;
    irrigationLevel: number;
    barnCapacity: number;
    barnUsed: number;
    unlockedPlotsCount: number;
    totalPlotsCapacity: number;
  };
  player: {
    cashBalance: number;
    xpLevel: number;
  };
  crops: Array<{
    id: number;
    code: string;
    name: string;
    seedCost: number;
    growthSeconds: number;
    waterRequirement: number;
    baseYield: number;
    marketSellPrice: number;
    quality: number;
    unlockXpLevel: number;
    seedsOwned: number;
    isUnlocked: boolean;
  }>;
  plots: Array<{
    id: number;
    plotIndex: number;
    isUnlocked: boolean;
    unlockCost: number;
    cropId: number | null;
    cropCode: string | null;
    cropName: string | null;
    status: 'EMPTY' | 'GROWING' | 'READY';
    hydrationPct: number;
    fertilizerType: FertilizerType;
    plantedAt: string | null;
    readyAt: string | null;
  }>;
  barnInventory: Array<{
    itemId: number;
    code: string;
    name: string;
    quantity: number;
    sellPrice: number;
  }>;
  upgrades: Array<{
    id: number;
    code: string;
    name: string;
    description: string;
    currentLevel: number;
    maxLevel: number;
    nextCost: number;
  }>;
}

export class FarmRepository {
  async getFarmBusinessId(playerId: number, conn?: PoolConnection): Promise<number> {
    const executor = conn ?? dbPool;
    const [rows] = await executor.query<RowDataPacket[]>(
      `SELECT id FROM businesses
       WHERE player_id = ? AND business_type = 'FARM' AND deleted_at IS NULL
       ORDER BY id ASC LIMIT 1`,
      [playerId]
    );
    if (!rows[0]) {
      throw new Error('Starter farm business not found');
    }
    return Number(rows[0].id);
  }

  async getFarmDashboard(playerId: number): Promise<FarmDashboardDTO> {
    // Mature any ready plots on read so UI sees accurate READY state
    await dbPool.query(
      `UPDATE farm_plots
       SET status = 'READY'
       WHERE player_id = ? AND status = 'GROWING' AND ready_at <= UTC_TIMESTAMP()`,
      [playerId]
    );

    const [playerRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT pp.cash_balance AS cashBalance, pg.xp_level AS xpLevel
       FROM player_profiles pp
       INNER JOIN player_progression pg ON pg.player_id = pp.id
       WHERE pp.id = ? LIMIT 1`,
      [playerId]
    );
    const cashBalance = Number(playerRows[0]?.cashBalance ?? 0);
    const xpLevel = Number(playerRows[0]?.xpLevel ?? 1);

    const [farmRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         f.id,
         f.name,
         f.irrigation_level AS irrigationLevel,
         f.barn_capacity AS barnCapacity,
         l.unlocked_plots_count AS unlockedPlotsCount,
         l.total_plots_capacity AS totalPlotsCapacity
       FROM farms f
       INNER JOIN lands l ON l.id = f.land_id
       WHERE f.player_id = ? AND f.deleted_at IS NULL
       ORDER BY f.id ASC LIMIT 1`,
      [playerId]
    );
    const farm = farmRows[0];
    if (!farm) {
      throw new Error('Farm not found');
    }

    const farmBusinessId = await this.getFarmBusinessId(playerId);

    const [cropRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         c.id, c.code, c.name, c.seed_cost AS seedCost, c.growth_seconds AS growthSeconds,
         c.water_requirement AS waterRequirement, c.base_yield AS baseYield,
         c.market_sell_price AS marketSellPrice, c.quality, c.unlock_xp_level AS unlockXpLevel,
         COALESCE(psi.quantity, 0) AS seedsOwned
       FROM crops c
       LEFT JOIN player_seed_inventory psi ON psi.crop_id = c.id AND psi.player_id = ?
       ORDER BY c.unlock_xp_level ASC, c.id ASC`,
      [playerId]
    );

    const [plotRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         fp.id, fp.plot_index AS plotIndex, fp.is_unlocked AS isUnlocked,
         fp.crop_id AS cropId, c.code AS cropCode, c.name AS cropName,
         fp.status, fp.hydration_pct AS hydrationPct, fp.fertilizer_type AS fertilizerType,
         fp.planted_at AS plantedAt, fp.ready_at AS readyAt
       FROM farm_plots fp
       LEFT JOIN crops c ON c.id = fp.crop_id
       WHERE fp.farm_id = ?
       ORDER BY fp.plot_index ASC`,
      [Number(farm.id)]
    );

    const [invRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         ii.id AS itemId,
         ii.code,
         ii.name,
         COALESCE(bi.quantity, 0) AS quantity,
         ii.unit_wholesale_sell AS sellPrice
       FROM inventory_items ii
       LEFT JOIN business_inventory bi ON bi.item_id = ii.id AND bi.business_id = ?
       WHERE ii.category = 'RAW_CROP'
       ORDER BY ii.id ASC`,
      [farmBusinessId]
    );

    const barnUsed = invRows.reduce((sum, r) => sum + Number(r.quantity ?? 0), 0);

    const [upgRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         bu.id, bu.code, bu.name, bu.description, bu.max_level AS maxLevel,
         bu.base_cost AS baseCost, bu.cost_growth_factor AS growthFactor,
         COALESCE(pu.current_level, 0) AS currentLevel
       FROM business_upgrades bu
       LEFT JOIN player_upgrades pu
         ON pu.upgrade_id = bu.id AND pu.player_id = ? AND pu.business_id = ?
       WHERE bu.business_type = 'FARM'
       ORDER BY bu.id ASC`,
      [playerId, farmBusinessId]
    );

    return {
      farm: {
        id: Number(farm.id),
        businessId: farmBusinessId,
        name: String(farm.name),
        irrigationLevel: Number(farm.irrigationLevel),
        barnCapacity: Number(farm.barnCapacity),
        barnUsed,
        unlockedPlotsCount: Number(farm.unlockedPlotsCount),
        totalPlotsCapacity: Number(farm.totalPlotsCapacity),
      },
      player: {
        cashBalance,
        xpLevel,
      },
      crops: cropRows.map((c) => ({
        id: Number(c.id),
        code: String(c.code),
        name: String(c.name),
        seedCost: Number(c.seedCost),
        growthSeconds: Number(c.growthSeconds),
        waterRequirement: Number(c.waterRequirement),
        baseYield: Number(c.baseYield),
        marketSellPrice: Number(c.marketSellPrice),
        quality: Number(c.quality),
        unlockXpLevel: Number(c.unlockXpLevel),
        seedsOwned: Number(c.seedsOwned),
        isUnlocked: xpLevel >= Number(c.unlockXpLevel),
      })),
      plots: plotRows.map((p) => ({
        id: Number(p.id),
        plotIndex: Number(p.plotIndex),
        isUnlocked: Boolean(p.isUnlocked),
        unlockCost: calculatePlotUnlockCost(Number(p.plotIndex)),
        cropId: p.cropId ? Number(p.cropId) : null,
        cropCode: p.cropCode ? String(p.cropCode) : null,
        cropName: p.cropName ? String(p.cropName) : null,
        status: p.status as 'EMPTY' | 'GROWING' | 'READY',
        hydrationPct: Number(p.hydrationPct),
        fertilizerType: p.fertilizerType as FertilizerType,
        plantedAt: p.plantedAt ? new Date(String(p.plantedAt)).toISOString() : null,
        readyAt: p.readyAt ? new Date(String(p.readyAt)).toISOString() : null,
      })),
      barnInventory: invRows.map((i) => ({
        itemId: Number(i.itemId),
        code: String(i.code),
        name: String(i.name),
        quantity: Number(i.quantity),
        sellPrice: Number(i.sellPrice),
      })),
      upgrades: upgRows.map((u) => {
        const currentLevel = Number(u.currentLevel);
        return {
          id: Number(u.id),
          code: String(u.code),
          name: String(u.name),
          description: String(u.description),
          currentLevel,
          maxLevel: Number(u.maxLevel),
          nextCost: calculateUpgradeCost(Number(u.baseCost), Number(u.growthFactor), currentLevel),
        };
      }),
    };
  }
}
