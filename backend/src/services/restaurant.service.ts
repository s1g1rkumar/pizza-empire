import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { withTransaction } from '../database/pool';
import {
  RestaurantRepository,
  RestaurantsDashboardDTO,
} from '../repositories/restaurant.repository';
import { AppError, ConflictError, NotFoundError } from '../utils/errors';
import {
  calculateCustomerDemand,
  calculateOrderSatisfaction,
  RESTAURANT_BLUEPRINTS,
  RestaurantType,
  updateAverageRating,
} from '../utils/restaurantCalculator';
import { applyXpGain } from '../utils/simulationTime';
import { EconomyService } from './economy.service';
import { InventoryService } from './inventory.service';

export class RestaurantService {
  private readonly restaurantRepo = new RestaurantRepository();
  private readonly economyService = new EconomyService();
  private readonly inventoryService = new InventoryService();

  async getDashboard(playerId: number): Promise<RestaurantsDashboardDTO> {
    return this.restaurantRepo.getRestaurantsDashboard(playerId);
  }

  async constructRestaurant(
    playerId: number,
    name: string,
    restaurantType: RestaurantType,
    locationId: number
  ): Promise<RestaurantsDashboardDTO> {
    const blueprint = RESTAURANT_BLUEPRINTS[restaurantType];
    if (!blueprint) {
      throw new AppError('Invalid restaurant type', 400, 'INVALID_RESTAURANT_TYPE');
    }

    await withTransaction(async (conn) => {
      const [locRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, rent_multiplier AS rentMultiplier FROM locations WHERE id = ? LIMIT 1`,
        [locationId]
      );
      if (!locRows[0]) throw new NotFoundError('Location not found');
      const rentMultiplier = Number(locRows[0].rentMultiplier ?? 1);

      await this.economyService.recordCashTransaction(conn, {
        playerId,
        transactionType: 'CAPEX',
        category: 'UPGRADE',
        amount: blueprint.constructionCost,
        isCredit: false,
        description: `Constructed ${blueprint.label}: ${name}`,
      });

      const hourlyUpkeep = Number((blueprint.hourlyUpkeep * rentMultiplier).toFixed(2));
      const [bizRes] = await conn.query<ResultSetHeader>(
        `INSERT INTO businesses (player_id, location_id, business_type, name, storage_capacity, hourly_upkeep)
         VALUES (?, ?, 'RESTAURANT', ?, ?, ?)`,
        [playerId, locationId, name.trim(), blueprint.storageCapacity, hourlyUpkeep]
      );
      const businessId = bizRes.insertId;

      const [restRes] = await conn.query<ResultSetHeader>(
        `INSERT INTO restaurants (player_id, business_id, restaurant_type, oven_count, dining_tables_count)
         VALUES (?, ?, ?, ?, ?)`,
        [playerId, businessId, restaurantType, blueprint.baseOvens, blueprint.baseTables]
      );
      const restaurantId = restRes.insertId;

      // Seed restaurant menu with all PIZZA items
      await conn.query(
        `INSERT INTO restaurant_menus (player_id, restaurant_id, item_id, base_price, custom_price, star_quality, is_enabled)
         SELECT ?, ?, id, GREATEST(10.00, unit_wholesale_sell), GREATEST(10.00, unit_wholesale_sell), 1, 1
         FROM inventory_items
         WHERE category = 'PIZZA'`,
        [playerId, restaurantId]
      );
    });

    return this.restaurantRepo.getRestaurantsDashboard(playerId);
  }

  async upgradeRestaurant(
    playerId: number,
    restaurantId: number,
    upgradeType: 'OVEN' | 'TABLES' | 'DECOR'
  ): Promise<RestaurantsDashboardDTO> {
    await withTransaction(async (conn) => {
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT id, business_id AS businessId, oven_count AS ovenCount,
                dining_tables_count AS diningTablesCount, decor_level AS decorLevel
         FROM restaurants
         WHERE id = ? AND player_id = ? AND deleted_at IS NULL
         FOR UPDATE`,
        [restaurantId, playerId]
      );
      const rest = rows[0];
      if (!rest) throw new NotFoundError('Restaurant not found');

      let cost = 0;
      let column = '';
      if (upgradeType === 'OVEN') {
        cost = Math.floor(1200 * Math.pow(1.7, Number(rest.ovenCount) - 1));
        column = 'oven_count';
      } else if (upgradeType === 'TABLES') {
        cost = Math.floor(800 * Math.pow(1.6, Number(rest.diningTablesCount) - 1));
        column = 'dining_tables_count';
      } else {
        cost = Math.floor(600 * Math.pow(1.65, Number(rest.decorLevel) - 1));
        column = 'decor_level';
      }

      await this.economyService.recordCashTransaction(conn, {
        playerId,
        businessId: Number(rest.businessId),
        transactionType: 'CAPEX',
        category: 'UPGRADE',
        amount: cost,
        isCredit: false,
        description: `Restaurant ${upgradeType} upgrade`,
      });

      await conn.query(`UPDATE restaurants SET ${column} = ${column} + 1 WHERE id = ?`, [
        restaurantId,
      ]);
    });

    return this.restaurantRepo.getRestaurantsDashboard(playerId);
  }

