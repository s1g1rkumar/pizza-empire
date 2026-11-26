import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { withTransaction } from '../database/pool';
import { MallRepository, MallsDashboardDTO } from '../repositories/mall.repository';
import { AppError, ConflictError, NotFoundError } from '../utils/errors';
import {
  calculateMallFinancials,
  calculateMallLandCost,
  calculateMallVisitors,
  calculateParkingUpgradeCost,
  MALL_BLUEPRINTS,
  MALL_UNIT_BLUEPRINTS,
  MallTier,
  MallUnitType,
} from '../utils/mallCalculator';
import { EconomyService } from './economy.service';

export class MallService {
  private readonly mallRepo = new MallRepository();
  private readonly economyService = new EconomyService();

  async getDashboard(playerId: number): Promise<MallsDashboardDTO> {
    return this.mallRepo.getMallsDashboard(playerId);
  }

  async purchaseLand(
    playerId: number,
    locationId: number,
    parcelName: string,
    maxFloors: number
  ): Promise<MallsDashboardDTO> {
    await withTransaction(async (conn) => {
      const [locRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, name, rent_multiplier AS rentMultiplier FROM locations WHERE id = ? LIMIT 1`,
        [locationId]
      );
      const loc = locRows[0];
      if (!loc) throw new NotFoundError('Location not found');

      const price = calculateMallLandCost(Number(loc.rentMultiplier ?? 1), maxFloors);
      const sizeSqft = maxFloors * 15000;

      await this.economyService.recordCashTransaction(conn, {
        playerId,
        transactionType: 'CAPEX',
        category: 'CONSTRUCTION',
        amount: price,
        isCredit: false,
        description: `Purchased commercial mall land "${parcelName}" in ${String(loc.name)}`,
      });

      await conn.query(
        `INSERT INTO mall_lands (player_id, location_id, parcel_name, size_sqft, max_floors, purchase_price, is_developed)
         VALUES (?, ?, ?, ?, ?, ?, 0)`,
        [playerId, locationId, parcelName.trim(), sizeSqft, maxFloors, price]
      );
    });

    return this.mallRepo.getMallsDashboard(playerId);
  }

  async constructMall(
    playerId: number,
    mallLandId: number,
    name: string,
    mallTier: MallTier
  ): Promise<MallsDashboardDTO> {
    const blueprint = MALL_BLUEPRINTS[mallTier];
    if (!blueprint) throw new AppError('Invalid mall tier', 400, 'INVALID_MALL_TIER');

    await withTransaction(async (conn) => {
      const [landRows] = await conn.query<RowDataPacket[]>(
        `SELECT ml.id, ml.location_id AS locationId, ml.max_floors AS maxFloors, ml.is_developed AS isDeveloped,
                l.rent_multiplier AS rentMultiplier, l.demand_multiplier AS demandMultiplier
         FROM mall_lands ml
         INNER JOIN locations l ON l.id = ml.location_id
         WHERE ml.id = ? AND ml.player_id = ?
         FOR UPDATE`,
        [mallLandId, playerId]
      );
      const land = landRows[0];
      if (!land) throw new NotFoundError('Commercial land parcel not found');
      if (land.isDeveloped) {
        throw new ConflictError('A shopping mall has already been constructed on this land');
      }

      await this.economyService.recordCashTransaction(conn, {
        playerId,
        transactionType: 'CAPEX',
        category: 'CONSTRUCTION',
        amount: blueprint.constructionCost,
        isCredit: false,
        description: `Constructed ${blueprint.label}: ${name}`,
      });

      const hourlyUpkeep = Number(
        (blueprint.baseHourlyUpkeep * Number(land.rentMultiplier ?? 1)).toFixed(2)
      );
      const [bizRes] = await conn.query<ResultSetHeader>(
        `INSERT INTO businesses (player_id, location_id, business_type, name, storage_capacity, hourly_upkeep, max_employees)
         VALUES (?, ?, 'MALL', ?, 500, ?, 100)`,
        [playerId, Number(land.locationId), name.trim(), hourlyUpkeep]
      );

      const initialFloors = Math.min(blueprint.initialFloors, Number(land.maxFloors));
      const initialVisitors = calculateMallVisitors({
        tier: mallTier,
        locationDemandMultiplier: Number(land.demandMultiplier ?? 1),
        floorsCount: initialFloors,
        parkingSpaces: blueprint.initialParkingSpaces,
        unitTypes: [],
      });

      await conn.query(
        `INSERT INTO malls
           (player_id, business_id, mall_land_id, mall_tier, floors_count, shops_per_floor, parking_spaces, parking_level, daily_visitors)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        [
          playerId,
          bizRes.insertId,
          mallLandId,
          mallTier,
          initialFloors,
          blueprint.shopsPerFloor,
          blueprint.initialParkingSpaces,
          initialVisitors,
        ]
      );

      await conn.query(`UPDATE mall_lands SET is_developed = 1 WHERE id = ?`, [mallLandId]);
    });

    return this.mallRepo.getMallsDashboard(playerId);
  }

