import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { withTransaction } from '../database/pool';
import { FactoriesDashboardDTO, FactoryRepository } from '../repositories/factory.repository';
import { AppError, ConflictError, NotFoundError } from '../utils/errors';
import {
  calculateFactorySpeedMultiplier,
  calculateMachinePurchaseCost,
  FACTORY_BLUEPRINTS,
  FactoryType,
} from '../utils/factoryCalculator';
import {
  calculateProductionDurationSeconds,
  calculateProductionEfficiency,
} from '../utils/productionCalculator';
import { EconomyService } from './economy.service';
import { InventoryService } from './inventory.service';
import { ProductionProcessorService } from './productionProcessor.service';

export class FactoryService {
  private readonly factoryRepo = new FactoryRepository();
  private readonly economyService = new EconomyService();
  private readonly inventoryService = new InventoryService();
  private readonly productionProcessor = new ProductionProcessorService();

  async getDashboard(playerId: number): Promise<FactoriesDashboardDTO> {
    await withTransaction(async (conn) => {
      await this.productionProcessor.processCompletedProduction(conn, playerId);
    });
    return this.factoryRepo.getFactoriesDashboard(playerId);
  }

  async constructFactory(
    playerId: number,
    name: string,
    factoryType: FactoryType,
    locationId: number
  ): Promise<FactoriesDashboardDTO> {
    const blueprint = FACTORY_BLUEPRINTS[factoryType];
    if (!blueprint) throw new AppError('Invalid factory type', 400, 'INVALID_FACTORY_TYPE');

    await withTransaction(async (conn) => {
      const [locRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, rent_multiplier AS rentMultiplier FROM locations WHERE id = ? LIMIT 1`,
        [locationId]
      );
      if (!locRows[0]) throw new NotFoundError('Location not found');
      const rentMult = Number(locRows[0].rentMultiplier ?? 1);

      await this.economyService.recordCashTransaction(conn, {
        playerId,
        transactionType: 'CAPEX',
        category: 'CONSTRUCTION',
        amount: blueprint.constructionCost,
        isCredit: false,
        description: `Constructed ${blueprint.label}: ${name}`,
      });

      const hourlyUpkeep = Number((blueprint.hourlyUpkeep * rentMult).toFixed(2));
      const [bizRes] = await conn.query<ResultSetHeader>(
        `INSERT INTO businesses (player_id, location_id, business_type, name, storage_capacity, hourly_upkeep, max_employees)
         VALUES (?, ?, 'FACTORY', ?, ?, ?, 50)`,
        [playerId, locationId, name.trim(), blueprint.storageCapacity, hourlyUpkeep]
      );

      await conn.query(
        `INSERT INTO factories (player_id, business_id, factory_type, machine_count, queue_capacity, speed_multiplier)
         VALUES (?, ?, ?, 1, 3, 1.00)`,
        [playerId, bizRes.insertId, factoryType]
      );
    });

    return this.factoryRepo.getFactoriesDashboard(playerId);
  }

  async purchaseMachine(playerId: number, factoryId: number): Promise<FactoriesDashboardDTO> {
    await withTransaction(async (conn) => {
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT id, business_id AS businessId, factory_type AS factoryType, machine_count AS machineCount
         FROM factories WHERE id = ? AND player_id = ? AND deleted_at IS NULL FOR UPDATE`,
        [factoryId, playerId]
      );
      const fac = rows[0];
      if (!fac) throw new NotFoundError('Factory not found');

      const blueprint = FACTORY_BLUEPRINTS[fac.factoryType as FactoryType];
      const currentMachines = Number(fac.machineCount);
      const cost = calculateMachinePurchaseCost(blueprint.machineCost, currentMachines);

      await this.economyService.recordCashTransaction(conn, {
        playerId,
        businessId: Number(fac.businessId),
        transactionType: 'CAPEX',
        category: 'UPGRADE',
        amount: cost,
        isCredit: false,
        description: `Purchased machine #${currentMachines + 1} for ${blueprint.label}`,
      });

      await conn.query(
        `UPDATE factories
         SET machine_count = machine_count + 1,
             queue_capacity = queue_capacity + 1,
             speed_multiplier = LEAST(5.00, speed_multiplier + 0.15)
         WHERE id = ?`,
        [factoryId]
      );

      await conn.query(`UPDATE businesses SET hourly_upkeep = hourly_upkeep + 5 WHERE id = ?`, [
        Number(fac.businessId),
      ]);
    });

    return this.factoryRepo.getFactoriesDashboard(playerId);
  }

