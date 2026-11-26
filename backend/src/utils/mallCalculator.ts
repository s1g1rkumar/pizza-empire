export type MallTier = 'BOUTIQUE_PLAZA' | 'CITY_GALLERIA' | 'MEGA_MALL';

/**
 * Modular unit type registry so new mall business types can be added
 * by registering a new blueprint entry without changing core mall logic.
 */
export type MallUnitType =
  'RETAIL_SHOP' | 'FOOD_COURT' | 'SUPERMARKET' | 'RESTAURANT' | 'ENTERTAINMENT_ZONE';

export interface MallBlueprint {
  tier: MallTier;
  label: string;
  description: string;
  constructionCost: number;
  initialFloors: number;
  shopsPerFloor: number;
  initialParkingSpaces: number;
  baseVisitors: number;
  baseHourlyUpkeep: number;
  floorBuildCost: number;
}

export interface MallUnitBlueprint {
  unitType: MallUnitType;
  label: string;
  description: string;
  buildCost: number;
  suggestedMonthlyRent: number;
  visitorBoost: number;
  hourlyOperatingCost: number;
  visitorRevenuePer100: number;
}

export const MALL_BLUEPRINTS: Record<MallTier, MallBlueprint> = {
  BOUTIQUE_PLAZA: {
    tier: 'BOUTIQUE_PLAZA',
    label: 'Boutique Plaza',
    description: 'Neighborhood 2-story retail plaza with cozy dining and shops.',
    constructionCost: 35000,
    initialFloors: 1,
    shopsPerFloor: 4,
    initialParkingSpaces: 60,
    baseVisitors: 450,
    baseHourlyUpkeep: 55,
    floorBuildCost: 16000,
  },
  CITY_GALLERIA: {
    tier: 'CITY_GALLERIA',
    label: 'City Galleria',
    description: 'Multi-floor urban shopping center with food courts and anchor stores.',
    constructionCost: 85000,
    initialFloors: 2,
    shopsPerFloor: 6,
    initialParkingSpaces: 140,
    baseVisitors: 1100,
    baseHourlyUpkeep: 120,
    floorBuildCost: 28000,
  },
  MEGA_MALL: {
    tier: 'MEGA_MALL',
    label: 'Mega Empire Mall',
    description: 'Flagship destination mall with entertainment zones and massive footfall.',
    constructionCost: 190000,
    initialFloors: 3,
    shopsPerFloor: 8,
    initialParkingSpaces: 300,
    baseVisitors: 2500,
    baseHourlyUpkeep: 240,
    floorBuildCost: 48000,
  },
};

export const MALL_UNIT_BLUEPRINTS: Record<MallUnitType, MallUnitBlueprint> = {
  RETAIL_SHOP: {
    unitType: 'RETAIL_SHOP',
    label: 'Retail Boutique',
    description: 'Apparel, lifestyle, and specialty retail storefront.',
    buildCost: 4500,
    suggestedMonthlyRent: 2800,
    visitorBoost: 85,
    hourlyOperatingCost: 4,
    visitorRevenuePer100: 1.5,
  },
  FOOD_COURT: {
    unitType: 'FOOD_COURT',
    label: 'Food Court',
    description: 'High-traffic multi-vendor dining hall that keeps shoppers longer.',
    buildCost: 9000,
    suggestedMonthlyRent: 5200,
    visitorBoost: 240,
    hourlyOperatingCost: 9,
    visitorRevenuePer100: 4.5,
  },
  SUPERMARKET: {
    unitType: 'SUPERMARKET',
    label: 'Anchor Supermarket',
    description: 'Full grocery anchor driving steady daily repeat foot traffic.',
    buildCost: 14000,
    suggestedMonthlyRent: 7500,
    visitorBoost: 360,
    hourlyOperatingCost: 12,
    visitorRevenuePer100: 5.0,
  },
  RESTAURANT: {
    unitType: 'RESTAURANT',
    label: 'Sit-Down Restaurant',
    description: 'Signature dining venue with strong evening and weekend draw.',
    buildCost: 11000,
    suggestedMonthlyRent: 6000,
    visitorBoost: 210,
    hourlyOperatingCost: 10,
    visitorRevenuePer100: 4.0,
  },
  ENTERTAINMENT_ZONE: {
    unitType: 'ENTERTAINMENT_ZONE',
    label: 'Entertainment Zone',
    description: 'Cinema, arcade, and family attraction maximizing mall visitors.',
    buildCost: 18000,
    suggestedMonthlyRent: 9200,
    visitorBoost: 520,
    hourlyOperatingCost: 16,
    visitorRevenuePer100: 8.5,
  },
};

