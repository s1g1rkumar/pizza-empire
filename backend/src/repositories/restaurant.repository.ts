import { RowDataPacket } from 'mysql2/promise';
import { dbPool } from '../database/pool';
import {
  calculateCustomerDemand,
  RESTAURANT_BLUEPRINTS,
  RestaurantBlueprint,
  RestaurantType,
} from '../utils/restaurantCalculator';
import { EconomyService } from '../services/economy.service';

export interface RestaurantMenuDTO {
  id: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  basePrice: number;
  customPrice: number;
  starQuality: number;
  isEnabled: boolean;
  totalSold: number;
  availableStock: number;
  starUpgradeCost: number;
}

export interface RestaurantDetailDTO {
  id: number;
  businessId: number;
  name: string;
  restaurantType: RestaurantType;
  typeLabel: string;
  locationName: string;
  locationDemandMultiplier: number;
  ovenCount: number;
  diningTablesCount: number;
  decorLevel: number;
  avgRating: number;
  totalRatingsCount: number;
  hourlyUpkeep: number;
  dailyRevenue: number;
  dailyExpenses: number;
  netProfit: number;
  estimatedDemand: number;
  menu: RestaurantMenuDTO[];
  employees: Array<{
    id: number;
    fullName: string;
    role: string;
    skillLevel: number;
    happiness: number;
    hourlyWage: number;
    productivity: number;
  }>;
}

export interface RestaurantsDashboardDTO {
  cashBalance: number;
  reputation: number;
  blueprints: RestaurantBlueprint[];
  locations: Array<{
    id: number;
    name: string;
    districtType: string;
    demandMultiplier: number;
    rentMultiplier: number;
  }>;
  restaurants: RestaurantDetailDTO[];
}

export class RestaurantRepository {
  private readonly economyService = new EconomyService();

