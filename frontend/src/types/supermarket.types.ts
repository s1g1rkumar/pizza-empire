export type SupermarketTier = 'MINI_MART' | 'SUPERMARKET' | 'HYPERMARKET';

export type SupermarketUpgradeType =
  'AISLES' | 'CHECKOUT_LANES' | 'COLD_STORAGE' | 'DECOR' | 'STORAGE';

export interface SupermarketBlueprint {
  tier: SupermarketTier;
  label: string;
  description: string;
  constructionCost: number;
  storageCapacity: number;
  hourlyUpkeep: number;
  baseDemand: number;
  initialCheckoutLanes: number;
}

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

export interface SupermarketsDashboardData {
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
  upgradeConfigs: Record<
    SupermarketUpgradeType,
    { label: string; baseCost: number; maxLevel: number; description: string }
  >;
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