export function calculateMallLandCost(rentMultiplier: number, maxFloors: number): number {
  return Math.round(18000 * Math.max(0.8, rentMultiplier) * (1 + (maxFloors - 2) * 0.25));
}

export function calculateParkingUpgradeCost(currentLevel: number): number {
  return Math.round(4000 * Math.pow(1.42, Math.max(0, currentLevel - 1)));
}

export function calculateMallVisitors(params: {
  tier: MallTier;
  locationDemandMultiplier: number;
  floorsCount: number;
  parkingSpaces: number;
  unitTypes: string[];
}): number {
  const blueprint = MALL_BLUEPRINTS[params.tier] ?? MALL_BLUEPRINTS.BOUTIQUE_PLAZA;
  const unitBoost = params.unitTypes.reduce((sum, t) => {
    const unitBp = MALL_UNIT_BLUEPRINTS[t as MallUnitType];
    return sum + (unitBp ? unitBp.visitorBoost : 80);
  }, 0);

  const floorBonus = 1 + Math.max(0, params.floorsCount - 1) * 0.14;
  const parkingBonus = 1 + Math.min(1.2, params.parkingSpaces / 400);

  return Math.round(
    (blueprint.baseVisitors + unitBoost) *
      Math.max(0.6, params.locationDemandMultiplier) *
      floorBonus *
      parkingBonus
  );
}

export function calculateMallFinancials(params: {
  dailyVisitors: number;
  parkingSpaces: number;
  baseHourlyUpkeep: number;
  units: Array<{
    unitType: string;
    occupancyStatus: string;
    monthlyRent: number;
    operatingCostHourly: number;
  }>;
}): {
  dailyRentalIncome: number;
  dailyVisitorIncome: number;
  dailyOperatingExpenses: number;
  dailyNetProfit: number;
} {
  let dailyRentalIncome = 0;
  let dailyVisitorIncome = 0;
  let unitHourlyCost = 0;

  for (const unit of params.units) {
    unitHourlyCost += unit.operatingCostHourly;
    if (unit.occupancyStatus === 'LEASED') {
      dailyRentalIncome += unit.monthlyRent / 30;
    }
    const bp = MALL_UNIT_BLUEPRINTS[unit.unitType as MallUnitType];
    if (bp && unit.occupancyStatus !== 'VACANT') {
      dailyVisitorIncome += (params.dailyVisitors / 100) * (bp.visitorRevenuePer100 * 0.35);
    }
  }

  // Parking fees from visitors
  const parkingRevenue = Math.min(params.parkingSpaces * 3.5, params.dailyVisitors * 0.45);
  dailyVisitorIncome += parkingRevenue;

  const dailyOperatingExpenses = Number(
    ((params.baseHourlyUpkeep + unitHourlyCost) * 24).toFixed(2)
  );
  const roundedRental = Number(dailyRentalIncome.toFixed(2));
  const roundedVisitor = Number(dailyVisitorIncome.toFixed(2));
  const dailyNetProfit = Number(
    (roundedRental + roundedVisitor - dailyOperatingExpenses).toFixed(2)
  );

  return {
    dailyRentalIncome: roundedRental,
    dailyVisitorIncome: roundedVisitor,
    dailyOperatingExpenses,
    dailyNetProfit,
  };
}
