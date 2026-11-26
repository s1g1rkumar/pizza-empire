import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { withTransaction } from '../database/pool';
import { DeliveryDashboardDTO, DeliveryRepository } from '../repositories/delivery.repository';
import { AppError, ConflictError, NotFoundError } from '../utils/errors';
import {
  calculateDeliveryDurationSeconds,
  calculateDeliveryTip,
  calculateVehicleUpgradeCost,
  VEHICLE_BLUEPRINTS,
  VehicleType,
} from '../utils/deliveryCalculator';
import { applyXpGain } from '../utils/simulationTime';
import { EconomyService } from './economy.service';
import { InventoryService } from './inventory.service';

export class DeliveryService {
  private readonly deliveryRepo = new DeliveryRepository();
  private readonly economyService = new EconomyService();
  private readonly inventoryService = new InventoryService();

  private async ensureDeliveryHubBusiness(conn: PoolConnection, playerId: number): Promise<number> {
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT id FROM businesses
       WHERE player_id = ? AND business_type = 'DELIVERY_HUB' AND deleted_at IS NULL
       ORDER BY id ASC LIMIT 1`,
      [playerId]
    );
    if (rows[0]) return Number(rows[0].id);

    const [locRows] = await conn.query<RowDataPacket[]>(
      `SELECT id FROM locations ORDER BY id ASC LIMIT 1`
    );
    const locId = Number(locRows[0]?.id ?? 1);

    const [res] = await conn.query<ResultSetHeader>(
      `INSERT INTO businesses (player_id, location_id, business_type, name, storage_capacity, hourly_upkeep, max_employees)
       VALUES (?, ?, 'DELIVERY_HUB', 'Central Dispatch Hub', 100, 10.00, 35)`,
      [playerId, locId]
    );
    return res.insertId;
  }

  /**
   * Completes arrived deliveries (eta_at <= UTC_TIMESTAMP()), processes payment + tips,
   * updates customer satisfaction, and returns vehicles to IDLE.
   */
  async settleArrivedDeliveries(conn: PoolConnection, playerId: number): Promise<number> {
    const [arrived] = await conn.query<RowDataPacket[]>(
      `SELECT
         d.id, d.customer_order_id AS orderId, d.vehicle_id AS vehicleId,
         d.delivery_fee AS deliveryFee, d.eta_at AS etaAt,
         co.total_amount AS orderTotal, co.restaurant_id AS restaurantId,
         r.business_id AS restaurantBusinessId,
         e.skill_level AS driverSkill, e.happiness AS driverHappiness,
         e.hourly_wage AS driverWage, e.is_shift_lead AS driverLead
       FROM deliveries d
       INNER JOIN customer_orders co ON co.id = d.customer_order_id
       INNER JOIN restaurants r ON r.id = co.restaurant_id
       LEFT JOIN employees e ON e.id = d.driver_employee_id
       WHERE d.player_id = ? AND d.status = 'DISPATCHED' AND d.eta_at <= UTC_TIMESTAMP()
       FOR UPDATE`,
      [playerId]
    );

    for (const del of arrived) {
      const deliveryId = Number(del.id);
      const driverProd = del.driverSkill
        ? this.economyService.calculateEmployeeProductivity({
            skillLevel: Number(del.driverSkill),
            happiness: Number(del.driverHappiness),
            hourlyWage: Number(del.driverWage),
            isShiftLead: Boolean(del.driverLead),
          })
        : 1.0;

      const tip = calculateDeliveryTip({
        orderAmount: Number(del.orderTotal),
        isOnTime: true,
        driverProductivity: driverProd,
      });

      await conn.query(
        `UPDATE deliveries
         SET status = 'DELIVERED', tip_amount = ?, is_on_time = 1, delivered_at = UTC_TIMESTAMP()
         WHERE id = ? AND status = 'DISPATCHED'`,
        [tip, deliveryId]
      );

      await conn.query(
        `UPDATE customer_orders
         SET status = 'SERVED', tip_amount = ?, satisfaction_score = 4.75, fulfilled_at = UTC_TIMESTAMP()
         WHERE id = ?`,
        [tip, Number(del.orderId)]
      );

      await conn.query(`UPDATE delivery_vehicles SET status = 'IDLE' WHERE id = ?`, [
        Number(del.vehicleId),
      ]);

      const totalPayment = Number(
        (Number(del.orderTotal) + Number(del.deliveryFee) + tip).toFixed(2)
      );
      await this.economyService.recordCashTransaction(conn, {
        playerId,
        businessId: Number(del.restaurantBusinessId),
        transactionType: 'REVENUE',
        category: 'DELIVERY_CHARGE',
        amount: totalPayment,
        isCredit: true,
        referenceId: `delivery_complete_${deliveryId}`,
        description: `Delivery #${deliveryId} completed (incl. $${Number(del.deliveryFee).toFixed(2)} fee & $${tip.toFixed(2)} tip)`,
      });
    }

    if (arrived.length > 0) {
      const [progRows] = await conn.query<RowDataPacket[]>(
        `SELECT xp_level AS xpLevel, current_xp AS currentXp
         FROM player_progression WHERE player_id = ? FOR UPDATE`,
        [playerId]
      );
      if (progRows[0]) {
        const nextProg = applyXpGain(
          Number(progRows[0].xpLevel),
          Number(progRows[0].currentXp),
          arrived.length * 15
        );
        await conn.query(
          `UPDATE player_progression
           SET xp_level = ?, current_xp = ?, total_deliveries_completed = total_deliveries_completed + ?
           WHERE player_id = ?`,
          [nextProg.xpLevel, nextProg.currentXp, arrived.length, playerId]
        );
      }
    }

    return arrived.length;
  }

  async getDashboard(playerId: number): Promise<DeliveryDashboardDTO> {
    await withTransaction(async (conn) => {
      await this.settleArrivedDeliveries(conn, playerId);
    });
    return this.deliveryRepo.getDeliveryDashboard(playerId);
  }

  async buyVehicle(
    playerId: number,
    vehicleType: VehicleType,
    name: string
  ): Promise<DeliveryDashboardDTO> {
    const bp = VEHICLE_BLUEPRINTS[vehicleType];
    if (!bp) throw new AppError('Invalid vehicle type', 400, 'INVALID_VEHICLE_TYPE');

    await withTransaction(async (conn) => {
      const hubId = await this.ensureDeliveryHubBusiness(conn, playerId);

      await this.economyService.recordCashTransaction(conn, {
        playerId,
        businessId: hubId,
        transactionType: 'CAPEX',
        category: 'CONSTRUCTION',
        amount: bp.purchaseCost,
        isCredit: false,
        description: `Purchased ${bp.label}: ${name}`,
      });

      await conn.query(
        `INSERT INTO delivery_vehicles
           (player_id, business_id, vehicle_type, name, capacity, speed_multiplier, upgrade_level, hourly_maintenance, status)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?, 'IDLE')`,
        [
          playerId,
          hubId,
          vehicleType,
          name.trim(),
          bp.capacity,
          bp.speedMultiplier,
          bp.hourlyMaintenance,
        ]
      );
    });

    return this.deliveryRepo.getDeliveryDashboard(playerId);
  }

  async upgradeVehicle(playerId: number, vehicleId: number): Promise<DeliveryDashboardDTO> {
    await withTransaction(async (conn) => {
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT id, business_id AS businessId, vehicle_type AS vehicleType, upgrade_level AS upgradeLevel
         FROM delivery_vehicles WHERE id = ? AND player_id = ? AND deleted_at IS NULL FOR UPDATE`,
        [vehicleId, playerId]
      );
      const veh = rows[0];
      if (!veh) throw new NotFoundError('Delivery vehicle not found');

      const bp = VEHICLE_BLUEPRINTS[veh.vehicleType as VehicleType];
      const currentLv = Number(veh.upgradeLevel);
      const cost = calculateVehicleUpgradeCost(bp.purchaseCost, currentLv);

      await this.economyService.recordCashTransaction(conn, {
        playerId,
        businessId: Number(veh.businessId),
        transactionType: 'CAPEX',
        category: 'UPGRADE',
        amount: cost,
        isCredit: false,
        description: `Upgraded ${bp.label} to Lv ${currentLv + 1}`,
      });

      await conn.query(
        `UPDATE delivery_vehicles
         SET upgrade_level = upgrade_level + 1,
             speed_multiplier = speed_multiplier + 0.20,
             capacity = capacity + 1
         WHERE id = ?`,
        [vehicleId]
      );
    });

    return this.deliveryRepo.getDeliveryDashboard(playerId);
  }

  /**
   * Executes full workflow:
   * Customer order -> Pizza preparation/check -> Packaging -> Delivery assignment -> Transit
   */
  async dispatchDeliveryOrder(
    playerId: number,
    input: {
      restaurantId: number;
      itemId: number;
      quantity: number;
      zoneId: number;
      vehicleId: number;
      driverEmployeeId?: number;
    }
  ): Promise<DeliveryDashboardDTO> {
    await withTransaction(async (conn) => {
      await this.settleArrivedDeliveries(conn, playerId);

      // 1. Validate restaurant & menu item
      const [restRows] = await conn.query<RowDataPacket[]>(
        `SELECT r.id, r.business_id AS businessId, rm.custom_price AS unitPrice
         FROM restaurants r
         INNER JOIN restaurant_menus rm ON rm.restaurant_id = r.id AND rm.item_id = ?
         WHERE r.id = ? AND r.player_id = ? AND r.deleted_at IS NULL
         LIMIT 1`,
        [input.itemId, input.restaurantId, playerId]
      );
      const rest = restRows[0];
      if (!rest) throw new NotFoundError('Restaurant or menu pizza not found');
      const businessId = Number(rest.businessId);
      const unitPrice = Number(rest.unitPrice);

      // 2. Validate vehicle availability & capacity
      const [vehRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, capacity, speed_multiplier AS speedMultiplier, status
         FROM delivery_vehicles
         WHERE id = ? AND player_id = ? AND deleted_at IS NULL
         FOR UPDATE`,
        [input.vehicleId, playerId]
      );
      const veh = vehRows[0];
      if (!veh) throw new NotFoundError('Delivery vehicle not found');
      if (veh.status !== 'IDLE') throw new ConflictError('Selected vehicle is currently on route');
      if (input.quantity > Number(veh.capacity)) {
        throw new AppError(
          `Order quantity (${input.quantity}) exceeds vehicle capacity (${veh.capacity})`,
          422,
          'CAPACITY_EXCEEDED'
        );
      }

      // 3. Validate zone
      const [zoneRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, distance_km AS distanceKm, base_delivery_charge AS deliveryCharge
         FROM delivery_zones WHERE id = ? LIMIT 1`,
        [input.zoneId]
      );
      const zone = zoneRows[0];
      if (!zone) throw new NotFoundError('Delivery zone not found');

      // 4. Optional driver productivity
      let driverProd = 1.0;
      if (input.driverEmployeeId) {
        const [drvRows] = await conn.query<RowDataPacket[]>(
          `SELECT skill_level AS skillLevel, happiness, hourly_wage AS hourlyWage, is_shift_lead AS isShiftLead
           FROM employees WHERE id = ? AND player_id = ? AND deleted_at IS NULL LIMIT 1`,
          [input.driverEmployeeId, playerId]
        );
        if (!drvRows[0]) throw new NotFoundError('Driver employee not found');
        driverProd = this.economyService.calculateEmployeeProductivity({
          skillLevel: Number(drvRows[0].skillLevel),
          happiness: Number(drvRows[0].happiness),
          hourlyWage: Number(drvRows[0].hourlyWage),
          isShiftLead: Boolean(drvRows[0].isShiftLead),
        });
      }

      // 5. Deduct finished pizza inventory (and packaging box if present)
      await this.inventoryService.applyStockMutation(conn, {
        playerId,
        businessId,
        itemId: input.itemId,
        quantityDelta: -input.quantity,
        reservedDelta: 0,
        transactionType: 'WITHDRAW',
        notes: `Packaged & dispatched ${input.quantity}x pizzas for delivery`,
      });

      const [custRows] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM customers ORDER BY id ASC LIMIT 1`
      );
      const customerId = Number(custRows[0]?.id ?? 1);
      const orderTotal = Number((unitPrice * input.quantity).toFixed(2));

      const [orderRes] = await conn.query<ResultSetHeader>(
        `INSERT INTO customer_orders
           (player_id, restaurant_id, customer_id, item_id, order_channel, quantity, unit_price, total_amount, status)
         VALUES (?, ?, ?, ?, 'DELIVERY', ?, ?, ?, 'READY_FOR_DELIVERY')`,
        [
          playerId,
          input.restaurantId,
          customerId,
          input.itemId,
          input.quantity,
          unitPrice,
          orderTotal,
        ]
      );

      const durationSec = calculateDeliveryDurationSeconds({
        distanceKm: Number(zone.distanceKm),
        vehicleSpeedMultiplier: Number(veh.speedMultiplier),
        driverProductivity: driverProd,
      });

      const now = new Date();
      const etaAt = new Date(now.getTime() + durationSec * 1000);

      await conn.query(
        `INSERT INTO deliveries
           (player_id, customer_order_id, vehicle_id, driver_employee_id, zone_id, delivery_fee, status, dispatched_at, eta_at)
         VALUES (?, ?, ?, ?, ?, ?, 'DISPATCHED', ?, ?)`,
        [
          playerId,
          orderRes.insertId,
          input.vehicleId,
          input.driverEmployeeId ?? null,
          input.zoneId,
          Number(zone.deliveryCharge),
          now,
          etaAt,
        ]
      );

      await conn.query(`UPDATE delivery_vehicles SET status = 'ON_ROUTE' WHERE id = ?`, [
        input.vehicleId,
      ]);
    });

    return this.deliveryRepo.getDeliveryDashboard(playerId);
  }
}
