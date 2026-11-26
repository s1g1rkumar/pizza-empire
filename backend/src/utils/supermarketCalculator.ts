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

export const SUPERMARKET_BLUEPRINTS: Record<SupermarketTier, SupermarketBlueprint> = {
  MINI_MART: {
    tier: 'MINI_MART',
    label: 'Neighborhood Mini-Mart',
    description: 'Compact grocery store for fresh crops, sauces, and retail staples.',
    constructionCost: 6500,
    storageCapacity: 400,
    hourlyUpkeep: 32,
    baseDemand: 18,
    initialCheckoutLanes: 2,
  },
  SUPERMARKET: {
    tier: 'SUPERMARKET',
    label: 'Full-Service Supermarket',
    description: 'Multi-aisle grocery store ideal for selling factory goods at scale.',
    constructionCost: 18000,
    storageCapacity: 900,
    hourlyUpkeep: 72,
    baseDemand: 38,
    initialCheckoutLanes: 4,
  },
  HYPERMARKET: {
    tier: 'HYPERMARKET',
    label: 'Mega Hypermarket',
    description: 'High-volume retail anchor with maximum shelf throughput and cold storage.',
    constructionCost: 42000,
    storageCapacity: 2000,
    hourlyUpkeep: 145,
    baseDemand: 75,
    initialCheckoutLanes: 8,
  },
};

export const SUPERMARKET_UPGRADE_CONFIG: Record<
  SupermarketUpgradeType,
  { label: string; baseCost: number; maxLevel: number; description: string }
> = {
  AISLES: {
    label: 'Expanded Aisles',
    baseCost: 1400,
    maxLevel: 10,
    description: '+12% product visibility and customer demand per level.',
  },
  CHECKOUT_LANES: {
    label: 'Checkout Lanes',
    baseCost: 1800,
    maxLevel: 12,
    description: '+10% customer throughput and faster checkout capacity.',
  },
  COLD_STORAGE: {
    label: 'Cold Storage',
    baseCost: 1600,
    maxLevel: 10,
    description: '+8% demand for chilled dairy, veggies, and frozen pizza goods.',
  },
  DECOR: {
    label: 'Store Interior',
    baseCost: 1200,
    maxLevel: 10,
    description: '+6% shopper conversion and willingness to pay.',
  },
  STORAGE: {
    label: 'Backroom Warehouse',
    baseCost: 1500,
    maxLevel: 15,
    description: 'Adds +300 inventory storage capacity to the supermarket.',
  },
};

export function calculateSupermarketUpgradeCost(
  upgradeType: SupermarketUpgradeType,
  currentLevel: number
): number {
  const cfg = SUPERMARKET_UPGRADE_CONFIG[upgradeType];
  return Math.round(cfg.baseCost * Math.pow(1.38, Math.max(0, currentLevel - 1)));
}

export interface SupermarketDemandInput {
  tier: SupermarketTier;
  locationDemandMultiplier: number;
  priceElasticity: number;
  baseRetailPrice: number;
  customPrice: number;
  aisleLevel: number;
  checkoutLanes: number;
  coldStorageLevel: number;
  decorLevel: number;
  employeeProductivity: number;
  availableStock: number;
}

export function calculateSupermarketDemand(input: SupermarketDemandInput): number {
  if (input.availableStock <= 0 || input.customPrice <= 0) {
    return 0;
  }

  const blueprint = SUPERMARKET_BLUEPRINTS[input.tier] ?? SUPERMARKET_BLUEPRINTS.MINI_MART;
  const priceRatio = Math.max(0.4, input.baseRetailPrice / input.customPrice);
  const elasticityFactor = Math.pow(priceRatio, Math.max(0.5, input.priceElasticity));

  const aisleBonus = 1 + (Math.max(1, input.aisleLevel) - 1) * 0.12;
  const laneBonus = 1 + Math.max(0, input.checkoutLanes - 1) * 0.08;
  const coldBonus = 1 + (Math.max(1, input.coldStorageLevel) - 1) * 0.08;
  const decorBonus = 1 + (Math.max(1, input.decorLevel) - 1) * 0.06;
  const staffBonus = 1 + Math.min(2.5, Math.max(0, input.employeeProductivity) * 0.15);

  const rawDemand =
    (blueprint.baseDemand / 4) *
    Math.max(0.5, input.locationDemandMultiplier) *
    elasticityFactor *
    aisleBonus *
    laneBonus *
    coldBonus *
    decorBonus *
    staffBonus;

  return Math.max(1, Math.min(input.availableStock, Math.round(rawDemand)));
}

export function calculateSupermarketProfit(params: {
  dailyRevenue: number;
  dailyCogs: number;
  hourlyUpkeep: number;
  employeeHourlyPayroll: number;
}): {
  dailyExpenses: number;
  netProfit: number;
} {
  const dailyOperating = (params.hourlyUpkeep + params.employeeHourlyPayroll) * 24;
  const dailyExpenses = Number((params.dailyCogs + dailyOperating).toFixed(2));
  const netProfit = Number((params.dailyRevenue - dailyExpenses).toFixed(2));
  return { dailyExpenses, netProfit };
}