  async addFloor(playerId: number, mallId: number): Promise<MallsDashboardDTO> {
    await withTransaction(async (conn) => {
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT m.id, m.business_id AS businessId, m.mall_tier AS mallTier,
                m.floors_count AS floorsCount, ml.max_floors AS maxFloors
         FROM malls m
         INNER JOIN mall_lands ml ON ml.id = m.mall_land_id
         WHERE m.id = ? AND m.player_id = ? AND m.deleted_at IS NULL
         FOR UPDATE`,
        [mallId, playerId]
      );
      const mall = rows[0];
      if (!mall) throw new NotFoundError('Shopping mall not found');

      const currentFloors = Number(mall.floorsCount);
      const maxFloors = Number(mall.maxFloors);
      if (currentFloors >= maxFloors) {
        throw new ConflictError(
          `Maximum zoning limit (${maxFloors} floors) reached for this parcel`
        );
      }

      const blueprint = MALL_BLUEPRINTS[mall.mallTier as MallTier];
      const cost = Math.round(blueprint.floorBuildCost * (1 + (currentFloors - 1) * 0.2));

      await this.economyService.recordCashTransaction(conn, {
        playerId,
        businessId: Number(mall.businessId),
        transactionType: 'CAPEX',
        category: 'CONSTRUCTION',
        amount: cost,
        isCredit: false,
        description: `Built floor #${currentFloors + 1} for shopping mall`,
      });

      await conn.query(`UPDATE malls SET floors_count = floors_count + 1 WHERE id = ?`, [mallId]);
      await conn.query(`UPDATE businesses SET hourly_upkeep = hourly_upkeep + 20 WHERE id = ?`, [
        Number(mall.businessId),
      ]);
    });

    return this.mallRepo.getMallsDashboard(playerId);
  }

  async upgradeParking(playerId: number, mallId: number): Promise<MallsDashboardDTO> {
    await withTransaction(async (conn) => {
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT id, business_id AS businessId, parking_level AS parkingLevel
         FROM malls WHERE id = ? AND player_id = ? AND deleted_at IS NULL FOR UPDATE`,
        [mallId, playerId]
      );
      const mall = rows[0];
      if (!mall) throw new NotFoundError('Shopping mall not found');

      const currentLevel = Number(mall.parkingLevel);
      if (currentLevel >= 10) {
        throw new ConflictError('Parking structure is already at maximum level');
      }

      const cost = calculateParkingUpgradeCost(currentLevel);
      await this.economyService.recordCashTransaction(conn, {
        playerId,
        businessId: Number(mall.businessId),
        transactionType: 'CAPEX',
        category: 'UPGRADE',
        amount: cost,
        isCredit: false,
        description: `Expanded mall parking (+50 spaces, level ${currentLevel + 1})`,
      });

      await conn.query(
        `UPDATE malls
         SET parking_level = parking_level + 1,
             parking_spaces = parking_spaces + 50
         WHERE id = ?`,
        [mallId]
      );
    });

    return this.mallRepo.getMallsDashboard(playerId);
  }

  async createUnit(
    playerId: number,
    mallId: number,
    floorNumber: number,
    unitType: MallUnitType,
    unitName: string,
    occupancyStatus: 'VACANT' | 'LEASED' | 'SELF_OPERATED',
    tenantName?: string,
    monthlyRent?: number
  ): Promise<MallsDashboardDTO> {
    const unitBp = MALL_UNIT_BLUEPRINTS[unitType];
    if (!unitBp) throw new AppError('Invalid mall unit type', 400, 'INVALID_UNIT_TYPE');

    await withTransaction(async (conn) => {
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT id, business_id AS businessId, floors_count AS floorsCount, shops_per_floor AS shopsPerFloor
         FROM malls WHERE id = ? AND player_id = ? AND deleted_at IS NULL FOR UPDATE`,
        [mallId, playerId]
      );
      const mall = rows[0];
      if (!mall) throw new NotFoundError('Shopping mall not found');

      if (floorNumber < 1 || floorNumber > Number(mall.floorsCount)) {
        throw new AppError(
          `Floor ${floorNumber} has not been constructed yet`,
          422,
          'INVALID_FLOOR'
        );
      }

      const [countRows] = await conn.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS cnt FROM mall_units WHERE mall_id = ? AND floor_number = ?`,
        [mallId, floorNumber]
      );
      if (Number(countRows[0]?.cnt ?? 0) >= Number(mall.shopsPerFloor)) {
        throw new ConflictError(
          `Floor ${floorNumber} is full (${mall.shopsPerFloor} units max). Build another floor first.`
        );
      }

      await this.economyService.recordCashTransaction(conn, {
        playerId,
        businessId: Number(mall.businessId),
        transactionType: 'CAPEX',
        category: 'CONSTRUCTION',
        amount: unitBp.buildCost,
        isCredit: false,
        description: `Built ${unitBp.label} "${unitName}" on floor ${floorNumber}`,
      });

      const resolvedRent =
        occupancyStatus === 'LEASED'
          ? Number(
              (monthlyRent && monthlyRent > 0 ? monthlyRent : unitBp.suggestedMonthlyRent).toFixed(
                2
              )
            )
          : 0;
      const resolvedTenant =
        occupancyStatus === 'LEASED'
          ? tenantName?.trim() || 'Independent Tenant'
          : occupancyStatus === 'SELF_OPERATED'
            ? 'Pizza Empire Flagship'
            : null;

      await conn.query(
        `INSERT INTO mall_units
           (player_id, mall_id, floor_number, unit_type, unit_name, occupancy_status, tenant_name, monthly_rent, lease_months, operating_cost_hourly)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 12, ?)`,
        [
          playerId,
          mallId,
          floorNumber,
          unitType,
          unitName.trim(),
          occupancyStatus,
          resolvedTenant,
          resolvedRent,
          unitBp.hourlyOperatingCost,
        ]
      );
    });

    return this.mallRepo.getMallsDashboard(playerId);
  }

  async updateLease(
    playerId: number,
    mallId: number,
    unitId: number,
    occupancyStatus: 'VACANT' | 'LEASED' | 'SELF_OPERATED',
    tenantName: string | null,
    monthlyRent: number,
    leaseMonths: number
  ): Promise<MallsDashboardDTO> {
    await withTransaction(async (conn) => {
      const [res] = await conn.query<ResultSetHeader>(
        `UPDATE mall_units
         SET occupancy_status = ?,
             tenant_name = ?,
             monthly_rent = ?,
             lease_months = ?
         WHERE id = ? AND mall_id = ? AND player_id = ?`,
        [
          occupancyStatus,
          occupancyStatus === 'VACANT' ? null : tenantName?.trim() || 'Commercial Tenant',
          occupancyStatus === 'LEASED' ? monthlyRent : 0,
          leaseMonths,
          unitId,
          mallId,
          playerId,
        ]
      );
      if (res.affectedRows === 0) {
        throw new NotFoundError('Mall unit not found');
      }
    });

    return this.mallRepo.getMallsDashboard(playerId);
  }

  async collectRentAndRevenue(playerId: number, mallId: number): Promise<MallsDashboardDTO> {
    await withTransaction(async (conn) => {
      const [mallRows] = await conn.query<RowDataPacket[]>(
        `SELECT m.id, m.business_id AS businessId, m.mall_tier AS mallTier,
                m.floors_count AS floorsCount, m.parking_spaces AS parkingSpaces,
                b.hourly_upkeep AS baseHourlyUpkeep, l.demand_multiplier AS locationDemandMultiplier
         FROM malls m
         INNER JOIN businesses b ON b.id = m.business_id
         INNER JOIN locations l ON l.id = b.location_id
         WHERE m.id = ? AND m.player_id = ? AND m.deleted_at IS NULL
         FOR UPDATE`,
        [mallId, playerId]
      );
      const mall = mallRows[0];
      if (!mall) throw new NotFoundError('Shopping mall not found');

      const [unitRows] = await conn.query<RowDataPacket[]>(
        `SELECT unit_type AS unitType, occupancy_status AS occupancyStatus,
                monthly_rent AS monthlyRent, operating_cost_hourly AS operatingCostHourly
         FROM mall_units WHERE mall_id = ? AND player_id = ?`,
        [mallId, playerId]
      );

      const units = unitRows.map((u) => ({
        unitType: String(u.unitType),
        occupancyStatus: String(u.occupancyStatus),
        monthlyRent: Number(u.monthlyRent),
        operatingCostHourly: Number(u.operatingCostHourly),
      }));

      const dailyVisitors = calculateMallVisitors({
        tier: mall.mallTier as MallTier,
        locationDemandMultiplier: Number(mall.locationDemandMultiplier ?? 1),
        floorsCount: Number(mall.floorsCount),
        parkingSpaces: Number(mall.parkingSpaces),
        unitTypes: units.map((u) => u.unitType),
      });

      const financials = calculateMallFinancials({
        dailyVisitors,
        parkingSpaces: Number(mall.parkingSpaces),
        baseHourlyUpkeep: Number(mall.baseHourlyUpkeep),
        units,
      });

      const grossIncome = Number(
        (financials.dailyRentalIncome + financials.dailyVisitorIncome).toFixed(2)
      );
      if (grossIncome <= 0) {
        throw new ConflictError('No rental or visitor income to collect yet.');
      }

      await this.economyService.recordCashTransaction(conn, {
        playerId,
        businessId: Number(mall.businessId),
        transactionType: 'REVENUE',
        category: 'MALL_RENTAL',
        amount: grossIncome,
        isCredit: true,
        description: `Collected mall rent ($${financials.dailyRentalIncome}) & visitor revenue ($${financials.dailyVisitorIncome})`,
      });

      await conn.query(
        `UPDATE malls
         SET daily_visitors = ?,
             total_rental_income = total_rental_income + ?,
             last_collected_at = UTC_TIMESTAMP()
         WHERE id = ?`,
        [dailyVisitors, grossIncome, mallId]
      );
    });

    return this.mallRepo.getMallsDashboard(playerId);
  }
}
