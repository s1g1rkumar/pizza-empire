import { RowDataPacket } from 'mysql2/promise';
import { dbPool } from '../database/pool';
import {
  calculateFactorySpeedMultiplier,
  calculateMachinePurchaseCost,
  FACTORY_BLUEPRINTS,
  FactoryBlueprint,
  FactoryType,
} from '../utils/factoryCalculator';
import { calculateProductionEfficiency } from '../utils/productionCalculator';
import { EconomyService } from '../services/economy.service';

export interface FactoryDetailDTO {
  id: number;
  businessId: number;
  name: string;
  factoryType: FactoryType;
  typeLabel: string;
  locationName: string;
  machineCount: number;
  nextMachineCost: number;
  queueCapacity: number;
  speedMultiplier: number;
  storageCapacity: number;
  storageUsed: number;
  hourlyUpkeep: number;
  recipe: {
    id: number;
    name: string;
    outputItemId: number;
    outputItemName: string;
    outputQuantity: number;
    outputStock: number;
    durationSeconds: number;
    ingredients: Array<{
      itemId: number;
      name: string;
      quantityRequired: number;
      availableStock: number;
    }>;
  } | null;
  activeOrders: Array<{
    id: number;
    recipeName: string;
    quantity: number;
    status: string;
    startedAt: string;
    completesAt: string;
  }>;
  employees: Array<{
    id: number;
    fullName: string;
    role: string;
    skillLevel: number;
    productivity: number;
  }>;
}

export interface FactoriesDashboardDTO {
  cashBalance: number;
  blueprints: FactoryBlueprint[];
  locations: Array<{ id: number; name: string; rentMultiplier: number }>;
  targetBusinesses: Array<{ id: number; name: string; businessType: string }>;
  factories: FactoryDetailDTO[];
}

export class FactoryRepository {
  private readonly economyService = new EconomyService();

