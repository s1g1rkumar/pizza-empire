import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { withTransaction } from '../database/pool';
import {
  SupermarketRepository,
  SupermarketsDashboardDTO,
} from '../repositories/supermarket.repository';
import { AppError, ConflictError, NotFoundError } from '../utils/errors';
import {
  calculateSupermarketDemand,
  calculateSupermarketUpgradeCost,
  SUPERMARKET_BLUEPRINTS,
  SUPERMARKET_UPGRADE_CONFIG,
  SupermarketTier,
  SupermarketUpgradeType,
} from '../utils/supermarketCalculator';
import { EconomyService } from './economy.service';
import { InventoryService } from './inventory.service';

export class SupermarketService {
  private readonly supermarketRepo = new SupermarketRepository();
  private readonly economyService = new EconomyService();
  private readonly inventoryService = new InventoryService();

  async getDashboard(playerId: number): Promise<SupermarketsDashboardDTO> {
    return this.supermarketRepo.getSupermarketsDashboard(playerId);
  }

  private async ensureListing(
    conn: PoolConnection,
    playerId: number,
    supermarketId: number,
    itemId: number
  ): Promise<void> {
    const [itemRows] = await conn.query<RowDataPacket[]>(
      `SELECT unit_wholesale_buy AS buyPrice, unit_wholesale_sell AS sellPrice
       FROM inventory_items WHERE id = ? LIMIT 1`,
      [itemId]
    );
    const item = itemRows[0];
    if (!item) throw new NotFoundError('Product item not found');

    const basePrice = Math.max(
      1.5,
      Number(item.sellPrice) > 0
        ? Number(item.sellPrice)
        : Number((Number(item.buyPrice) * 1.45).toFixed(2))
    );

    await conn.query(
      `INSERT IGNORE INTO supermarket_listings
         (player_id, supermarket_id, item_id, base_retail_price, custom_price, is_enabled)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [playerId, supermarketId, itemId, basePrice, basePrice]
    );
  }

  async constructSupermarket(
    playerId: number,
    name: string,
    storeTier: SupermarketTier,
    locationId: number
  ): Promise<SupermarketsDashboardDTO> {
    const blueprint = SUPERMARKET_BLUEPRINTS[storeTier];
    if (!blueprint) {
      throw new AppError('Invalid supermarket tier', 400, 'INVALID_SUPERMARKET_TIER');
    }

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
         VALUES (?, ?, 'SUPERMARKET', ?, ?, ?, 40)`,
        [playerId, locationId, name.trim(), blueprint.storageCapacity, hourlyUpkeep]
      );

      const [storeRes] = await conn.query<ResultSetHeader>(
        `INSERT INTO supermarkets
           (player_id, business_id, store_tier, aisle_level, checkout_lanes, cold_storage_level, decor_level)
         VALUES (?, ?, ?, 1, ?, 1, 1)`,
        [playerId, bizRes.insertId, storeTier, blueprint.initialCheckoutLanes]
      );

      const [retailRows] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM inventory_items WHERE category = 'RETAIL_GOOD' LIMIT 4`
      );
      for (const r of retailRows) {
        await this.ensureListing(conn, playerId, storeRes.insertId, Number(r.id));
      }
    });

    return this.supermarketRepo.getSupermarketsDashboard(playerId);
  }

  async purchaseProduct(
    playerId: number,
    supermarketId: number,
    itemId: number,
    quantity: number
  ): Promise<SupermarketsDashboardDTO> {
    await withTransaction(async (conn) => {
      const [storeRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, business_id AS businessId
         FROM supermarkets
         WHERE id = ? AND player_id = ? AND deleted_at IS NULL
         FOR UPDATE`,
        [supermarketId, playerId]
      );
      const store = storeRows[0];
      if (!store) throw new NotFoundError('Supermarket not found');

