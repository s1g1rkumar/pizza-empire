import { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { dbPool } from '../database/pool';

export type InventoryCategory =
  'RAW_CROP' | 'RAW_MATERIAL' | 'PROCESSED_INGREDIENT' | 'PIZZA' | 'PACKAGING' | 'RETAIL_GOOD';

export type InventoryTransactionType =
  | 'DEPOSIT'
  | 'WITHDRAW'
  | 'RESERVE'
  | 'RELEASE'
  | 'CONSUME_RESERVED'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'MARKET_BUY'
  | 'MARKET_SELL';

export interface InventoryDashboardDTO {
  businesses: Array<{
    id: number;
    businessType: string;
    name: string;
    storageCapacity: number;
    storageUsed: number;
  }>;
  items: Array<{
    itemId: number;
    code: string;
    name: string;
    description: string | null;
    category: InventoryCategory;
    unitWholesaleBuy: number;
    unitWholesaleSell: number;
    lowStockThreshold: number;
    stocks: Array<{
      businessId: number;
      businessName: string;
      quantity: number;
      reservedQuantity: number;
      availableQuantity: number;
    }>;
    totalQuantity: number;
    totalReserved: number;
    totalAvailable: number;
  }>;
  alerts: Array<{
    severity: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'CAPACITY_HIGH';
    businessId: number;
    businessName: string;
    itemId?: number;
    itemName?: string;
    message: string;
  }>;
  history: Array<{
    id: number;
    businessId: number;
    businessName: string;
    itemId: number;
    itemName: string;
    transactionType: InventoryTransactionType;
    quantityDelta: number;
    reservedDelta: number;
    balanceAfter: number;
    reservedAfter: number;
    notes: string | null;
    createdAt: string;
  }>;
}

export class InventoryRepository {
  async verifyBusinessOwnership(
    conn: PoolConnection,
    playerId: number,
    businessId: number
  ): Promise<{ id: number; name: string; storageCapacity: number }> {
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT id, name, storage_capacity AS storageCapacity
       FROM businesses
       WHERE id = ? AND player_id = ? AND deleted_at IS NULL
       FOR UPDATE`,
      [businessId, playerId]
    );
    if (!rows[0]) {
      throw new Error('BUSINESS_NOT_OWNED');
    }
    return {
      id: Number(rows[0].id),
      name: String(rows[0].name),
      storageCapacity: Number(rows[0].storageCapacity),
    };
  }

  async getBusinessStorageUsed(conn: PoolConnection, businessId: number): Promise<number> {
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(quantity), 0) AS used
       FROM business_inventory
       WHERE business_id = ?`,
      [businessId]
    );
    return Number(rows[0]?.used ?? 0);
  }

  async getInventoryDashboard(playerId: number): Promise<InventoryDashboardDTO> {
    const [bizRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         b.id, b.business_type AS businessType, b.name, b.storage_capacity AS storageCapacity,
         COALESCE(SUM(bi.quantity), 0) AS storageUsed
       FROM businesses b
       LEFT JOIN business_inventory bi ON bi.business_id = b.id
       WHERE b.player_id = ? AND b.deleted_at IS NULL
       GROUP BY b.id, b.business_type, b.name, b.storage_capacity
       ORDER BY b.id ASC`,
      [playerId]
    );

    const businesses = bizRows.map((b) => ({
      id: Number(b.id),
      businessType: String(b.businessType),
      name: String(b.name),
      storageCapacity: Number(b.storageCapacity),
      storageUsed: Number(b.storageUsed ?? 0),
    }));

    const [itemRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT id, code, name, description, category,
              unit_wholesale_buy AS unitWholesaleBuy,
              unit_wholesale_sell AS unitWholesaleSell,
              low_stock_threshold AS lowStockThreshold
       FROM inventory_items
       ORDER BY category ASC, id ASC`
    );

    const [stockRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         bi.business_id AS businessId, b.name AS businessName,
         bi.item_id AS itemId, bi.quantity, bi.reserved_quantity AS reservedQuantity
       FROM business_inventory bi
       INNER JOIN businesses b ON b.id = bi.business_id
       WHERE bi.player_id = ? AND b.deleted_at IS NULL`,
      [playerId]
    );

    const stockMap = new Map<
      number,
      Array<{
        businessId: number;
        businessName: string;
        quantity: number;
        reservedQuantity: number;
        availableQuantity: number;
      }>
    >();

    for (const s of stockRows) {
      const itemId = Number(s.itemId);
      const qty = Number(s.quantity);
      const res = Number(s.reservedQuantity);
      const list = stockMap.get(itemId) ?? [];
      list.push({
        businessId: Number(s.businessId),
        businessName: String(s.businessName),
        quantity: qty,
        reservedQuantity: res,
        availableQuantity: Math.max(0, qty - res),
      });
      stockMap.set(itemId, list);
    }

    const alerts: InventoryDashboardDTO['alerts'] = [];

    for (const biz of businesses) {
      if (biz.storageCapacity > 0 && biz.storageUsed / biz.storageCapacity >= 0.85) {
        alerts.push({
          severity: 'CAPACITY_HIGH',
          businessId: biz.id,
          businessName: biz.name,
          message: `${biz.name} storage is at ${Math.round((biz.storageUsed / biz.storageCapacity) * 100)}% capacity.`,
        });
      }
    }

    const items = itemRows.map((it) => {
      const itemId = Number(it.id);
      const stocks = stockMap.get(itemId) ?? [];
      const totalQuantity = stocks.reduce((s, x) => s + x.quantity, 0);
      const totalReserved = stocks.reduce((s, x) => s + x.reservedQuantity, 0);
      const totalAvailable = Math.max(0, totalQuantity - totalReserved);
      const threshold = Number(it.lowStockThreshold);

      for (const st of stocks) {
        if (st.quantity > 0 && st.availableQuantity === 0) {
          alerts.push({
            severity: 'OUT_OF_STOCK',
            businessId: st.businessId,
            businessName: st.businessName,
            itemId,
            itemName: String(it.name),
            message: `${String(it.name)} in ${st.businessName} has 0 available stock (${st.reservedQuantity} reserved).`,
          });
        } else if (st.quantity > 0 && st.availableQuantity < threshold) {
          alerts.push({
            severity: 'LOW_STOCK',
            businessId: st.businessId,
            businessName: st.businessName,
            itemId,
            itemName: String(it.name),
            message: `${String(it.name)} in ${st.businessName} is low (${st.availableQuantity} available, threshold ${threshold}).`,
          });
        }
      }

      return {
        itemId,
        code: String(it.code),
        name: String(it.name),
        description: it.description ? String(it.description) : null,
        category: it.category as InventoryCategory,
        unitWholesaleBuy: Number(it.unitWholesaleBuy),
        unitWholesaleSell: Number(it.unitWholesaleSell),
        lowStockThreshold: threshold,
        stocks,
        totalQuantity,
        totalReserved,
        totalAvailable,
      };
    });

    const [histRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         itx.id, itx.business_id AS businessId, b.name AS businessName,
         itx.item_id AS itemId, ii.name AS itemName,
         itx.transaction_type AS transactionType,
         itx.quantity_delta AS quantityDelta, itx.reserved_delta AS reservedDelta,
         itx.balance_after AS balanceAfter, itx.reserved_after AS reservedAfter,
         itx.notes, itx.created_at AS createdAt
       FROM inventory_transactions itx
       INNER JOIN businesses b ON b.id = itx.business_id
       INNER JOIN inventory_items ii ON ii.id = itx.item_id
       WHERE itx.player_id = ?
       ORDER BY itx.created_at DESC, itx.id DESC
       LIMIT 30`,
      [playerId]
    );

    return {
      businesses,
      items,
      alerts,
      history: histRows.map((h) => ({
        id: Number(h.id),
        businessId: Number(h.businessId),
        businessName: String(h.businessName),
        itemId: Number(h.itemId),
        itemName: String(h.itemName),
        transactionType: h.transactionType as InventoryTransactionType,
        quantityDelta: Number(h.quantityDelta),
        reservedDelta: Number(h.reservedDelta),
        balanceAfter: Number(h.balanceAfter),
        reservedAfter: Number(h.reservedAfter),
        notes: h.notes ? String(h.notes) : null,
        createdAt: new Date(String(h.createdAt)).toISOString(),
      })),
    };
  }
}
