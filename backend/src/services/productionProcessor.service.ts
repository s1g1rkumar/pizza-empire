import { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { InventoryService } from './inventory.service';

export interface ProductionSyncSummary {
  plotsMatured: number;
  ordersCompleted: number;
}

export class ProductionProcessorService {
  private readonly inventoryService = new InventoryService();

  /**
   * Advances any GROWING farm plots whose ready_at <= UTC_TIMESTAMP() to READY,
   * and completes any IN_PROGRESS production orders whose completes_at <= UTC_TIMESTAMP():
   * 1. Deducts reserved materials via InventoryService.consumeReservedStock
   * 2. Deposits finished output into business_inventory via InventoryService.applyStockMutation
   * 3. Atomically marks order COMPLETED (preventing duplicate completion)
   */
  async processCompletedProduction(
    conn: PoolConnection,
    playerId: number
  ): Promise<ProductionSyncSummary> {
    // 1. Mature farm plots
    const [maturedRows] = await conn.query<RowDataPacket[]>(
      `SELECT id
       FROM farm_plots
       WHERE player_id = ? AND status = 'GROWING' AND ready_at <= UTC_TIMESTAMP()
       FOR UPDATE`,
      [playerId]
    );

    if (maturedRows.length > 0) {
      await conn.query(
        `UPDATE farm_plots
         SET status = 'READY'
         WHERE player_id = ? AND status = 'GROWING' AND ready_at <= UTC_TIMESTAMP()`,
        [playerId]
      );
    }

    // 2. Complete finished production orders
    const [completedOrders] = await conn.query<RowDataPacket[]>(
      `SELECT
         po.id,
         po.business_id AS businessId,
         po.recipe_id AS recipeId,
         po.batch_multiplier AS batchMultiplier,
         pr.output_item_id AS outputItemId,
         pr.output_quantity AS outputQuantity,
         pr.name AS recipeName
       FROM production_orders po
       INNER JOIN production_recipes pr ON pr.id = po.recipe_id
       WHERE po.player_id = ? AND po.status = 'IN_PROGRESS' AND po.completes_at <= UTC_TIMESTAMP()
       FOR UPDATE`,
      [playerId]
    );

    for (const order of completedOrders) {
      const orderId = Number(order.id);
      const businessId = Number(order.businessId);
      const recipeId = Number(order.recipeId);
      const batchMultiplier = Number(order.batchMultiplier);

      // Deduct reserved input materials
      const [ingRows] = await conn.query<RowDataPacket[]>(
        `SELECT item_id AS itemId, quantity_required AS quantityRequired
         FROM production_recipe_ingredients
         WHERE recipe_id = ?`,
        [recipeId]
      );

      for (const ing of ingRows) {
        const needed = Number(ing.quantityRequired) * batchMultiplier;
        await this.inventoryService.consumeReservedStock(
          conn,
          playerId,
          businessId,
          Number(ing.itemId),
          needed,
          `prod_order_${orderId}`
        );
      }

      // Deposit finished output
      const totalOutput = Number(order.outputQuantity) * batchMultiplier;
      await this.inventoryService.applyStockMutation(conn, {
        playerId,
        businessId,
        itemId: Number(order.outputItemId),
        quantityDelta: totalOutput,
        reservedDelta: 0,
        transactionType: 'DEPOSIT',
        checkCapacity: false,
        referenceId: `prod_order_${orderId}`,
        notes: `Completed ${batchMultiplier}x ${String(order.recipeName)}`,
      });

      await conn.query(
        `UPDATE production_orders
         SET status = 'COMPLETED', collected_at = UTC_TIMESTAMP()
         WHERE id = ? AND status = 'IN_PROGRESS'`,
        [orderId]
      );
    }

    if (completedOrders.length > 0) {
      await conn.query(
        `UPDATE player_progression
         SET total_batches_processed = total_batches_processed + ?
         WHERE player_id = ?`,
        [completedOrders.length, playerId]
      );
    }

    return {
      plotsMatured: maturedRows.length,
      ordersCompleted: completedOrders.length,
    };
  }
}
