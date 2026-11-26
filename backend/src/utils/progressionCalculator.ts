export interface PlayerMetricsSnapshot {
  totalCropsHarvested: number;
  totalPizzasSold: number;
  totalBatchesProcessed: number;
  totalDeliveriesCompleted: number;
  activeEmployees: number;
  unlockedPlots: number;
  restaurantsOwned: number;
  farmUpgrades: number;
  cashBalance: number;
  netWorth: number;
  xpLevel: number;
}

export function resolveMetricValue(metric: string, stats: PlayerMetricsSnapshot): number {
  switch (metric) {
    case 'TOTAL_CROPS_HARVESTED':
      return stats.totalCropsHarvested;
    case 'TOTAL_PIZZAS_SOLD':
      return stats.totalPizzasSold;
    case 'TOTAL_BATCHES_PROCESSED':
      return stats.totalBatchesProcessed;
    case 'TOTAL_DELIVERIES_COMPLETED':
      return stats.totalDeliveriesCompleted;
    case 'ACTIVE_EMPLOYEES':
    case 'ACTIVE_EMPLOYEES_COUNT':
      return stats.activeEmployees;
    case 'UNLOCKED_PLOTS':
      return stats.unlockedPlots;
    case 'RESTAURANTS_OWNED':
      return stats.restaurantsOwned;
    case 'FARM_UPGRADES':
      return stats.farmUpgrades;
    case 'CASH_BALANCE':
      return Math.floor(stats.cashBalance);
    case 'NET_WORTH':
      return Math.floor(stats.netWorth);
    case 'XP_LEVEL':
      return stats.xpLevel;
    default:
      return 0;
  }
}

export function checkLevelUnlockEligibility(params: {
  playerXp: number;
  playerCash: number;
  playerNetWorth: number;
  minXp: number;
  minCash: number;
  minNetWorth: number;
}): { eligible: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (params.playerXp < params.minXp) {
    reasons.push(`Need ${params.minXp - params.playerXp} more XP`);
  }
  if (params.playerCash < params.minCash) {
    reasons.push(`Need $${(params.minCash - params.playerCash).toFixed(2)} more Cash`);
  }
  if (params.playerNetWorth < params.minNetWorth) {
    reasons.push(`Need $${(params.minNetWorth - params.playerNetWorth).toFixed(2)} more Net Worth`);
  }
  return { eligible: reasons.length === 0, reasons };
}
