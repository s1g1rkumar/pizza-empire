export interface UpgradeMultiplierSummary {
  revenueMultiplier: number;
  upkeepReductionFactor: number;
  automationBonus: number;
  employeeProductivityBonus: number;
}

export function calculateBusinessUpgradeCost(
  baseCost: number,
  growthFactor: number,
  currentLevel: number
): number {
  return Math.floor(baseCost * Math.pow(growthFactor, Math.max(0, currentLevel)));
}

/**
 * Computes active gameplay multipliers from a player's purchased upgrade levels.
 */
export function computeUpgradeMultipliers(
  upgrades: Array<{ code: string; currentLevel: number; effectPerLevel: number }>
): UpgradeMultiplierSummary {
  let revenueBonus = 0;
  let upkeepReduction = 0;
  let automationBonus = 0;
  let employeeProductivityBonus = 0;

  for (const u of upgrades) {
    const effect = Math.max(0, u.currentLevel) * u.effectPerLevel;
    switch (u.code) {
      case 'UPG_MGMT_MARKETING':
      case 'UPG_REST_QUALITY':
        revenueBonus += effect;
        break;
      case 'UPG_MGMT_EFFICIENCY':
      case 'UPG_FAC_ENERGY':
        upkeepReduction += effect;
        break;
      case 'UPG_MGMT_AUTOMATION':
      case 'UPG_FAC_AUTOMATION':
        automationBonus += effect;
        break;
      case 'UPG_MGMT_TRAINING':
        employeeProductivityBonus += effect;
        break;
      default:
        break;
    }
  }

  return {
    revenueMultiplier: Number((1 + revenueBonus).toFixed(4)),
    upkeepReductionFactor: Number(Math.max(0.4, 1 - Math.min(0.6, upkeepReduction)).toFixed(4)),
    automationBonus: Number((1 + automationBonus).toFixed(4)),
    employeeProductivityBonus: Number((1 + employeeProductivityBonus).toFixed(4)),
  };
}
