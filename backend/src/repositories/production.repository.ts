import { RowDataPacket } from 'mysql2/promise';
import { dbPool } from '../database/pool';
import { calculateProductionEfficiency } from '../utils/productionCalculator';
import { EconomyService } from '../services/economy.service';

export interface ProductionDashboardDTO {
  business: {
    id: number;
    name: string;
    businessType: string;
    productionCapacity: number;
    activeOrdersCount: number;
    efficiencyMultiplier: number;
  };
  recipes: Array<{
    id: number;
    code: string;
    name: string;
    facilityType: string;
    outputItemId: number;
    outputItemName: string;
    outputQuantity: number;
    durationSeconds: number;
    unlockXpLevel: number;
    isUnlocked: boolean;
    ingredients: Array<{
      itemId: number;
      code: string;
      name: string;
      quantityRequired: number;
      availableStock: number;
    }>;
  }>;
  availableIngredients: Array<{
    itemId: number;
    code: string;
    name: string;
    quantity: number;
    reservedQuantity: number;
    availableQuantity: number;
  }>;
  activeOrders: Array<{
    id: number;
    recipeId: number;
    recipeName: string;
    quantity: number;
    outputQuantity: number;
    status: string;
    startedAt: string;
    completesAt: string;
  }>;
  completedOrders: Array<{
    id: number;
    recipeName: string;
    quantity: number;
    outputQuantity: number;
    status: string;
    completedAt: string;
  }>;
  employees: Array<{
    id: number;
    fullName: string;
    role: string;
    skillLevel: number;
    happiness: number;
    productivity: number;
  }>;
}

export class ProductionRepository {
  private readonly economyService = new EconomyService();