  async upgradeStorage(playerId: number, factoryId: number): Promise<FactoriesDashboardDTO> {
    await withTransaction(async (conn) => {
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT f.id, f.business_id AS businessId, b.storage_capacity AS storageCapacity
         FROM factories f
         INNER JOIN businesses b ON b.id = f.business_id
         WHERE f.id = ? AND f.player_id = ? AND f.deleted_at IS NULL
         FOR UPDATE`,
        [factoryId, playerId]
      );
      const fac = rows[0];
      if (!fac) throw new NotFoundError('Factory not found');

      const cost = Math.floor(Number(fac.storageCapacity) * 3);
      await this.economyService.recordCashTransaction(conn, {
        playerId,
        businessId: Number(fac.businessId),
        transactionType: 'CAPEX',
        category: 'UPGRADE',
        amount: cost,
        isCredit: false,
        description: 'Expanded factory warehouse storage (+250)',
      });

      await conn.query(
        `UPDATE businesses SET storage_capacity = storage_capacity + 250 WHERE id = ?`,
        [Number(fac.businessId)]
      );
    });

    return this.factoryRepo.getFactoriesDashboard(playerId);
  }

  async startBatchOrder(
    playerId: number,
    factoryId: number,
    quantity: number
  ): Promise<FactoriesDashboardDTO> {
    await withTransaction(async (conn) => {
      await this.productionProcessor.processCompletedProduction(conn, playerId);

      const [facRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, business_id AS businessId, factory_type AS factoryType,
                machine_count AS machineCount, queue_capacity AS queueCapacity
         FROM factories WHERE id = ? AND player_id = ? AND deleted_at IS NULL FOR UPDATE`,
        [factoryId, playerId]
      );
      const fac = facRows[0];
      if (!fac) throw new NotFoundError('Factory not found');

      const businessId = Number(fac.businessId);
      const blueprint = FACTORY_BLUEPRINTS[fac.factoryType as FactoryType];

      const [activeRows] = await conn.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS cnt FROM production_orders
         WHERE business_id = ? AND status IN ('QUEUED', 'IN_PROGRESS') FOR UPDATE`,
        [businessId]
      );
      if (Number(activeRows[0]?.cnt ?? 0) >= Number(fac.queueCapacity)) {
        throw new ConflictError('Factory production queue is full');
      }

      const [recRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, duration_seconds AS durationSeconds FROM production_recipes WHERE code = ? LIMIT 1`,
        [blueprint.recipeCode]
      );
      const recipe = recRows[0];
      if (!recipe) throw new NotFoundError('Factory recipe not found');

      const [empRows] = await conn.query<RowDataPacket[]>(
        `SELECT e.skill_level AS skillLevel, e.happiness, e.hourly_wage AS hourlyWage, e.is_shift_lead AS isShiftLead
         FROM employees e
         INNER JOIN employee_assignments ea ON ea.employee_id = e.id AND ea.active_flag = 1
         WHERE ea.business_id = ? AND e.player_id = ? AND e.deleted_at IS NULL`,
        [businessId, playerId]
      );
      const empBonus = calculateProductionEfficiency(
        empRows.map((e) =>
          this.economyService.calculateEmployeeProductivity({
            skillLevel: Number(e.skillLevel),
            happiness: Number(e.happiness),
            hourlyWage: Number(e.hourlyWage),
            isShiftLead: Boolean(e.isShiftLead),
          })
        )
      );
      const speedMult = calculateFactorySpeedMultiplier(Number(fac.machineCount), empBonus);
      const durationSec = calculateProductionDurationSeconds(
        Number(recipe.durationSeconds),
        quantity,
        speedMult
      );

      const now = new Date();
      const completesAt = new Date(now.getTime() + durationSec * 1000);

      const [orderRes] = await conn.query<ResultSetHeader>(
        `INSERT INTO production_orders
           (player_id, business_id, recipe_id, batch_multiplier, status, started_at, completes_at)
         VALUES (?, ?, ?, ?, 'IN_PROGRESS', ?, ?)`,
        [playerId, businessId, Number(recipe.id), quantity, now, completesAt]
      );
      const orderId = orderRes.insertId;

      const [ingRows] = await conn.query<RowDataPacket[]>(
        `SELECT item_id AS itemId, quantity_required AS quantityRequired
         FROM production_recipe_ingredients WHERE recipe_id = ?`,
        [Number(recipe.id)]
      );
      for (const ing of ingRows) {
        await this.inventoryService.reserveStock(
          conn,
          playerId,
          businessId,
          Number(ing.itemId),
          Number(ing.quantityRequired) * quantity,
          `fac_order_${orderId}`
        );
      }
    });

    return this.factoryRepo.getFactoriesDashboard(playerId);
  }

  async transferOutputToBusiness(
    playerId: number,
    factoryId: number,
    toBusinessId: number,
    itemId: number,
    quantity: number
  ): Promise<FactoriesDashboardDTO> {
    const [rows] = await withTransaction(async (conn) => {
      return conn.query<RowDataPacket[]>(
        `SELECT business_id AS businessId FROM factories WHERE id = ? AND player_id = ? AND deleted_at IS NULL LIMIT 1`,
        [factoryId, playerId]
      );
    });
    if (!rows[0]) throw new NotFoundError('Factory not found');

    await this.inventoryService.transferStock(
      playerId,
      Number(rows[0].businessId),
      toBusinessId,
      itemId,
      quantity
    );

    return this.factoryRepo.getFactoriesDashboard(playerId);
  }
}