      const [itemRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, name, unit_wholesale_buy AS buyPrice
         FROM inventory_items WHERE id = ? LIMIT 1`,
        [itemId]
      );
      const item = itemRows[0];
      if (!item) throw new NotFoundError('Product item not found');

      const buyPrice = Number(item.buyPrice);
      if (buyPrice <= 0) {
        throw new AppError(
          'This product cannot be bought wholesale; supply it from a factory or farm',
          422,
          'NOT_WHOLESALE_BUYABLE'
        );
      }

      const totalCost = Number((buyPrice * quantity).toFixed(2));
      await this.economyService.recordCashTransaction(conn, {
        playerId,
        businessId: Number(store.businessId),
        transactionType: 'EXPENSE',
        category: 'WHOLESALE_BUY',
        amount: totalCost,
        isCredit: false,
        description: `Purchased ${quantity}x ${String(item.name)} for supermarket`,
      });

      await this.inventoryService.applyStockMutation(conn, {
        playerId,
        businessId: Number(store.businessId),
        itemId,
        quantityDelta: quantity,
        reservedDelta: 0,
        transactionType: 'MARKET_BUY',
        checkCapacity: true,
        notes: `Supermarket wholesale purchase (${quantity}x)`,
      });

      await conn.query(`UPDATE supermarkets SET total_cogs = total_cogs + ? WHERE id = ?`, [
        totalCost,
        supermarketId,
      ]);

      await this.ensureListing(conn, playerId, supermarketId, itemId);
    });

    return this.supermarketRepo.getSupermarketsDashboard(playerId);
  }

  async supplyFromFactory(
    playerId: number,
    supermarketId: number,
    factoryId: number,
    itemId: number,
    quantity: number
  ): Promise<SupermarketsDashboardDTO> {
    const [storeRow, factoryRow] = await withTransaction(async (conn) => {
      const [sRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, business_id AS businessId FROM supermarkets WHERE id = ? AND player_id = ? AND deleted_at IS NULL LIMIT 1`,
        [supermarketId, playerId]
      );
      const [fRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, business_id AS businessId FROM factories WHERE id = ? AND player_id = ? AND deleted_at IS NULL LIMIT 1`,
        [factoryId, playerId]
      );
      return [sRows[0], fRows[0]];
    });

    if (!storeRow) throw new NotFoundError('Supermarket not found');
    if (!factoryRow) throw new NotFoundError('Factory not found');

    await this.inventoryService.transferStock(
      playerId,
      Number(factoryRow.businessId),
      Number(storeRow.businessId),
      itemId,
      quantity
    );

    await withTransaction(async (conn) => {
      await this.ensureListing(conn, playerId, supermarketId, itemId);
    });

    return this.supermarketRepo.getSupermarketsDashboard(playerId);
  }

  async updateListing(
    playerId: number,
    supermarketId: number,
    itemId: number,
    customPrice: number,
    isEnabled: boolean
  ): Promise<SupermarketsDashboardDTO> {
    await withTransaction(async (conn) => {
      await this.ensureListing(conn, playerId, supermarketId, itemId);

      const [res] = await conn.query<ResultSetHeader>(
        `UPDATE supermarket_listings
         SET custom_price = ?, is_enabled = ?
         WHERE supermarket_id = ? AND item_id = ? AND player_id = ?`,
        [customPrice, isEnabled ? 1 : 0, supermarketId, itemId, playerId]
      );
      if (res.affectedRows === 0) {
        throw new NotFoundError('Supermarket product listing not found');
      }
    });

    return this.supermarketRepo.getSupermarketsDashboard(playerId);
  }

  async upgradeSupermarket(
    playerId: number,
    supermarketId: number,
    upgradeType: SupermarketUpgradeType
  ): Promise<SupermarketsDashboardDTO> {
    const cfg = SUPERMARKET_UPGRADE_CONFIG[upgradeType];
    if (!cfg) throw new AppError('Invalid supermarket upgrade type', 400, 'INVALID_UPGRADE');

    await withTransaction(async (conn) => {
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT s.id, s.business_id AS businessId, s.aisle_level AS aisleLevel,
                s.checkout_lanes AS checkoutLanes, s.cold_storage_level AS coldStorageLevel,
                s.decor_level AS decorLevel, b.storage_capacity AS storageCapacity
         FROM supermarkets s
         INNER JOIN businesses b ON b.id = s.business_id
         WHERE s.id = ? AND s.player_id = ? AND s.deleted_at IS NULL
         FOR UPDATE`,
        [supermarketId, playerId]
      );
      const store = rows[0];
      if (!store) throw new NotFoundError('Supermarket not found');

