export type MallTier = 'BOUTIQUE_PLAZA' | 'CITY_GALLERIA' | 'MEGA_MALL';

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

export interface MallsDashboardData {
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
