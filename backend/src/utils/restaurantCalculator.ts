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

export const RESTAURANT_BLUEPRINTS: Record<RestaurantType, RestaurantBlueprint> = {
  SMALL_SHOP: {
    type: 'SMALL_SHOP',
    label: 'Small Pizza Shop',
    constructionCost: 2500,
    baseTables: 2,
    baseOvens: 1,
    hourlyUpkeep: 15,
    storageCapacity: 150,
    demandBonus: 1.0,
  },
  STANDARD: {
    type: 'STANDARD',
    label: 'Standard Restaurant',
    constructionCost: 8000,
    baseTables: 5,
    baseOvens: 2,
    hourlyUpkeep: 35,
    storageCapacity: 300,
    demandBonus: 1.35,
  },
  PREMIUM: {
    type: 'PREMIUM',
    label: 'Premium Restaurant',
    constructionCost: 25000,
    baseTables: 8,
    baseOvens: 3,
    hourlyUpkeep: 75,
    storageCapacity: 500,
    demandBonus: 1.75,
  },
  FAMILY: {
    type: 'FAMILY',
    label: 'Family Restaurant',
    constructionCost: 45000,
    baseTables: 12,
    baseOvens: 4,
    hourlyUpkeep: 110,
    storageCapacity: 750,
    demandBonus: 2.1,
  },
  LUXURY: {
    type: 'LUXURY',
    label: 'Luxury Restaurant',
    constructionCost: 120000,
    baseTables: 16,
    baseOvens: 5,
    hourlyUpkeep: 240,
    storageCapacity: 1200,
    demandBonus: 2.8,
  },
};

/**
 * Calculates customer demand (orders per simulation cycle) based on
 * location, reputation, pizza availability, pricing, quality, and rating.
 */
export function calculateCustomerDemand(params: {
  diningTables: number;
  locationDemandMultiplier: number;
  reputation: number;
  avgRating: number;
  avgStarQuality: number;
  priceRatio: number; // customPrice / basePrice
  hasAvailablePizza: boolean;
  typeDemandBonus: number;
}): number {
  if (!params.hasAvailablePizza) {
    return 0;
  }

  const baseTraffic = params.diningTables * 1.5 * params.typeDemandBonus;
  const repFactor = 0.8 + Math.min(100, Math.max(0, params.reputation)) / 100;
  const ratingFactor = Math.max(0.4, params.avgRating / 4.0);
  const qualityFactor = 1 + (Math.max(1, params.avgStarQuality) - 1) * 0.12;

  // Price elasticity: discounts boost demand, overpricing (>1.15) drops demand sharply
  let priceFactor = 1.0;
  if (params.priceRatio < 1.0) {
    priceFactor = Math.min(1.35, 1 + (1 - params.priceRatio) * 0.8);
  } else if (params.priceRatio > 1.05) {
    priceFactor = Math.max(0.25, 1 - (params.priceRatio - 1.05) * 1.4);
  }

  const raw =
    baseTraffic *
    params.locationDemandMultiplier *
    repFactor *
    ratingFactor *
    qualityFactor *
    priceFactor;

  return Math.max(1, Math.round(raw));
}

/**
 * Computes customer satisfaction score (1.0 - 5.0) for an order.
 */
export function calculateOrderSatisfaction(params: {
  starQuality: number;
  decorLevel: number;
  priceRatio: number;
}): number {
  const base = 3.5 + (params.starQuality - 1) * 0.25 + (params.decorLevel - 1) * 0.1;
  const pricePenalty = params.priceRatio > 1.1 ? (params.priceRatio - 1.1) * 3.0 : 0;
  const priceBonus = params.priceRatio < 0.95 ? (0.95 - params.priceRatio) * 1.2 : 0;
  return Number(Math.min(5.0, Math.max(1.0, base + priceBonus - pricePenalty)).toFixed(2));
}

/**
 * Updates running average restaurant rating with a new order satisfaction score.
 */
export function updateAverageRating(
  currentAvg: number,
  totalRatings: number,
  newScore: number
): { avgRating: number; totalRatings: number } {
  const nextTotal = totalRatings + 1;
  const nextAvg = (currentAvg * totalRatings + newScore) / nextTotal;
  return {
    avgRating: Number(Math.min(5.0, Math.max(1.0, nextAvg)).toFixed(2)),
    totalRatings: nextTotal,
  };
}
