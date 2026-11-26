export type RestaurantType = 'SMALL_SHOP' | 'STANDARD' | 'PREMIUM' | 'FAMILY' | 'LUXURY';

export interface RestaurantBlueprint {
  type: RestaurantType;
  label: string;
  constructionCost: number;
  baseTables: number;
  baseOvens: number;
  hourlyUpkeep: number;
  storageCapacity: number;
  demandBonus: number;
}

export interface RestaurantMenuItem {
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

export interface RestaurantDetail {
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
  menu: RestaurantMenuItem[];
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

export interface RestaurantsDashboardData {
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
  restaurants: RestaurantDetail[];
}
