import { RowDataPacket } from 'mysql2/promise';
import { dbPool } from '../database/pool';
import { EconomyService } from '../services/economy.service';
import {
  calculateSupermarketDemand,
  calculateSupermarketProfit,
  calculateSupermarketUpgradeCost,
  SUPERMARKET_BLUEPRINTS,
  SUPERMARKET_UPGRADE_CONFIG,
  SupermarketBlueprint,
  SupermarketTier,
  SupermarketUpgradeType,
} from '../utils/supermarketCalculator';

export interface SupermarketListingDTO {
  id: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  category: string;
  baseRetailPrice: number;
  customPrice: number;
  unitWholesaleBuy: number;
  isEnabled: boolean;
  availableStock: number;
  estimatedDemand: number;
  totalSold: number;
  totalRevenue: number;
}

export interface SupermarketDetailDTO {
  id: number;
  businessId: number;
  name: string;
  storeTier: SupermarketTier;
  tierLabel: string;
  locationId: number;
  locationName: string;
  districtType: string;
  locationDemandMultiplier: number;
  priceElasticity: number;
  aisleLevel: number;
  checkoutLanes: number;
  coldStorageLevel: number;
  decorLevel: number;
  storageCapacity: number;
  storageUsed: number;
  hourlyUpkeep: number;
  dailySalesCount: number;
  dailyRevenue: number;
  dailyCogs: number;
  dailyExpenses: number;
  netProfit: number;
  totalRevenue: number;
  totalCogs: number;
  lastSaleAt: string | null;
  upgradeCosts: Record<SupermarketUpgradeType, number>;
  listings: SupermarketListingDTO[];
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

export interface SupermarketsDashboardDTO {
  cashBalance: number;
  summary: {
    totalStores: number;
    totalDailySales: number;
    totalDailyRevenue: number;
    totalDailyExpenses: number;
    totalNetProfit: number;
    totalInventoryUnits: number;
  };
  blueprints: SupermarketBlueprint[];
  upgradeConfigs: typeof SUPERMARKET_UPGRADE_CONFIG;
  locations: Array<{
    id: number;
    name: string;
    districtType: string;
    demandMultiplier: number;
    rentMultiplier: number;
    priceElasticity: number;
  }>;
  catalogItems: Array<{
    id: number;
    code: string;
    name: string;
    category: string;
    unitWholesaleBuy: number;
    unitWholesaleSell: number;
    description: string | null;
  }>;
  factories: Array<{
    id: number;
    businessId: number;
    name: string;
    factoryType: string;
    inventory: Array<{
      itemId: number;
      itemCode: string;
      itemName: string;
      category: string;
      availableQuantity: number;
      unitWholesaleSell: number;
    }>;
  }>;
  availableEmployees: Array<{
    id: number;
    fullName: string;
    role: string;
    skillLevel: number;
    hourlyWage: number;
    assignedBusinessId: number | null;
    assignedBusinessName: string | null;
  }>;
  supermarkets: SupermarketDetailDTO[];
}

export class SupermarketRepository {
  private readonly economyService = new EconomyService();