  async getFactoriesDashboard(playerId: number): Promise<FactoriesDashboardDTO> {
    const [pRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT cash_balance AS cashBalance FROM player_profiles WHERE id = ? LIMIT 1`,
      [playerId]
    );
    const cashBalance = Number(pRows[0]?.cashBalance ?? 0);

    const [locRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT id, name, rent_multiplier AS rentMultiplier FROM locations ORDER BY id ASC`
    );

    const [targetBizRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT id, name, business_type AS businessType
       FROM businesses
       WHERE player_id = ? AND deleted_at IS NULL AND business_type IN ('RESTAURANT', 'SUPERMARKET', 'FARM')
       ORDER BY id ASC`,
      [playerId]
    );

    const [facRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         f.id, f.business_id AS businessId, f.factory_type AS factoryType,
         f.machine_count AS machineCount, f.queue_capacity AS queueCapacity,
         b.name, b.storage_capacity AS storageCapacity, b.hourly_upkeep AS hourlyUpkeep,
         l.name AS locationName
       FROM factories f
       INNER JOIN businesses b ON b.id = f.business_id
       INNER JOIN locations l ON l.id = b.location_id
       WHERE f.player_id = ? AND f.deleted_at IS NULL AND b.deleted_at IS NULL
       ORDER BY f.id ASC`,
      [playerId]
    );

    const factories: FactoryDetailDTO[] = [];

    for (const f of facRows) {
      const facId = Number(f.id);
      const bizId = Number(f.businessId);
      const factoryType = f.factory_type as FactoryType | undefined;
      const resolvedType = (f.factoryType as FactoryType) ?? factoryType;
      const blueprint = FACTORY_BLUEPRINTS[resolvedType];
      const machineCount = Number(f.machineCount);

      const [storageRows] = await dbPool.query<RowDataPacket[]>(
        `SELECT COALESCE(SUM(quantity), 0) AS used FROM business_inventory WHERE business_id = ?`,
        [bizId]
      );
      const storageUsed = Number(storageRows[0]?.used ?? 0);

      // Employees
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
        productivity: this.economyService.calculateEmployeeProductivity({
          skillLevel: Number(e.skillLevel),
          happiness: Number(e.happiness),
          hourlyWage: Number(e.hourlyWage),
          isShiftLead: Boolean(e.isShiftLead),
        }),
      }));

      const empBonus = calculateProductionEfficiency(employees.map((e) => e.productivity));
      const speedMultiplier = calculateFactorySpeedMultiplier(machineCount, empBonus);

      // Recipe for this factory type
      const [recRows] = await dbPool.query<RowDataPacket[]>(
        `SELECT pr.id, pr.name, pr.output_item_id AS outputItemId, ii.name AS outputItemName,
                pr.output_quantity AS outputQuantity, pr.duration_seconds AS durationSeconds,
                GREATEST(0, COALESCE(bi.quantity, 0) - COALESCE(bi.reserved_quantity, 0)) AS outputStock
         FROM production_recipes pr
         INNER JOIN inventory_items ii ON ii.id = pr.output_item_id
         LEFT JOIN business_inventory bi ON bi.business_id = ? AND bi.item_id = pr.output_item_id
         WHERE pr.code = ? LIMIT 1`,
        [bizId, blueprint.recipeCode]
      );

      let recipe: FactoryDetailDTO['recipe'] = null;
      if (recRows[0]) {
        const rec = recRows[0];
        const [ingRows] = await dbPool.query<RowDataPacket[]>(
          `SELECT pri.item_id AS itemId, ii.name, pri.quantity_required AS quantityRequired,
                  GREATEST(0, COALESCE(bi.quantity, 0) - COALESCE(bi.reserved_quantity, 0)) AS availableStock
           FROM production_recipe_ingredients pri
           INNER JOIN inventory_items ii ON ii.id = pri.item_id
           LEFT JOIN business_inventory bi ON bi.business_id = ? AND bi.item_id = pri.item_id
           WHERE pri.recipe_id = ?`,
          [bizId, Number(rec.id)]
        );
        recipe = {
          id: Number(rec.id),
          name: String(rec.name),
          outputItemId: Number(rec.outputItemId),
          outputItemName: String(rec.outputItemName),
          outputQuantity: Number(rec.outputQuantity),
          outputStock: Number(rec.outputStock ?? 0),
          durationSeconds: Number(rec.durationSeconds),
          ingredients: ingRows.map((i) => ({
            itemId: Number(i.itemId),
            name: String(i.name),
            quantityRequired: Number(i.quantityRequired),
            availableStock: Number(i.availableStock ?? 0),
          })),
        };
      }

      const [orderRows] = await dbPool.query<RowDataPacket[]>(
        `SELECT po.id, pr.name AS recipeName, po.batch_multiplier AS quantity,
                po.status, po.started_at AS startedAt, po.completes_at AS completesAt
         FROM production_orders po
         INNER JOIN production_recipes pr ON pr.id = po.recipe_id
         WHERE po.business_id = ? AND po.status IN ('QUEUED', 'IN_PROGRESS')
         ORDER BY po.completes_at ASC`,
        [bizId]
      );

      factories.push({
        id: facId,
        businessId: bizId,
        name: String(f.name),
        factoryType: resolvedType,
        typeLabel: blueprint.label,
        locationName: String(f.locationName),
        machineCount,
        nextMachineCost: calculateMachinePurchaseCost(blueprint.machineCost, machineCount),
        queueCapacity: Number(f.queueCapacity),
        speedMultiplier,
        storageCapacity: Number(f.storageCapacity),
        storageUsed,
        hourlyUpkeep: Number(f.hourlyUpkeep),
        recipe,
        activeOrders: orderRows.map((o) => ({
          id: Number(o.id),
          recipeName: String(o.recipeName),
          quantity: Number(o.quantity),
          status: String(o.status),
          startedAt: new Date(String(o.startedAt)).toISOString(),
          completesAt: new Date(String(o.completesAt)).toISOString(),
        })),
        employees,
      });
    }

    return {
      cashBalance,
      blueprints: Object.values(FACTORY_BLUEPRINTS),
      locations: locRows.map((l) => ({
        id: Number(l.id),
        name: String(l.name),
        rentMultiplier: Number(l.rentMultiplier),
      })),
      targetBusinesses: targetBizRows.map((b) => ({
        id: Number(b.id),
        name: String(b.name),
        businessType: String(b.businessType),
      })),
      factories,
    };
  }
}
