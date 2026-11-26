export type FertilizerType = 'NONE' | 'COMPOST' | 'BIO_NUTRIENT';

export const FERTILIZER_COSTS: Record<Exclude<FertilizerType, 'NONE'>, number> = {
  COMPOST: 15,
  BIO_NUTRIENT: 40,
};

/**
 * Computes effective growth duration in seconds based on crop base duration,
 * farm drip irrigation level (-8% per level, capped at 60% reduction),
 * plot hydration vs crop water requirement, and fertilizer speed bonus.
 */
export function calculateEffectiveGrowthSeconds(params: {
  baseGrowthSeconds: number;
  irrigationLevel: number;
  hydrationPct: number;
  waterRequirement: number;
  fertilizerType: FertilizerType;
}): number {
  const irrigationReduction = Math.min(0.6, Math.max(0, params.irrigationLevel) * 0.08);
  const isWellWatered = params.hydrationPct >= params.waterRequirement;
  const waterMultiplier = isWellWatered ? 0.75 : 1.0; // Watering grants 25% faster growth
  const fertilizerSpeedMultiplier = params.fertilizerType === 'BIO_NUTRIENT' ? 0.8 : 1.0;

  const effective = Math.round(
    params.baseGrowthSeconds *
      (1 - irrigationReduction) *
      waterMultiplier *
      fertilizerSpeedMultiplier
  );

  return Math.max(5, effective);
}

/**
 * Computes harvest yield quantity based on base yield, crop quality, and fertilizer bonus.
 */
export function calculateHarvestYield(params: {
  baseYield: number;
  quality: number;
  fertilizerType: FertilizerType;
}): number {
  let fertilizerBonus = 1.0;
  if (params.fertilizerType === 'COMPOST') {
    fertilizerBonus = 1.25;
  } else if (params.fertilizerType === 'BIO_NUTRIENT') {
    fertilizerBonus = 1.5;
  }

  return Math.max(1, Math.round(params.baseYield * params.quality * fertilizerBonus));
}

/**
 * Cost to unlock plot N (plots 1-2 are free starters; plot 3+ scales at 1.65x).
 */
export function calculatePlotUnlockCost(plotIndex: number): number {
  if (plotIndex <= 2) return 0;
  return Math.floor(150 * Math.pow(1.65, plotIndex - 3));
}

/**
 * Upgrade cost formula: floor(baseCost * growthFactor^currentLevel).
 */
export function calculateUpgradeCost(
  baseCost: number,
  growthFactor: number,
  currentLevel: number
): number {
  return Math.floor(baseCost * Math.pow(growthFactor, Math.max(0, currentLevel)));
}