  async getSupermarketsDashboard(playerId: number): Promise<SupermarketsDashboardDTO> {
    const [pRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT cash_balance AS cashBalance FROM player_profiles WHERE id = ? LIMIT 1`,
      [playerId]
    );
    const cashBalance = Number(pRows[0]?.cashBalance ?? 0);

    const [locRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT id, name, district_type AS districtType, demand_multiplier AS demandMultiplier,
              rent_multiplier AS rentMultiplier, price_elasticity AS priceElasticity
       FROM locations ORDER BY id ASC`
    );

    const [catalogRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT id, code, name, category, unit_wholesale_buy AS unitWholesaleBuy,
              unit_wholesale_sell AS unitWholesaleSell, description
       FROM inventory_items
       ORDER BY FIELD(category, 'RETAIL_GOOD', 'PROCESSED_INGREDIENT', 'PIZZA', 'RAW_CROP', 'PACKAGING', 'RAW_MATERIAL'), name ASC`
    );

    const [facRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT f.id, f.business_id AS businessId, b.name, f.factory_type AS factoryType
       FROM factories f
       INNER JOIN businesses b ON b.id = f.business_id
       WHERE f.player_id = ? AND f.deleted_at IS NULL AND b.deleted_at IS NULL
       ORDER BY f.id ASC`,
      [playerId]
    );

    const factories = await Promise.all(
      facRows.map(async (fac) => {
        const [invRows] = await dbPool.query<RowDataPacket[]>(
          `SELECT bi.item_id AS itemId, ii.code AS itemCode, ii.name AS itemName, ii.category,
                  (bi.quantity - bi.reserved_quantity) AS availableQuantity,
                  ii.unit_wholesale_sell AS unitWholesaleSell
           FROM business_inventory bi
           INNER JOIN inventory_items ii ON ii.id = bi.item_id
           WHERE bi.business_id = ? AND (bi.quantity - bi.reserved_quantity) > 0
           ORDER BY ii.name ASC`,
          [Number(fac.businessId)]
        );
        return {
          id: Number(fac.id),
          businessId: Number(fac.businessId),
          name: String(fac.name),
          factoryType: String(fac.factoryType),
          inventory: invRows.map((i) => ({
            itemId: Number(i.itemId),
            itemCode: String(i.itemCode),
            itemName: String(i.itemName),
            category: String(i.category),
            availableQuantity: Number(i.availableQuantity),
            unitWholesaleSell: Number(i.unitWholesaleSell),
          })),
        };
      })
    );

    const [empCatalogRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT e.id, e.full_name AS fullName, e.role, e.skill_level AS skillLevel, e.hourly_wage AS hourlyWage,
              ea.business_id AS assignedBusinessId, b.name AS assignedBusinessName
       FROM employees e
       LEFT JOIN employee_assignments ea ON ea.employee_id = e.id AND ea.active_flag = 1
       LEFT JOIN businesses b ON b.id = ea.business_id
       WHERE e.player_id = ? AND e.deleted_at IS NULL
       ORDER BY e.skill_level DESC, e.id ASC`,
      [playerId]
    );

    const [storeRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT s.id, s.business_id AS businessId, b.name, s.store_tier AS storeTier,
              b.location_id AS locationId, l.name AS locationName, l.district_type AS districtType,
              l.demand_multiplier AS locationDemandMultiplier, l.price_elasticity AS priceElasticity,
              s.aisle_level AS aisleLevel, s.checkout_lanes AS checkoutLanes,
              s.cold_storage_level AS coldStorageLevel, s.decor_level AS decorLevel,
              b.storage_capacity AS storageCapacity, b.hourly_upkeep AS hourlyUpkeep,
              s.daily_sales_count AS dailySalesCount, s.total_revenue AS totalRevenue,
              s.total_cogs AS totalCogs, s.last_sale_at AS lastSaleAt
       FROM supermarkets s
       INNER JOIN businesses b ON b.id = s.business_id
       INNER JOIN locations l ON l.id = b.location_id
       WHERE s.player_id = ? AND s.deleted_at IS NULL AND b.deleted_at IS NULL
       ORDER BY s.id ASC`,
      [playerId]
    );

    const supermarkets: SupermarketDetailDTO[] = [];

    for (const s of storeRows) {
      const supermarketId = Number(s.id);
      const businessId = Number(s.businessId);
      const storeTier = s.storeTier as SupermarketTier;
      const blueprint = SUPERMARKET_BLUEPRINTS[storeTier] ?? SUPERMARKET_BLUEPRINTS.MINI_MART;

      const [usedRows] = await dbPool.query<RowDataPacket[]>(
        `SELECT COALESCE(SUM(quantity), 0) AS used FROM business_inventory WHERE business_id = ?`,
        [businessId]
      );
      const storageUsed = Number(usedRows[0]?.used ?? 0);

      const [empRows] = await dbPool.query<RowDataPacket[]>(
        `SELECT e.id, e.full_name AS fullName, e.role, e.skill_level AS skillLevel,
                e.happiness, e.hourly_wage AS hourlyWage, e.is_shift_lead AS isShiftLead
         FROM employees e
         INNER JOIN employee_assignments ea ON ea.employee_id = e.id AND ea.active_flag = 1
         WHERE ea.business_id = ? AND e.player_id = ? AND e.deleted_at IS NULL`,
        [businessId, playerId]
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

      const totalProductivity = employees.reduce((acc, emp) => acc + emp.productivity, 0);
      const employeeHourlyPayroll = employees.reduce((acc, emp) => acc + emp.hourlyWage, 0);

      const [listingRows] = await dbPool.query<RowDataPacket[]>(
        `SELECT sl.id, sl.item_id AS itemId, ii.code AS itemCode, ii.name AS itemName, ii.category,
                sl.base_retail_price AS baseRetailPrice, sl.custom_price AS customPrice,
                ii.unit_wholesale_buy AS unitWholesaleBuy, sl.is_enabled AS isEnabled,
                sl.total_sold AS totalSold, sl.total_revenue AS totalRevenue,
                COALESCE(bi.quantity - bi.reserved_quantity, 0) AS availableStock
         FROM supermarket_listings sl
         INNER JOIN inventory_items ii ON ii.id = sl.item_id
         LEFT JOIN business_inventory bi ON bi.business_id = ? AND bi.item_id = sl.item_id
         WHERE sl.supermarket_id = ? AND sl.player_id = ?
         ORDER BY ii.category ASC, ii.name ASC`,
        [businessId, supermarketId, playerId]
      );

      const listings: SupermarketListingDTO[] = listingRows.map((row) => {
        const availableStock = Math.max(0, Number(row.availableStock ?? 0));
        const baseRetailPrice = Number(row.baseRetailPrice);
        const customPrice = Number(row.customPrice);
        const isEnabled = Boolean(row.isEnabled);

        const estimatedDemand = isEnabled
          ? calculateSupermarketDemand({
              tier: storeTier,
              locationDemandMultiplier: Number(s.locationDemandMultiplier ?? 1),
              priceElasticity: Number(s.priceElasticity ?? 1),
              baseRetailPrice,
              customPrice,
              aisleLevel: Number(s.aisleLevel),
              checkoutLanes: Number(s.checkoutLanes),
              coldStorageLevel: Number(s.coldStorageLevel),
              decorLevel: Number(s.decorLevel),
              employeeProductivity: totalProductivity,
              availableStock,
            })
          : 0;

        return {
          id: Number(row.id),
          itemId: Number(row.itemId),
          itemCode: String(row.itemCode),
          itemName: String(row.itemName),
          category: String(row.category),
          baseRetailPrice,
          customPrice,
          unitWholesaleBuy: Number(row.unitWholesaleBuy),
          isEnabled,
          availableStock,
          estimatedDemand,
          totalSold: Number(row.totalSold),
          totalRevenue: Number(row.totalRevenue),
        };
      });

      const [revRows] = await dbPool.query<RowDataPacket[]>(
        `SELECT COALESCE(SUM(CASE WHEN transaction_type = 'REVENUE' THEN amount ELSE 0 END), 0) AS dailyRevenue,
                COALESCE(SUM(CASE WHEN transaction_type = 'EXPENSE' AND category = 'WHOLESALE_BUY' THEN amount ELSE 0 END), 0) AS dailyCogs
         FROM financial_transactions
         WHERE player_id = ? AND business_id = ? AND created_at >= (UTC_TIMESTAMP() - INTERVAL 1 DAY)`,
        [playerId, businessId]
      );

      const dailyRevenue = Number(revRows[0]?.dailyRevenue ?? 0);
      const dailyCogs = Number(revRows[0]?.dailyCogs ?? 0);
      const hourlyUpkeep = Number(s.hourlyUpkeep);
      const { dailyExpenses, netProfit } = calculateSupermarketProfit({
        dailyRevenue,
        dailyCogs,
        hourlyUpkeep,
        employeeHourlyPayroll,
      });

      const storageLevel = Math.max(1, Math.round((Number(s.storageCapacity) - 100) / 300));

      supermarkets.push({
        id: supermarketId,
        businessId,
        name: String(s.name),
        storeTier,
        tierLabel: blueprint.label,
        locationId: Number(s.locationId),
        locationName: String(s.locationName),
        districtType: String(s.districtType),
        locationDemandMultiplier: Number(s.locationDemandMultiplier ?? 1),
        priceElasticity: Number(s.priceElasticity ?? 1),
        aisleLevel: Number(s.aisleLevel),
        checkoutLanes: Number(s.checkoutLanes),
        coldStorageLevel: Number(s.coldStorageLevel),
        decorLevel: Number(s.decorLevel),
        storageCapacity: Number(s.storageCapacity),
        storageUsed,
        hourlyUpkeep,
        dailySalesCount: Number(s.dailySalesCount),
        dailyRevenue,
        dailyCogs,
        dailyExpenses,
        netProfit,
        totalRevenue: Number(s.totalRevenue),
        totalCogs: Number(s.totalCogs),
        lastSaleAt: s.lastSaleAt ? new Date(s.lastSaleAt).toISOString() : null,
        upgradeCosts: {
          AISLES: calculateSupermarketUpgradeCost('AISLES', Number(s.aisleLevel)),
          CHECKOUT_LANES: calculateSupermarketUpgradeCost(
            'CHECKOUT_LANES',
            Number(s.checkoutLanes)
          ),
          COLD_STORAGE: calculateSupermarketUpgradeCost('COLD_STORAGE', Number(s.coldStorageLevel)),
          DECOR: calculateSupermarketUpgradeCost('DECOR', Number(s.decorLevel)),
          STORAGE: calculateSupermarketUpgradeCost('STORAGE', storageLevel),
        },
        listings,
        employees,
      });
    }

    const summary = {
      totalStores: supermarkets.length,
      totalDailySales: supermarkets.reduce((acc, st) => acc + st.dailySalesCount, 0),
      totalDailyRevenue: Number(
        supermarkets.reduce((acc, st) => acc + st.dailyRevenue, 0).toFixed(2)
      ),
      totalDailyExpenses: Number(
        supermarkets.reduce((acc, st) => acc + st.dailyExpenses, 0).toFixed(2)
      ),
      totalNetProfit: Number(supermarkets.reduce((acc, st) => acc + st.netProfit, 0).toFixed(2)),
      totalInventoryUnits: supermarkets.reduce((acc, st) => acc + st.storageUsed, 0),
    };

    return {
      cashBalance,
      summary,
      blueprints: Object.values(SUPERMARKET_BLUEPRINTS),
      upgradeConfigs: SUPERMARKET_UPGRADE_CONFIG,
      locations: locRows.map((l) => ({
        id: Number(l.id),
        name: String(l.name),
        districtType: String(l.districtType),
        demandMultiplier: Number(l.demandMultiplier),
        rentMultiplier: Number(l.rentMultiplier),
        priceElasticity: Number(l.priceElasticity),
      })),
      catalogItems: catalogRows.map((c) => ({
        id: Number(c.id),
        code: String(c.code),
        name: String(c.name),
        category: String(c.category),
        unitWholesaleBuy: Number(c.unitWholesaleBuy),
        unitWholesaleSell: Number(c.unitWholesaleSell),
        description: c.description ? String(c.description) : null,
      })),
      factories,
      availableEmployees: empCatalogRows.map((e) => ({
        id: Number(e.id),
        fullName: String(e.fullName),
        role: String(e.role),
        skillLevel: Number(e.skillLevel),
        hourlyWage: Number(e.hourlyWage),
        assignedBusinessId: e.assignedBusinessId ? Number(e.assignedBusinessId) : null,
        assignedBusinessName: e.assignedBusinessName ? String(e.assignedBusinessName) : null,
      })),
      supermarkets,
    };
  }
}
