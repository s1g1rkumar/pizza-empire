import { RowDataPacket } from 'mysql2/promise';
import { dbPool } from '../database/pool';
import {
  calculateMallFinancials,
  calculateMallLandCost,
  calculateMallVisitors,
  calculateParkingUpgradeCost,
  MALL_BLUEPRINTS,
  MALL_UNIT_BLUEPRINTS,
  MallBlueprint,
  MallTier,
  MallUnitBlueprint,
} from '../utils/mallCalculator';

export interface MallLandDTO {
  id: number;
  locationId: number;
  locationName: string;
  districtType: string;
  parcelName: string;
  sizeSqft: number;
  maxFloors: number;
  purchasePrice: number;
  isDeveloped: boolean;
}

export interface MallUnitDTO {
  id: number;
  floorNumber: number;
  unitType: string;
  typeLabel: string;
  unitName: string;
  occupancyStatus: 'VACANT' | 'LEASED' | 'SELF_OPERATED';
  tenantName: string | null;
  monthlyRent: number;
  leaseMonths: number;
  operatingCostHourly: number;
}

export interface MallDetailDTO {
  id: number;
  businessId: number;
  mallLandId: number;
  name: string;
  mallTier: MallTier;
  tierLabel: string;
  locationName: string;
  districtType: string;
  locationDemandMultiplier: number;
  floorsCount: number;
  maxFloors: number;
  shopsPerFloor: number;
  totalCapacity: number;
  occupiedUnitsCount: number;
  parkingSpaces: number;
  parkingLevel: number;
  parkingUpgradeCost: number;
  nextFloorCost: number;
  dailyVisitors: number;
  dailyRentalIncome: number;
  dailyVisitorIncome: number;
  dailyOperatingExpenses: number;
  dailyNetProfit: number;
  totalRentalIncome: number;
  lastCollectedAt: string | null;
  units: MallUnitDTO[];
}

export interface MallsDashboardDTO {
  cashBalance: number;
  summary: {
    totalMalls: number;
    totalParcels: number;
    totalUnits: number;
    totalDailyVisitors: number;
    totalDailyNetProfit: number;
    totalRentalIncome: number;
  };
  blueprints: MallBlueprint[];
  unitBlueprints: MallUnitBlueprint[];
  locations: Array<{
    id: number;
    name: string;
    districtType: string;
    demandMultiplier: number;
    rentMultiplier: number;
    estimatedLandCost3Floors: number;
  }>;
  lands: MallLandDTO[];
  malls: MallDetailDTO[];
}