  async getRestaurantsDashboard(playerId: number): Promise<RestaurantsDashboardDTO> {
    const [playerRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT cash_balance AS cashBalance, reputation FROM player_profiles WHERE id = ? LIMIT 1`,
      [playerId]
    );
    const cashBalance = Number(playerRows[0]?.cashBalance ?? 0);
    const reputation = Number(playerRows[0]?.reputation ?? 10);

    const [locRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT id, name, district_type AS districtType, demand_multiplier AS demandMultiplier, rent_multiplier AS rentMultiplier
       FROM locations
       ORDER BY unlock_level_number ASC, id ASC`
    );

    const [restRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         r.id, r.business_id AS businessId, r.restaurant_type AS restaurantType,
         b.name, b.hourly_upkeep AS hourlyUpkeep,
         l.name AS locationName, l.demand_multiplier AS locationDemandMultiplier,
         r.oven_count AS ovenCount, r.dining_tables_count AS diningTablesCount,
         r.decor_level AS decorLevel, r.avg_rating AS avgRating,
         r.total_ratings_count AS totalRatingsCount
       FROM restaurants r
       INNER JOIN businesses b ON b.id = r.business_id
       INNER JOIN locations l ON l.id = b.location_id
       WHERE r.player_id = ? AND r.deleted_at IS NULL AND b.deleted_at IS NULL
       ORDER BY r.id ASC`,
      [playerId]
    );

    const restaurants: RestaurantDetailDTO[] = [];

    for (const r of restRows) {
      const restId = Number(r.id);
      const bizId = Number(r.businessId);
      const restType = r.restaurantType as RestaurantType;
      const blueprint = RESTAURANT_BLUEPRINTS[restType];

      // 24h revenue & expenses for this business
      const [finRows] = await dbPool.query<RowDataPacket[]>(
        `SELECT
           COALESCE(SUM(CASE WHEN transaction_type = 'REVENUE' THEN amount ELSE 0 END), 0) AS rev,
           COALESCE(SUM(CASE WHEN transaction_type IN ('EXPENSE', 'CAPEX') THEN amount ELSE 0 END), 0) AS exp
         FROM financial_transactions
         WHERE player_id = ? AND business_id = ? AND created_at >= (UTC_TIMESTAMP() - INTERVAL 24 HOUR)`,
        [playerId, bizId]
      );
      const dailyRevenue = Number(finRows[0]?.rev ?? 0);
      const dailyExpenses = Number(finRows[0]?.exp ?? 0);

      // Menu + inventory stock
      const [menuRows] = await dbPool.query<RowDataPacket[]>(
        `SELECT
           rm.id, rm.item_id AS itemId, ii.code AS itemCode, ii.name AS itemName,
           rm.base_price AS basePrice, rm.custom_price AS customPrice,
           rm.star_quality AS starQuality, rm.is_enabled AS isEnabled, rm.total_sold AS totalSold,
           GREATEST(0, COALESCE(bi.quantity, 0) - COALESCE(bi.reserved_quantity, 0)) AS availableStock
         FROM restaurant_menus rm
         INNER JOIN inventory_items ii ON ii.id = rm.item_id
         LEFT JOIN business_inventory bi ON bi.business_id = ? AND bi.item_id = rm.item_id
         WHERE rm.restaurant_id = ?
         ORDER BY rm.id ASC`,
        [bizId, restId]
      );

      const menu: RestaurantMenuDTO[] = menuRows.map((m) => {
        const star = Number(m.starQuality);
        return {
          id: Number(m.id),
          itemId: Number(m.itemId),
          itemCode: String(m.itemCode),
          itemName: String(m.itemName),
          basePrice: Number(m.basePrice),
          customPrice: Number(m.customPrice),
          starQuality: star,
          isEnabled: Boolean(m.isEnabled),
          totalSold: Number(m.totalSold),
          availableStock: Number(m.availableStock ?? 0),
          starUpgradeCost: Math.floor(300 * Math.pow(2.2, star - 1)),
        };
      });

      // Assigned employees
      const [empRows] = await dbPool.query<RowDataPacket[]>(
        `SELECT e.id, e.full_name AS fullName, e.role, e.skill_level AS skillLevel,
                e.happiness, e.hourly_wage AS hourlyWage, e.is_shift_lead AS isShiftLead
         FROM employees e
         INNER JOIN employee_assignments ea ON ea.employee_id = e.id AND ea.active_flag = 1
         WHERE ea.business_id = ? AND e.player_id = ? AND e.deleted_at IS NULL`,
        [bizId, playerId]
      );

      const employees = empRows.map((e) => ({
        id: Number(e.id),
        fullName: String(e.fullName),
        role: String(e.role),
        skillLevel: Number(e.skillLevel),
        happiness: Number(e.happiness),
        hourlyWage: Number(e.hourlyWage),
        productivity: this.economyService.calculateEmployeeProductivity({
          skillLevel: Number(e.skillLevel),
          happiness: Number(e.happiness),
          hourlyWage: Number(e.hourlyWage),
          isShiftLead: Boolean(e.isShiftLead),
        }),
      }));

      const enabledMenu = menu.filter((m) => m.isEnabled && m.availableStock > 0);
      const avgStarQuality =
        enabledMenu.length > 0
          ? enabledMenu.reduce((s, m) => s + m.starQuality, 0) / enabledMenu.length
          : 1;
      const avgPriceRatio =
        enabledMenu.length > 0
          ? enabledMenu.reduce((s, m) => s + m.customPrice / Math.max(1, m.basePrice), 0) /
            enabledMenu.length
          : 1;

      const estimatedDemand = calculateCustomerDemand({
        diningTables: Number(r.diningTablesCount),
        locationDemandMultiplier: Number(r.locationDemandMultiplier),
        reputation,
        avgRating: Number(r.avgRating),
        avgStarQuality,
        priceRatio: avgPriceRatio,
        hasAvailablePizza: enabledMenu.length > 0,
        typeDemandBonus: blueprint.demandBonus,
      });

      restaurants.push({
        id: restId,
        businessId: bizId,
        name: String(r.name),
        restaurantType: restType,
        typeLabel: blueprint.label,
        locationName: String(r.locationName),
        locationDemandMultiplier: Number(r.locationDemandMultiplier),
        ovenCount: Number(r.ovenCount),
        diningTablesCount: Number(r.diningTablesCount),
        decorLevel: Number(r.decorLevel),
        avgRating: Number(r.avgRating),
        totalRatingsCount: Number(r.totalRatingsCount),
        hourlyUpkeep: Number(r.hourlyUpkeep),
        dailyRevenue,
        dailyExpenses,
        netProfit: Number((dailyRevenue - dailyExpenses).toFixed(2)),
        estimatedDemand,
        menu,
        employees,
      });
    }

    return {
      cashBalance,
      reputation,
      blueprints: Object.values(RESTAURANT_BLUEPRINTS),
      locations: locRows.map((l) => ({
        id: Number(l.id),
        name: String(l.name),
        districtType: String(l.districtType),
        demandMultiplier: Number(l.demandMultiplier),
        rentMultiplier: Number(l.rentMultiplier),
      })),
      restaurants,
    };
  }
}
