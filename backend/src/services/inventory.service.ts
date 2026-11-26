import { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { withTransaction } from '../database/pool';
import {
  InventoryDashboardDTO,
  InventoryRepository,
  InventoryTransactionType,
} from '../repositories/inventory.repository';
import { AppError, ConflictError, ForbiddenError, NotFoundError } from '../utils/errors';
import { EconomyService } from './economy.service';

export interface StockAdjustmentResult {
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
}

export class InventoryService {
  private readonly inventoryRepo = new InventoryRepository();
  private readonly economyService = new EconomyService();

  async getDashboard(playerId: number): Promise<InventoryDashboardDTO> {
    return this.inventoryRepo.getInventoryDashboard(playerId);
  }

  /**
   * Reusable transactional stock mutator for Farms, Factories, Restaurants, and Supermarkets.
   * Locks business_inventory row with FOR UPDATE, enforces non-negative available & total stock,
   * and writes an immutable inventory_transactions audit record.
   */
  async applyStockMutation(
    conn: PoolConnection,
    params: {
      playerId: number;
      businessId: number;
      itemId: number;
      quantityDelta: number;
      reservedDelta: number;
      transactionType: InventoryTransactionType;
      checkCapacity?: boolean;
      referenceId?: string;
      notes?: string;
    }
  ): Promise<StockAdjustmentResult> {
    let storageCapacity = 0;
    try {
      const biz = await this.inventoryRepo.verifyBusinessOwnership(
        conn,
        params.playerId,
        params.businessId
      );
      storageCapacity = biz.storageCapacity;
    } catch {
      throw new ForbiddenError('You do not own the target business facility');
    }

    if (params.checkCapacity && params.quantityDelta > 0) {
      const used = await this.inventoryRepo.getBusinessStorageUsed(conn, params.businessId);
      if (used + params.quantityDelta > storageCapacity) {
        throw new AppError(
          `Insufficient storage capacity (${used}/${storageCapacity})`,
          422,
          'STORAGE_FULL'
        );
      }
    }

    // Ensure row exists before FOR UPDATE locking
    await conn.query(
      `INSERT IGNORE INTO business_inventory (player_id, business_id, item_id, quantity, reserved_quantity)
       VALUES (?, ?, ?, 0, 0)`,
      [params.playerId, params.businessId, params.itemId]
    );

    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT quantity, reserved_quantity AS reservedQuantity
       FROM business_inventory
       WHERE business_id = ? AND item_id = ?
       FOR UPDATE`,
      [params.businessId, params.itemId]
    );

    const currentQty = Number(rows[0]?.quantity ?? 0);
    const currentReserved = Number(rows[0]?.reservedQuantity ?? 0);

    const nextQty = currentQty + params.quantityDelta;
    const nextReserved = currentReserved + params.reservedDelta;

    if (nextQty < 0 || nextReserved < 0 || nextQty < nextReserved) {
      throw new AppError(
        `Insufficient available stock (current: ${currentQty}, reserved: ${currentReserved})`,
        422,
        'INSUFFICIENT_STOCK'
      );
    }

    await conn.query(
      `UPDATE business_inventory
       SET quantity = ?, reserved_quantity = ?
       WHERE business_id = ? AND item_id = ?`,
      [nextQty, nextReserved, params.businessId, params.itemId]
    );

    await conn.query(
      `INSERT INTO inventory_transactions
         (player_id, business_id, item_id, transaction_type, quantity_delta, reserved_delta, balance_after, reserved_after, reference_id, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        params.playerId,
        params.businessId,
        params.itemId,
        params.transactionType,
        params.quantityDelta,
        params.reservedDelta,
        nextQty,
        nextReserved,
        params.referenceId ?? null,
        params.notes ?? null,
      ]
    );

    return {
      quantity: nextQty,
      reservedQuantity: nextReserved,
      availableQuantity: nextQty - nextReserved,
    };
  }

  async reserveStock(
    conn: PoolConnection,
    playerId: number,
    businessId: number,
    itemId: number,
    quantity: number,
    referenceId?: string
  ): Promise<StockAdjustmentResult> {
    return this.applyStockMutation(conn, {
      playerId,
      businessId,
      itemId,
      quantityDelta: 0,
      reservedDelta: quantity,
      transactionType: 'RESERVE',
      referenceId,
      notes: `Reserved ${quantity} units for production`,
    });
  }

  async releaseReservedStock(
    conn: PoolConnection,
    playerId: number,
    businessId: number,
    itemId: number,
    quantity: number,
    referenceId?: string
  ): Promise<StockAdjustmentResult> {
    return this.applyStockMutation(conn, {
      playerId,
      businessId,
      itemId,
      quantityDelta: 0,
      reservedDelta: -quantity,
      transactionType: 'RELEASE',
      referenceId,
      notes: `Released ${quantity} reserved units on cancellation`,
    });
  }

  async consumeReservedStock(
    conn: PoolConnection,
    playerId: number,
    businessId: number,
    itemId: number,
    quantity: number,
    referenceId?: string
  ): Promise<StockAdjustmentResult> {
    return this.applyStockMutation(conn, {
      playerId,
      businessId,
      itemId,
      quantityDelta: -quantity,
      reservedDelta: -quantity,
      transactionType: 'CONSUME_RESERVED',
      referenceId,
      notes: `Consumed ${quantity} reserved units`,
    });
  }

  async buyFromMarket(
    playerId: number,
    businessId: number,
    itemId: number,
    quantity: number
  ): Promise<InventoryDashboardDTO> {
    await withTransaction(async (conn) => {
      const [itemRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, name, unit_wholesale_buy AS buyPrice FROM inventory_items WHERE id = ? LIMIT 1`,
        [itemId]
      );
      const item = itemRows[0];
      if (!item) throw new NotFoundError('Inventory item not found');
      const buyPrice = Number(item.buyPrice);
      if (buyPrice <= 0) {
        throw new AppError('This item is not available for wholesale purchase', 422, 'NOT_BUYABLE');
      }

      const totalCost = Number((buyPrice * quantity).toFixed(2));
      await this.economyService.recordCashTransaction(conn, {
        playerId,
        businessId,
        transactionType: 'EXPENSE',
        category: 'WHOLESALE_BUY',
        amount: totalCost,
        isCredit: false,
        description: `Bought ${quantity}x ${item.name} from Wholesale Market`,
      });

      await this.applyStockMutation(conn, {
        playerId,
        businessId,
        itemId,
        quantityDelta: quantity,
        reservedDelta: 0,
        transactionType: 'MARKET_BUY',
        checkCapacity: true,
        notes: `Wholesale purchase (${quantity}x @ $${buyPrice})`,
      });
    });

    return this.inventoryRepo.getInventoryDashboard(playerId);
  }

  async sellToMarket(
    playerId: number,
    businessId: number,
    itemId: number,
    quantity: number
  ): Promise<InventoryDashboardDTO> {
    await withTransaction(async (conn) => {
      const [itemRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, name, unit_wholesale_sell AS sellPrice FROM inventory_items WHERE id = ? LIMIT 1`,
        [itemId]
      );
      const item = itemRows[0];
      if (!item) throw new NotFoundError('Inventory item not found');
      const sellPrice = Number(item.sellPrice);
      if (sellPrice <= 0) {
        throw new AppError('This item cannot be sold on the wholesale market', 422, 'NOT_SELLABLE');
      }

      await this.applyStockMutation(conn, {
        playerId,
        businessId,
        itemId,
        quantityDelta: -quantity,
        reservedDelta: 0,
        transactionType: 'MARKET_SELL',
        notes: `Wholesale sale (${quantity}x @ $${sellPrice})`,
      });

      const totalRevenue = Number((sellPrice * quantity).toFixed(2));
      await this.economyService.recordCashTransaction(conn, {
        playerId,
        businessId,
        transactionType: 'REVENUE',
        category: 'WHOLESALE_SELL',
        amount: totalRevenue,
        isCredit: true,
        description: `Sold ${quantity}x ${item.name} on Wholesale Market`,
      });
    });

    return this.inventoryRepo.getInventoryDashboard(playerId);
  }

  async transferStock(
    playerId: number,
    fromBusinessId: number,
    toBusinessId: number,
    itemId: number,
    quantity: number
  ): Promise<InventoryDashboardDTO> {
    if (fromBusinessId === toBusinessId) {
      throw new ConflictError('Source and destination businesses must be different');
    }

    await withTransaction(async (conn) => {
      // Lock businesses in deterministic ID order to avoid deadlocks
      const firstId = Math.min(fromBusinessId, toBusinessId);
      const secondId = Math.max(fromBusinessId, toBusinessId);

      try {
        await this.inventoryRepo.verifyBusinessOwnership(conn, playerId, firstId);
        await this.inventoryRepo.verifyBusinessOwnership(conn, playerId, secondId);
      } catch {
        throw new ForbiddenError('Both facilities must belong to your empire');
      }

      await this.applyStockMutation(conn, {
        playerId,
        businessId: fromBusinessId,
        itemId,
        quantityDelta: -quantity,
        reservedDelta: 0,
        transactionType: 'TRANSFER_OUT',
        notes: `Transferred ${quantity}x to Business #${toBusinessId}`,
      });

      await this.applyStockMutation(conn, {
        playerId,
        businessId: toBusinessId,
        itemId,
        quantityDelta: quantity,
        reservedDelta: 0,
        transactionType: 'TRANSFER_IN',
        checkCapacity: true,
        notes: `Received ${quantity}x from Business #${fromBusinessId}`,
      });
    });

    return this.inventoryRepo.getInventoryDashboard(playerId);
  }
}