export class MallRepository {
  async getMallsDashboard(playerId: number): Promise<MallsDashboardDTO> {
    const [pRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT cash_balance AS cashBalance FROM player_profiles WHERE id = ? LIMIT 1`,
      [playerId]
    );
    const cashBalance = Number(pRows[0]?.cashBalance ?? 0);

    const [locRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT id, name, district_type AS districtType, demand_multiplier AS demandMultiplier, rent_multiplier AS rentMultiplier
       FROM locations ORDER BY id ASC`
    );

    const [landRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT ml.id, ml.location_id AS locationId, l.name AS locationName, l.district_type AS districtType,
              ml.parcel_name AS parcelName, ml.size_sqft AS sizeSqft, ml.max_floors AS maxFloors,
              ml.purchase_price AS purchasePrice, ml.is_developed AS isDeveloped
       FROM mall_lands ml
       INNER JOIN locations l ON l.id = ml.location_id
       WHERE ml.player_id = ?
       ORDER BY ml.id DESC`,
      [playerId]
    );

    const lands: MallLandDTO[] = landRows.map((l) => ({
      id: Number(l.id),
      locationId: Number(l.locationId),
      locationName: String(l.locationName),
      districtType: String(l.districtType),
      parcelName: String(l.parcelName),
      sizeSqft: Number(l.sizeSqft),
      maxFloors: Number(l.maxFloors),
      purchasePrice: Number(l.purchasePrice),
      isDeveloped: Boolean(l.isDeveloped),
    }));

    const [mallRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT m.id, m.business_id AS businessId, m.mall_land_id AS mallLandId, b.name,
              m.mall_tier AS mallTier, l.name AS locationName, l.district_type AS districtType,
              l.demand_multiplier AS locationDemandMultiplier, m.floors_count AS floorsCount,
              ml.max_floors AS maxFloors, m.shops_per_floor AS shopsPerFloor,
              m.parking_spaces AS parkingSpaces, m.parking_level AS parkingLevel,
              m.total_rental_income AS totalRentalIncome, m.last_collected_at AS lastCollectedAt,
              b.hourly_upkeep AS baseHourlyUpkeep
       FROM malls m
       INNER JOIN businesses b ON b.id = m.business_id
       INNER JOIN mall_lands ml ON ml.id = m.mall_land_id
       INNER JOIN locations l ON l.id = b.location_id
       WHERE m.player_id = ? AND m.deleted_at IS NULL AND b.deleted_at IS NULL
       ORDER BY m.id ASC`,
      [playerId]
    );

    const malls: MallDetailDTO[] = [];

    for (const m of mallRows) {
      const mallId = Number(m.id);
      const tier = m.mallTier as MallTier;
      const blueprint = MALL_BLUEPRINTS[tier] ?? MALL_BLUEPRINTS.BOUTIQUE_PLAZA;

      const [unitRows] = await dbPool.query<RowDataPacket[]>(
        `SELECT id, floor_number AS floorNumber, unit_type AS unitType, unit_name AS unitName,
                occupancy_status AS occupancyStatus, tenant_name AS tenantName,
                monthly_rent AS monthlyRent, lease_months AS leaseMonths,
                operating_cost_hourly AS operatingCostHourly
         FROM mall_units
         WHERE mall_id = ? AND player_id = ?
         ORDER BY floor_number ASC, id ASC`,
        [mallId, playerId]
      );

      const units: MallUnitDTO[] = unitRows.map((u) => {
        const uType = String(u.unitType);
        const unitBp = MALL_UNIT_BLUEPRINTS[uType as keyof typeof MALL_UNIT_BLUEPRINTS];
        return {
          id: Number(u.id),
          floorNumber: Number(u.floorNumber),
          unitType: uType,
          typeLabel: unitBp ? unitBp.label : uType,
          unitName: String(u.unitName),
          occupancyStatus: u.occupancyStatus as MallUnitDTO['occupancyStatus'],
          tenantName: u.tenantName ? String(u.tenantName) : null,
          monthlyRent: Number(u.monthlyRent),
          leaseMonths: Number(u.leaseMonths),
          operatingCostHourly: Number(u.operatingCostHourly),
        };
      });

      const floorsCount = Number(m.floorsCount);
      const shopsPerFloor = Number(m.shopsPerFloor);
      const parkingSpaces = Number(m.parkingSpaces);
      const parkingLevel = Number(m.parkingLevel);

      const dailyVisitors = calculateMallVisitors({
        tier,
        locationDemandMultiplier: Number(m.locationDemandMultiplier ?? 1),
        floorsCount,
        parkingSpaces,
        unitTypes: units.map((u) => u.unitType),
      });

      const financials = calculateMallFinancials({
        dailyVisitors,
        parkingSpaces,
        baseHourlyUpkeep: Number(m.baseHourlyUpkeep),
        units,
      });

      malls.push({
        id: mallId,
        businessId: Number(m.businessId),
        mallLandId: Number(m.mallLandId),
        name: String(m.name),
        mallTier: tier,
        tierLabel: blueprint.label,
        locationName: String(m.locationName),
        districtType: String(m.districtType),
        locationDemandMultiplier: Number(m.locationDemandMultiplier ?? 1),
        floorsCount,
        maxFloors: Number(m.maxFloors),
        shopsPerFloor,
        totalCapacity: floorsCount * shopsPerFloor,
        occupiedUnitsCount: units.length,
        parkingSpaces,
        parkingLevel,
        parkingUpgradeCost: calculateParkingUpgradeCost(parkingLevel),
        nextFloorCost: Math.round(blueprint.floorBuildCost * (1 + (floorsCount - 1) * 0.2)),
        dailyVisitors,
        dailyRentalIncome: financials.dailyRentalIncome,
        dailyVisitorIncome: financials.dailyVisitorIncome,
        dailyOperatingExpenses: financials.dailyOperatingExpenses,
        dailyNetProfit: financials.dailyNetProfit,
        totalRentalIncome: Number(m.totalRentalIncome),
        lastCollectedAt: m.lastCollectedAt ? new Date(m.lastCollectedAt).toISOString() : null,
        units,
      });
    }

    const summary = {
      totalMalls: malls.length,
      totalParcels: lands.length,
      totalUnits: malls.reduce((acc, m) => acc + m.occupiedUnitsCount, 0),
      totalDailyVisitors: malls.reduce((acc, m) => acc + m.dailyVisitors, 0),
      totalDailyNetProfit: Number(malls.reduce((acc, m) => acc + m.dailyNetProfit, 0).toFixed(2)),
      totalRentalIncome: Number(malls.reduce((acc, m) => acc + m.totalRentalIncome, 0).toFixed(2)),
    };

    return {
      cashBalance,
      summary,
      blueprints: Object.values(MALL_BLUEPRINTS),
      unitBlueprints: Object.values(MALL_UNIT_BLUEPRINTS),
      locations: locRows.map((l) => ({
        id: Number(l.id),
        name: String(l.name),
        districtType: String(l.districtType),
        demandMultiplier: Number(l.demandMultiplier),
        rentMultiplier: Number(l.rentMultiplier),
        estimatedLandCost3Floors: calculateMallLandCost(Number(l.rentMultiplier), 3),
      })),
      lands,
      malls,
    };
  }
}
