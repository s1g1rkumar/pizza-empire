import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { withTransaction } from '../database/pool';
import {
  ProductionDashboardDTO,
  ProductionRepository,
} from '../repositories/production.repository';
import { AppError, ConflictError, NotFoundError } from '../utils/errors';
import {
  calculateProductionDurationSeconds,
  calculateProductionEfficiency,
} from '../utils/productionCalculator';
import { EconomyService } from './economy.service';
import { InventoryService } from './inventory.service';
import { ProductionProcessorService } from './productionProcessor.service';

export class ProductionService {
  private readonly productionRepo = new ProductionRepository();
  private readonly inventoryService = new InventoryService();
  private readonly economyService = new EconomyService();
  private readonly productionProcessor = new ProductionProcessorService();

  async getDashboard(playerId: number): Promise<ProductionDashboardDTO> {
    await withTransaction(async (conn) => {
      await this.productionProcessor.processCompletedProduction(conn, playerId);
    });
    return this.productionRepo.getProductionDashboard(playerId);
  }

  async startProductionOrder(
    playerId: number,
    recipeId: number,
    quantity: number
  ): Promise<ProductionDashboardDTO> {
    await withTransaction(async (conn) => {
      // Complete any finished orders first to free up capacity
      await this.productionProcessor.processCompletedProduction(conn, playerId);

      const business = await this.productionRepo.getPrimaryProductionBusiness(playerId);
      const productionCapacity = 3 + Math.max(0, business.level - 1) * 2;

      const [activeCountRows] = await conn.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS activeCount
         FROM production_orders
         WHERE player_id = ? AND status IN ('QUEUED', 'IN_PROGRESS')
         FOR UPDATE`,
        [playerId]
      );
      if (Number(activeCountRows[0]?.activeCount ?? 0) >= productionCapacity) {
        throw new ConflictError(
          `Production queue full (${productionCapacity}/${productionCapacity} active orders)`
        );
      }

      const [recipeRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, name, duration_seconds AS durationSeconds, unlock_xp_level AS unlockXpLevel
         FROM production_recipes WHERE id = ? LIMIT 1`,
        [recipeId]
      );
      const recipe = recipeRows[0];
      if (!recipe) throw new NotFoundError('Production recipe not found');

      const [progRows] = await conn.query<RowDataPacket[]>(
        `SELECT xp_level AS xpLevel FROM player_progression WHERE player_id = ? LIMIT 1`,
        [playerId]
      );
      if (Number(progRows[0]?.xpLevel ?? 1) < Number(recipe.unlockXpLevel)) {
        throw new AppError(
          `Requires XP Level ${recipe.unlockXpLevel} to produce ${recipe.name}`,
          403,
          'RECIPE_LOCKED'
        );
      }

      // Calculate efficiency from assigned employees
      const [empRows] = await conn.query<RowDataPacket[]>(
        `SELECT e.skill_level AS skillLevel, e.happiness, e.hourly_wage AS hourlyWage, e.is_shift_lead AS isShiftLead
         FROM employees e
         INNER JOIN employee_assignments ea ON ea.employee_id = e.id AND ea.active_flag = 1
         WHERE ea.business_id = ? AND e.player_id = ? AND e.deleted_at IS NULL`,
        [business.id, playerId]
      );
      const productivities = empRows.map((e) =>
        this.economyService.calculateEmployeeProductivity({
          skillLevel: Number(e.skillLevel),
          happiness: Number(e.happiness),
          hourlyWage: Number(e.hourlyWage),
          isShiftLead: Boolean(e.isShiftLead),
        })
      );
      const efficiency = calculateProductionEfficiency(productivities);
      const durationSeconds = calculateProductionDurationSeconds(
        Number(recipe.durationSeconds),
        quantity,
        efficiency
      );

      const now = new Date();
      const completesAt = new Date(now.getTime() + durationSeconds * 1000);

      // Insert order first to get ID for reservation reference
      const [orderResult] = await conn.query<ResultSetHeader>(
        `INSERT INTO production_orders
           (player_id, business_id, recipe_id, batch_multiplier, status, started_at, completes_at)
         VALUES (?, ?, ?, ?, 'IN_PROGRESS', ?, ?)`,
        [playerId, business.id, recipeId, quantity, now, completesAt]
      );
      const orderId = orderResult.insertId;

      // Validate & reserve all required ingredients atomically
      const [ingRows] = await conn.query<RowDataPacket[]>(
        `SELECT item_id AS itemId, quantity_required AS quantityRequired
         FROM production_recipe_ingredients
         WHERE recipe_id = ?`,
        [recipeId]
      );

      for (const ing of ingRows) {
        await this.inventoryService.reserveStock(
          conn,
          playerId,
          business.id,
          Number(ing.itemId),
          Number(ing.quantityRequired) * quantity,
          `prod_order_${orderId}`
        );
      }
    });

    return this.productionRepo.getProductionDashboard(playerId);
  }

  async cancelProductionOrder(playerId: number, orderId: number): Promise<ProductionDashboardDTO> {
    await withTransaction(async (conn) => {
      const [orderRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, business_id AS businessId, recipe_id AS recipeId, batch_multiplier AS batchMultiplier, status
         FROM production_orders
         WHERE id = ? AND player_id = ?
         FOR UPDATE`,
        [orderId, playerId]
      );
      const order = orderRows[0];
      if (!order) throw new NotFoundError('Production order not found');
      if (order.status !== 'IN_PROGRESS' && order.status !== 'QUEUED') {
        throw new ConflictError(`Cannot cancel order in ${order.status} state`);
      }

      const [ingRows] = await conn.query<RowDataPacket[]>(
        `SELECT item_id AS itemId, quantity_required AS quantityRequired
         FROM production_recipe_ingredients
         WHERE recipe_id = ?`,
        [Number(order.recipeId)]
      );

      for (const ing of ingRows) {
        await this.inventoryService.releaseReservedStock(
          conn,
          playerId,
          Number(order.businessId),
          Number(ing.itemId),
          Number(ing.quantityRequired) * Number(order.batchMultiplier),
          `prod_order_${orderId}`
        );
      }

      await conn.query(
        `UPDATE production_orders
         SET status = 'CANCELLED', collected_at = UTC_TIMESTAMP()
         WHERE id = ?`,
        [orderId]
      );
    });

    return this.productionRepo.getProductionDashboard(playerId);
  }
}