  async updateMenuItem(
    playerId: number,
    restaurantId: number,
    menuId: number,
    updates: { customPrice?: number; isEnabled?: boolean; upgradeStarQuality?: boolean }
  ): Promise<RestaurantsDashboardDTO> {
    await withTransaction(async (conn) => {
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT rm.id, rm.star_quality AS starQuality, r.business_id AS businessId
         FROM restaurant_menus rm
         INNER JOIN restaurants r ON r.id = rm.restaurant_id
         WHERE rm.id = ? AND rm.restaurant_id = ? AND rm.player_id = ?
         FOR UPDATE`,
        [menuId, restaurantId, playerId]
      );
      const menu = rows[0];
      if (!menu) throw new NotFoundError('Menu item not found');

      if (updates.upgradeStarQuality) {
        const star = Number(menu.starQuality);
        if (star >= 5) throw new ConflictError('Recipe is already 5★ quality');
        const cost = Math.floor(300 * Math.pow(2.2, star - 1));
        await this.economyService.recordCashTransaction(conn, {
          playerId,
          businessId: Number(menu.businessId),
          transactionType: 'CAPEX',
          category: 'UPGRADE',
          amount: cost,
          isCredit: false,
          description: `Upgraded menu pizza quality to ${star + 1}★`,
        });
        await conn.query(
          `UPDATE restaurant_menus SET star_quality = star_quality + 1 WHERE id = ?`,
          [menuId]
        );
      }

      if (updates.customPrice !== undefined) {
        await conn.query(`UPDATE restaurant_menus SET custom_price = ? WHERE id = ?`, [
          updates.customPrice,
          menuId,
        ]);
      }

      if (updates.isEnabled !== undefined) {
        await conn.query(`UPDATE restaurant_menus SET is_enabled = ? WHERE id = ?`, [
          updates.isEnabled ? 1 : 0,
          menuId,
        ]);
      }
    });

    return this.restaurantRepo.getRestaurantsDashboard(playerId);
  }

  async serveCustomers(playerId: number, restaurantId: number): Promise<RestaurantsDashboardDTO> {
    await withTransaction(async (conn) => {
      const [restRows] = await conn.query<RowDataPacket[]>(
        `SELECT
           r.id, r.business_id AS businessId, r.restaurant_type AS restaurantType,
           r.dining_tables_count AS diningTablesCount, r.decor_level AS decorLevel,
           r.avg_rating AS avgRating, r.total_ratings_count AS totalRatingsCount,
           l.demand_multiplier AS locationDemandMultiplier,
           pp.reputation
         FROM restaurants r
         INNER JOIN businesses b ON b.id = r.business_id
         INNER JOIN locations l ON l.id = b.location_id
         INNER JOIN player_profiles pp ON pp.id = r.player_id
         WHERE r.id = ? AND r.player_id = ? AND r.deleted_at IS NULL
         FOR UPDATE`,
        [restaurantId, playerId]
      );
      const rest = restRows[0];
      if (!rest) throw new NotFoundError('Restaurant not found');

      const businessId = Number(rest.businessId);
      const blueprint = RESTAURANT_BLUEPRINTS[rest.restaurantType as RestaurantType];

      const [menuRows] = await conn.query<RowDataPacket[]>(
        `SELECT
           rm.id, rm.item_id AS itemId, ii.name AS itemName,
           rm.base_price AS basePrice, rm.custom_price AS customPrice,
           rm.star_quality AS starQuality,
           GREATEST(0, COALESCE(bi.quantity, 0) - COALESCE(bi.reserved_quantity, 0)) AS availableStock
         FROM restaurant_menus rm
         INNER JOIN inventory_items ii ON ii.id = rm.item_id
         LEFT JOIN business_inventory bi ON bi.business_id = ? AND bi.item_id = rm.item_id
         WHERE rm.restaurant_id = ? AND rm.is_enabled = 1
         HAVING availableStock > 0
         ORDER BY availableStock DESC`,
        [businessId, restaurantId]
      );

      if (menuRows.length === 0) {
        throw new AppError(
          'No finished pizzas in stock! Bake or transfer pizzas before serving customers.',
          422,
          'OUT_OF_PIZZA_STOCK'
        );
      }

      const [custRows] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM customers ORDER BY id ASC LIMIT 1`
      );
      if (!custRows[0]) throw new Error('Customer archetypes not seeded');
      const customerId = Number(custRows[0].id);

      const primaryMenu = menuRows[0]!;
      const availableQty = Number(primaryMenu.availableStock);
      const priceRatio =
        Number(primaryMenu.customPrice) / Math.max(1, Number(primaryMenu.basePrice));

      const demand = calculateCustomerDemand({
        diningTables: Number(rest.diningTablesCount),
        locationDemandMultiplier: Number(rest.locationDemandMultiplier),
        reputation: Number(rest.reputation),
        avgRating: Number(rest.avgRating),
        avgStarQuality: Number(primaryMenu.starQuality),
        priceRatio,
        hasAvailablePizza: true,
        typeDemandBonus: blueprint.demandBonus,
      });

      const qtyToSell = Math.min(demand, availableQty);
      const unitPrice = Number(primaryMenu.customPrice);
      const revenue = Number((unitPrice * qtyToSell).toFixed(2));
      const satisfaction = calculateOrderSatisfaction({
        starQuality: Number(primaryMenu.starQuality),
        decorLevel: Number(rest.decorLevel),
        priceRatio,
      });

      // 1. Deduct pizza inventory
      await this.inventoryService.applyStockMutation(conn, {
        playerId,
        businessId,
        itemId: Number(primaryMenu.itemId),
        quantityDelta: -qtyToSell,
        reservedDelta: 0,
        transactionType: 'WITHDRAW',
        notes: `Sold ${qtyToSell}x ${String(primaryMenu.itemName)} to restaurant guests`,
      });

      // 2. Record customer order
      await conn.query(
        `INSERT INTO customer_orders
           (player_id, restaurant_id, customer_id, item_id, order_channel, quantity, unit_price, total_amount, satisfaction_score, status, fulfilled_at)
         VALUES (?, ?, ?, ?, 'DINE_IN', ?, ?, ?, ?, 'SERVED', UTC_TIMESTAMP())`,
        [
          playerId,
          restaurantId,
          customerId,
          Number(primaryMenu.itemId),
          qtyToSell,
          unitPrice,
          revenue,
          satisfaction,
        ]
      );

      // 3. Credit revenue
      await this.economyService.recordCashTransaction(conn, {
        playerId,
        businessId,
        transactionType: 'REVENUE',
        category: 'PIZZA_SALE',
        amount: revenue,
        isCredit: true,
        description: `Restaurant sale: ${qtyToSell}x ${String(primaryMenu.itemName)}`,
      });

      // 4. Update menu & restaurant rating
      await conn.query(`UPDATE restaurant_menus SET total_sold = total_sold + ? WHERE id = ?`, [
        qtyToSell,
        Number(primaryMenu.id),
      ]);

      const nextRating = updateAverageRating(
        Number(rest.avgRating),
        Number(rest.totalRatingsCount),
        satisfaction
      );
      await conn.query(
        `UPDATE restaurants SET avg_rating = ?, total_ratings_count = ? WHERE id = ?`,
        [nextRating.avgRating, nextRating.totalRatings, restaurantId]
      );

      // 5. Award XP & increment total_pizzas_sold
      const [progRows] = await conn.query<RowDataPacket[]>(
        `SELECT xp_level AS xpLevel, current_xp AS currentXp
         FROM player_progression WHERE player_id = ? FOR UPDATE`,
        [playerId]
      );
      if (progRows[0]) {
        const nextProg = applyXpGain(
          Number(progRows[0].xpLevel),
          Number(progRows[0].currentXp),
          qtyToSell * 6
        );
        await conn.query(
          `UPDATE player_progression
           SET xp_level = ?, current_xp = ?, total_pizzas_sold = total_pizzas_sold + ?
           WHERE player_id = ?`,
          [nextProg.xpLevel, nextProg.currentXp, qtyToSell, playerId]
        );
      }
    });

    return this.restaurantRepo.getRestaurantsDashboard(playerId);
  }
}
