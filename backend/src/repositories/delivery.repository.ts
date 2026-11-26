import { RowDataPacket } from 'mysql2/promise';
import { dbPool } from '../database/pool';
import {
  calculateVehicleUpgradeCost,
  VEHICLE_BLUEPRINTS,
  VehicleBlueprint,
  VehicleType,
} from '../utils/deliveryCalculator';
import { EconomyService } from '../services/economy.service';

export interface DeliveryDashboardDTO {
  cashBalance: number;
  performance: {
    totalDeliveries: number;
    onTimeRatePct: number;
    avgSatisfaction: number;
    totalDeliveryRevenue: number;
    totalTipsEarned: number;
  };
  blueprints: VehicleBlueprint[];
  zones: Array<{
    id: number;
    code: string;
    name: string;
    distanceKm: number;
    baseDeliveryCharge: number;
    demandWeight: number;
  }>;
  vehicles: Array<{
    id: number;
    vehicleType: VehicleType;
    typeLabel: string;
    name: string;
    capacity: number;
    speedMultiplier: number;
    upgradeLevel: number;
    nextUpgradeCost: number;
    hourlyMaintenance: number;
    status: string;
  }>;
  drivers: Array<{
    id: number;
    fullName: string;
    skillLevel: number;
    happiness: number;
    productivity: number;
  }>;
  restaurants: Array<{
    id: number;
    businessId: number;
    name: string;
    pizzas: Array<{ itemId: number; name: string; price: number; availableStock: number }>;
  }>;
  activeDeliveries: Array<{
    id: number;
    orderId: number;
    pizzaName: string;
    quantity: number;
    zoneName: string;
    vehicleName: string;
    driverName: string | null;
    deliveryFee: number;
    dispatchedAt: string;
    etaAt: string;
  }>;
  recentDeliveries: Array<{
    id: number;
    pizzaName: string;
    quantity: number;
    zoneName: string;
    deliveryFee: number;
    tipAmount: number;
    isOnTime: boolean;
    status: string;
    deliveredAt: string | null;
  }>;
}

export class DeliveryRepository {
  private readonly economyService = new EconomyService();