  async getPrimaryProductionBusiness(
    playerId: number
  ): Promise<{ id: number; name: string; businessType: string; level: number }> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT id, name, business_type AS businessType, level
       FROM businesses
       WHERE player_id = ? AND deleted_at IS NULL
       ORDER BY FIELD(business_type, 'RESTAURANT', 'FACTORY', 'FARM') ASC, id ASC
       LIMIT 1`,
      [playerId]
    );
    if (!rows[0]) {
      throw new Error('No active business found for player');
    }
    return {
      id: Number(rows[0].id),
      name: String(rows[0].name),
      businessType: String(rows[0].businessType),
      level: Number(rows[0].level),
    };
  }

  async getProductionDashboard(playerId: number): Promise<ProductionDashboardDTO> {
    const business = await this.getPrimaryProductionBusiness(playerId);

    const [progRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT xp_level AS xpLevel FROM player_progression WHERE player_id = ? LIMIT 1`,
      [playerId]
    );
    const xpLevel = Number(progRows[0]?.xpLevel ?? 1);

    // Assigned employees for efficiency & display
    const [empRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT e.id, e.full_name AS fullName, e.role, e.skill_level AS skillLevel,
              e.happiness, e.hourly_wage AS hourlyWage, e.is_shift_lead AS isShiftLead
       FROM employees e
       INNER JOIN employee_assignments ea ON ea.employee_id = e.id AND ea.active_flag = 1
       WHERE ea.business_id = ? AND e.player_id = ? AND e.deleted_at IS NULL`,
      [business.id, playerId]
    );

    const employees = empRows.map((e) => {
      const prod = this.economyService.calculateEmployeeProductivity({
        skillLevel: Number(e.skillLevel),
        happiness: Number(e.happiness),
        hourlyWage: Number(e.hourlyWage),
        isShiftLead: Boolean(e.isShiftLead),
      });
      return {
        id: Number(e.id),
        fullName: String(e.fullName),
        role: String(e.role),
        skillLevel: Number(e.skillLevel),
        happiness: Number(e.happiness),
        productivity: prod,
      };
    });

    const efficiencyMultiplier = calculateProductionEfficiency(
      employees.map((e) => e.productivity)
    );
    const productionCapacity = 3 + Math.max(0, business.level - 1) * 2;

    // Available ingredients in this business
    const [ingStockRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         ii.id AS itemId, ii.code, ii.name,
         COALESCE(bi.quantity, 0) AS quantity,
         COALESCE(bi.reserved_quantity, 0) AS reservedQuantity
       FROM inventory_items ii
       LEFT JOIN business_inventory bi ON bi.item_id = ii.id AND bi.business_id = ?
       WHERE ii.code IN ('FLOUR', 'TOMATO_SAUCE', 'MOZZARELLA_CHEESE', 'ONIONS', 'TOMATOES', 'VEGETABLES', 'WHEAT', 'PIZZA_BOX_STD')
       ORDER BY ii.id ASC`,
      [business.id]
    );

    const stockByItemId = new Map<number, number>();
    const availableIngredients = ingStockRows.map((r) => {
      const qty = Number(r.quantity ?? 0);
      const res = Number(r.reservedQuantity ?? 0);
      const avail = Math.max(0, qty - res);
      stockByItemId.set(Number(r.itemId), avail);
      return {
        itemId: Number(r.itemId),
        code: String(r.code),
        name: String(r.name),
        quantity: qty,
        reservedQuantity: res,
        availableQuantity: avail,
      };
    });

    // Recipes & ingredients
    const [recipeRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         pr.id, pr.code, pr.name, pr.facility_type AS facilityType,
         pr.output_item_id AS outputItemId, ii.name AS outputItemName,
         pr.output_quantity AS outputQuantity, pr.duration_seconds AS durationSeconds,
         pr.unlock_xp_level AS unlockXpLevel
       FROM production_recipes pr
       INNER JOIN inventory_items ii ON ii.id = pr.output_item_id
       WHERE pr.code IN ('MILL_FLOUR', 'RECIPE_CLASSIC_TOMATO', 'RECIPE_MARGHERITA', 'RECIPE_CHEESE', 'RECIPE_VEGETABLE', 'RECIPE_PREMIUM')
       ORDER BY pr.unlock_xp_level ASC, pr.id ASC`
    );

    const [recIngRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT pri.recipe_id AS recipeId, pri.item_id AS itemId, ii.code, ii.name, pri.quantity_required AS quantityRequired
       FROM production_recipe_ingredients pri
       INNER JOIN inventory_items ii ON ii.id = pri.item_id`
    );

    const recIngMap = new Map<
      number,
      Array<{
        itemId: number;
        code: string;
        name: string;
        quantityRequired: number;
        availableStock: number;
      }>
    >();

    for (const ri of recIngRows) {
      const recId = Number(ri.recipeId);
      const itemId = Number(ri.itemId);
      const list = recIngMap.get(recId) ?? [];
      list.push({
        itemId,
        code: String(ri.code),
        name: String(ri.name),
        quantityRequired: Number(ri.quantityRequired),
        availableStock: stockByItemId.get(itemId) ?? 0,
      });
      recIngMap.set(recId, list);
    }

    const recipes = recipeRows.map((r) => ({
      id: Number(r.id),
      code: String(r.code),
      name: String(r.name),
      facilityType: String(r.facilityType),
      outputItemId: Number(r.outputItemId),
      outputItemName: String(r.outputItemName),
      outputQuantity: Number(r.outputQuantity),
      durationSeconds: Number(r.durationSeconds),
      unlockXpLevel: Number(r.unlockXpLevel),
      isUnlocked: xpLevel >= Number(r.unlockXpLevel),
      ingredients: recIngMap.get(Number(r.id)) ?? [],
    }));

    // Active & Completed Orders
    const [activeRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         po.id, po.recipe_id AS recipeId, pr.name AS recipeName,
         po.batch_multiplier AS quantity, pr.output_quantity AS outputQuantity,
         po.status, po.started_at AS startedAt, po.completes_at AS completesAt
       FROM production_orders po
       INNER JOIN production_recipes pr ON pr.id = po.recipe_id
       WHERE po.player_id = ? AND po.status IN ('QUEUED', 'IN_PROGRESS')
       ORDER BY po.completes_at ASC`,
      [playerId]
    );

    const [completedRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         po.id, pr.name AS recipeName, po.batch_multiplier AS quantity,
         pr.output_quantity AS outputQuantity, po.status, po.collected_at AS completedAt
       FROM production_orders po
       INNER JOIN production_recipes pr ON pr.id = po.recipe_id
       WHERE po.player_id = ? AND po.status IN ('COMPLETED', 'CANCELLED')
       ORDER BY po.id DESC
       LIMIT 15`,
      [playerId]
    );

    return {
      business: {
        id: business.id,
        name: business.name,
        businessType: business.businessType,
        productionCapacity,
        activeOrdersCount: activeRows.length,
        efficiencyMultiplier,
      },
      recipes,
      availableIngredients,
      activeOrders: activeRows.map((o) => ({
        id: Number(o.id),
        recipeId: Number(o.recipeId),
        recipeName: String(o.recipeName),
        quantity: Number(o.quantity),
        outputQuantity: Number(o.outputQuantity) * Number(o.quantity),
        status: String(o.status),
        startedAt: new Date(String(o.startedAt)).toISOString(),
        completesAt: new Date(String(o.completesAt)).toISOString(),
      })),
      completedOrders: completedRows.map((o) => ({
        id: Number(o.id),
        recipeName: String(o.recipeName),
        quantity: Number(o.quantity),
        outputQuantity: Number(o.outputQuantity) * Number(o.quantity),
        status: String(o.status),
        completedAt: o.completedAt
          ? new Date(String(o.completedAt)).toISOString()
          : new Date().toISOString(),
      })),
      employees,
    };
  }
}