      let currentLevel = 1;
      if (upgradeType === 'AISLES') currentLevel = Number(store.aisleLevel);
      if (upgradeType === 'CHECKOUT_LANES') currentLevel = Number(store.checkoutLanes);
      if (upgradeType === 'COLD_STORAGE') currentLevel = Number(store.coldStorageLevel);
      if (upgradeType === 'DECOR') currentLevel = Number(store.decorLevel);
      if (upgradeType === 'STORAGE') {
        currentLevel = Math.max(1, Math.round((Number(store.storageCapacity) - 100) / 300));
      }

      if (currentLevel >= cfg.maxLevel) {
        throw new ConflictError(`${cfg.label} is already at maximum level (${cfg.maxLevel})`);
      }

      const cost = calculateSupermarketUpgradeCost(upgradeType, currentLevel);
      await this.economyService.recordCashTransaction(conn, {
        playerId,
        businessId: Number(store.businessId),
        transactionType: 'CAPEX',
        category: 'UPGRADE',
        amount: cost,
        isCredit: false,
        description: `Upgraded supermarket ${cfg.label} to level ${currentLevel + 1}`,
      });

      if (upgradeType === 'AISLES') {
        await conn.query(`UPDATE supermarkets SET aisle_level = aisle_level + 1 WHERE id = ?`, [
          supermarketId,
        ]);
      } else if (upgradeType === 'CHECKOUT_LANES') {
        await conn.query(
          `UPDATE supermarkets SET checkout_lanes = checkout_lanes + 1 WHERE id = ?`,
          [supermarketId]
        );
      } else if (upgradeType === 'COLD_STORAGE') {
        await conn.query(
          `UPDATE supermarkets SET cold_storage_level = cold_storage_level + 1 WHERE id = ?`,
          [supermarketId]
        );
      } else if (upgradeType === 'DECOR') {
        await conn.query(`UPDATE supermarkets SET decor_level = decor_level + 1 WHERE id = ?`, [
          supermarketId,
        ]);
      } else if (upgradeType === 'STORAGE') {
        await conn.query(
          `UPDATE businesses SET storage_capacity = storage_capacity + 300 WHERE id = ?`,
          [Number(store.businessId)]
        );
      }