  async getDeliveryDashboard(playerId: number): Promise<DeliveryDashboardDTO> {
    const [pRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT cash_balance AS cashBalance FROM player_profiles WHERE id = ? LIMIT 1`,
      [playerId]
    );
    const cashBalance = Number(pRows[0]?.cashBalance ?? 0);

    // Performance metrics
    const [perfRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         COUNT(*) AS totalDeliveries,
         COALESCE(AVG(COALESCE(d.is_on_time, 1)) * 100, 100) AS onTimeRatePct,
         COALESCE(AVG(COALESCE(co.satisfaction_score, 4.5)), 4.5) AS avgSatisfaction,
         COALESCE(SUM(d.delivery_fee), 0) AS totalFees,
         COALESCE(SUM(d.tip_amount), 0) AS totalTips
       FROM deliveries d
       INNER JOIN customer_orders co ON co.id = d.customer_order_id
       WHERE d.player_id = ? AND d.status = 'DELIVERED'`,
      [playerId]
    );
    const perf = perfRows[0] ?? {};

    const [zoneRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT id, code, name, distance_km AS distanceKm, base_delivery_charge AS baseDeliveryCharge, demand_weight AS demandWeight
       FROM delivery_zones ORDER BY distance_km ASC`
    );

    const [vehRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT id, vehicle_type AS vehicleType, name, capacity, speed_multiplier AS speedMultiplier,
              upgrade_level AS upgradeLevel, hourly_maintenance AS hourlyMaintenance, status
       FROM delivery_vehicles
       WHERE player_id = ? AND deleted_at IS NULL
       ORDER BY id ASC`,
      [playerId]
    );

    const [driverRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT id, full_name AS fullName, skill_level AS skillLevel, happiness, hourly_wage AS hourlyWage, is_shift_lead AS isShiftLead
       FROM employees
       WHERE player_id = ? AND deleted_at IS NULL AND department IN ('DELIVERY', 'LOGISTICS')
       ORDER BY id ASC`,
      [playerId]
    );

    const [restRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT r.id, r.business_id AS businessId, b.name
       FROM restaurants r
       INNER JOIN businesses b ON b.id = r.business_id
       WHERE r.player_id = ? AND r.deleted_at IS NULL AND b.deleted_at IS NULL`,
      [playerId]
    );

    const restaurants: DeliveryDashboardDTO['restaurants'] = [];
    for (const r of restRows) {
      const [pizzaRows] = await dbPool.query<RowDataPacket[]>(
        `SELECT rm.item_id AS itemId, ii.name, rm.custom_price AS price,
                GREATEST(0, COALESCE(bi.quantity, 0) - COALESCE(bi.reserved_quantity, 0)) AS availableStock
         FROM restaurant_menus rm
         INNER JOIN inventory_items ii ON ii.id = rm.item_id
         LEFT JOIN business_inventory bi ON bi.business_id = ? AND bi.item_id = rm.item_id
         WHERE rm.restaurant_id = ? AND rm.is_enabled = 1`,
        [Number(r.businessId), Number(r.id)]
      );
      restaurants.push({
        id: Number(r.id),
        businessId: Number(r.businessId),
        name: String(r.name),
        pizzas: pizzaRows.map((p) => ({
          itemId: Number(p.itemId),
          name: String(p.name),
          price: Number(p.price),
          availableStock: Number(p.availableStock ?? 0),
        })),
      });
    }

    const [activeRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         d.id, co.id AS orderId, ii.name AS pizzaName, co.quantity,
         COALESCE(dz.name, 'Local') AS zoneName, dv.name AS vehicleName,
         e.full_name AS driverName, d.delivery_fee AS deliveryFee,
         d.dispatched_at AS dispatchedAt, d.eta_at AS etaAt
       FROM deliveries d
       INNER JOIN customer_orders co ON co.id = d.customer_order_id
       INNER JOIN inventory_items ii ON ii.id = co.item_id
       INNER JOIN delivery_vehicles dv ON dv.id = d.vehicle_id
       LEFT JOIN delivery_zones dz ON dz.id = d.zone_id
       LEFT JOIN employees e ON e.id = d.driver_employee_id
       WHERE d.player_id = ? AND d.status = 'DISPATCHED'
       ORDER BY d.eta_at ASC`,
      [playerId]
    );

    const [recentRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         d.id, ii.name AS pizzaName, co.quantity, COALESCE(dz.name, 'Local') AS zoneName,
         d.delivery_fee AS deliveryFee, d.tip_amount AS tipAmount,
         d.is_on_time AS isOnTime, d.status, d.delivered_at AS deliveredAt
       FROM deliveries d
       INNER JOIN customer_orders co ON co.id = d.customer_order_id
       INNER JOIN inventory_items ii ON ii.id = co.item_id
       LEFT JOIN delivery_zones dz ON dz.id = d.zone_id
       WHERE d.player_id = ? AND d.status IN ('DELIVERED', 'FAILED')
       ORDER BY d.id DESC
       LIMIT 15`,
      [playerId]
    );

    return {
      cashBalance,
      performance: {
        totalDeliveries: Number(perf.totalDeliveries ?? 0),
        onTimeRatePct: Number(Number(perf.onTimeRatePct ?? 100).toFixed(1)),
        avgSatisfaction: Number(Number(perf.avgSatisfaction ?? 4.5).toFixed(2)),
        totalDeliveryRevenue: Number(perf.totalFees ?? 0),
        totalTipsEarned: Number(perf.totalTips ?? 0),
      },
      blueprints: Object.values(VEHICLE_BLUEPRINTS),
      zones: zoneRows.map((z) => ({
        id: Number(z.id),
        code: String(z.code),
        name: String(z.name),
        distanceKm: Number(z.distanceKm),
        baseDeliveryCharge: Number(z.baseDeliveryCharge),
        demandWeight: Number(z.demandWeight),
      })),
      vehicles: vehRows.map((v) => {
        const vType = v.vehicleType as VehicleType;
        const bp = VEHICLE_BLUEPRINTS[vType] ?? VEHICLE_BLUEPRINTS.BICYCLE;
        const upgLv = Number(v.upgradeLevel ?? 1);
        return {
          id: Number(v.id),
          vehicleType: vType,
          typeLabel: bp.label,
          name: String(v.name),
          capacity: Number(v.capacity),
          speedMultiplier: Number(v.speedMultiplier),
          upgradeLevel: upgLv,
          nextUpgradeCost: calculateVehicleUpgradeCost(bp.purchaseCost, upgLv),
          hourlyMaintenance: Number(v.hourlyMaintenance),
          status: String(v.status),
        };
      }),
      drivers: driverRows.map((d) => ({
        id: Number(d.id),
        fullName: String(d.fullName),
        skillLevel: Number(d.skillLevel),
        happiness: Number(d.happiness),
        productivity: this.economyService.calculateEmployeeProductivity({
          skillLevel: Number(d.skillLevel),
          happiness: Number(d.happiness),
          hourlyWage: Number(d.hourlyWage),
          isShiftLead: Boolean(d.isShiftLead),
        }),
      })),
      restaurants,
      activeDeliveries: activeRows.map((a) => ({
        id: Number(a.id),
        orderId: Number(a.orderId),
        pizzaName: String(a.pizzaName),
        quantity: Number(a.quantity),
        zoneName: String(a.zoneName),
        vehicleName: String(a.vehicleName),
        driverName: a.driverName ? String(a.driverName) : null,
        deliveryFee: Number(a.deliveryFee),
        dispatchedAt: new Date(String(a.dispatchedAt)).toISOString(),
        etaAt: new Date(String(a.etaAt)).toISOString(),
      })),
      recentDeliveries: recentRows.map((r) => ({
        id: Number(r.id),
        pizzaName: String(r.pizzaName),
        quantity: Number(r.quantity),
        zoneName: String(r.zoneName),
        deliveryFee: Number(r.deliveryFee),
        tipAmount: Number(r.tipAmount),
        isOnTime: Boolean(r.isOnTime),
        status: String(r.status),
        deliveredAt: r.deliveredAt ? new Date(String(r.deliveredAt)).toISOString() : null,
      })),
    };
  }
}
