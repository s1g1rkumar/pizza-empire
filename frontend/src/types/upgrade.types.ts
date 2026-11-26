export interface UpgradeItemDTO {
  id: number;
  code: string;
  name: string;
  category: string;
  businessType: string;
  description: string;
  currentLevel: number;
  maxLevel: number;
  effectPerLevel: number;
  nextCost: number;
  unlockLevelNumber: number;
  isUnlocked: boolean;
}

export interface UpgradesDashboardData {
  cashBalance: number;
  currentStageLevel: number;
  multipliers: {
    revenueMultiplier: number;
    upkeepReductionFactor: number;
    automationBonus: number;
    employeeProductivityBonus: number;
  };
  upgrades: UpgradeItemDTO[];
}