      await conn.query(`UPDATE businesses SET hourly_upkeep = hourly_upkeep + 4 WHERE id = ?`, [
        Number(store.businessId),
      ]);
    });

    return this.supermarketRepo.getSupermarketsDashboard(playerId);
  }

  async assignEmployee(
    playerId: number,
    supermarketId: number,
    employeeId: number
  ): Promise<SupermarketsDashboardDTO> {
    await withTransaction(async (conn) => {
      const [storeRows] = await conn.query<RowDataPacket[]>(
        `SELECT business_id AS businessId FROM supermarkets WHERE id = ? AND player_id = ? AND deleted_at IS NULL LIMIT 1`,
        [supermarketId, playerId]
      );
      const store = storeRows[0];
      if (!store) throw new NotFoundError('Supermarket not found');

      const [empRows] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM employees WHERE id = ? AND player_id = ? AND deleted_at IS NULL LIMIT 1`,
        [employeeId, playerId]
      );
      if (!empRows[0]) throw new NotFoundError('Employee not found');

      await conn.query(
        `UPDATE employee_assignments SET active_flag = 0 WHERE employee_id = ? AND active_flag = 1`,
        [employeeId]
      );
      await conn.query(
        `INSERT INTO employee_assignments (player_id, employee_id, business_id, active_flag)
         VALUES (?, ?, ?, 1)`,
        [playerId, employeeId, Number(store.businessId)]
      );
    });

    return this.supermarketRepo.getSupermarketsDashboard(playerId);
  }

  async runDailySales(playerId: number, supermarketId: number): Promise<SupermarketsDashboardDTO> {
    await withTransaction(async (conn) => {
      const [storeRows] = await conn.query<RowDataPacket[]>(
        `SELECT s.id, s.business_id AS businessId, s.store_tier AS storeTier,
                s.aisle_level AS aisleLevel, s.checkout_lanes AS checkoutLanes,
                s.cold_storage_level AS coldStorageLevel, s.decor_level AS decorLevel,
                l.demand_multiplier AS locationDemandMultiplier, l.price_elasticity AS priceElasticity
         FROM supermarkets s
         INNER JOIN businesses b ON b.id = s.business_id
         INNER JOIN locations l ON l.id = b.location_id
         WHERE s.id = ? AND s.player_id = ? AND s.deleted_at IS NULL
         FOR UPDATE`,
        [supermarketId, playerId]
      );
      const store = storeRows[0];
      if (!store) throw new NotFoundError('Supermarket not found');

      const businessId = Number(store.businessId);

      const [empRows] = await conn.query<RowDataPacket[]>(
        `SELECT e.skill_level AS skillLevel, e.happiness, e.hourly_wage AS hourlyWage, e.is_shift_lead AS isShiftLead
         FROM employees e
         INNER JOIN employee_assignments ea ON ea.employee_id = e.id AND ea.active_flag = 1
         WHERE ea.business_id = ? AND e.player_id = ? AND e.deleted_at IS NULL`,
        [businessId, playerId]
      );

      const totalProductivity = empRows.reduce(
        (acc, e) =>
          acc +
          this.economyService.calculateEmployeeProductivity({
            skillLevel: Number(e.skillLevel),
            happiness: Number(e.happiness),
            hourlyWage: Number(e.hourlyWage),
            isShiftLead: Boolean(e.isShiftLead),
          }),
        0
      );

      const [listingRows] = await conn.query<RowDataPacket[]>(
        `SELECT sl.id, sl.item_id AS itemId, sl.base_retail_price AS baseRetailPrice,
                sl.custom_price AS customPrice, sl.is_enabled AS isEnabled,
                COALESCE(bi.quantity - bi.reserved_quantity, 0) AS availableStock
         FROM supermarket_listings sl
         LEFT JOIN business_inventory bi ON bi.business_id = ? AND bi.item_id = sl.item_id
         WHERE sl.supermarket_id = ? AND sl.player_id = ? AND sl.is_enabled = 1`,
        [businessId, supermarketId, playerId]
      );

      let totalUnitsSold = 0;
      let totalRevenue = 0;

      for (const item of listingRows) {
        const availableStock = Math.max(0, Number(item.availableStock ?? 0));
        if (availableStock <= 0) continue;

        const soldQty = calculateSupermarketDemand({
          tier: store.storeTier as SupermarketTier,
          locationDemandMultiplier: Number(store.locationDemandMultiplier ?? 1),
          priceElasticity: Number(store.priceElasticity ?? 1),
          baseRetailPrice: Number(item.baseRetailPrice),
          customPrice: Number(item.customPrice),
          aisleLevel: Number(store.aisleLevel),
          checkoutLanes: Number(store.checkoutLanes),
          coldStorageLevel: Number(store.coldStorageLevel),
          decorLevel: Number(store.decorLevel),
          employeeProductivity: totalProductivity,
          availableStock,
        });

        if (soldQty <= 0) continue;

        await this.inventoryService.applyStockMutation(conn, {
          playerId,
          businessId,
          itemId: Number(item.itemId),
          quantityDelta: -soldQty,
          reservedDelta: 0,
          transactionType: 'MARKET_SELL',
          notes: `Supermarket customer sales (${soldQty}x)`,
        });

        const itemRevenue = Number((soldQty * Number(item.customPrice)).toFixed(2));
        totalUnitsSold += soldQty;
        totalRevenue = Number((totalRevenue + itemRevenue).toFixed(2));

        await conn.query(
          `UPDATE supermarket_listings
           SET total_sold = total_sold + ?, total_revenue = total_revenue + ?
           WHERE id = ?`,
          [soldQty, itemRevenue, Number(item.id)]
        );
      }

      if (totalUnitsSold === 0) {
        throw new ConflictError(
          'No enabled products with available stock to sell. Restock from wholesale or a factory first.'
        );
      }

      await this.economyService.recordCashTransaction(conn, {
        playerId,
        businessId,
        transactionType: 'REVENUE',
        category: 'SUPERMARKET_REVENUE',
        amount: totalRevenue,
        isCredit: true,
        description: `Supermarket checkout revenue (${totalUnitsSold} items sold)`,
      });

      await conn.query(
        `UPDATE supermarkets
         SET daily_sales_count = daily_sales_count + ?,
             total_revenue = total_revenue + ?,
             last_sale_at = UTC_TIMESTAMP()
         WHERE id = ?`,
        [totalUnitsSold, totalRevenue, supermarketId]
      );
    });

    return this.supermarketRepo.getSupermarketsDashboard(playerId);
  }
}
