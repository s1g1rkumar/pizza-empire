export type FactoryType =
  | 'FLOUR_MILL'
  | 'TOMATO_SAUCE_FACTORY'
  | 'DAIRY_FACTORY'
  | 'VEGETABLE_PROCESSING_FACTORY'
  | 'PACKAGING_FACTORY';

export interface FactoryBlueprint {
  type: FactoryType;
  label: string;
  constructionCost: number;
  hourlyUpkeep: number;
  storageCapacity: number;
  machineCost: number;
  recipeCode: string;
}

export const FACTORY_BLUEPRINTS: Record<FactoryType, FactoryBlueprint> = {
  FLOUR_MILL: {
    type: 'FLOUR_MILL',
    label: 'Flour Mill',
    constructionCost: 6000,
    hourlyUpkeep: 30,
    storageCapacity: 500,
    machineCost: 1800,
    recipeCode: 'FAC_FLOUR_BATCH',
  },
  TOMATO_SAUCE_FACTORY: {
    type: 'TOMATO_SAUCE_FACTORY',
    label: 'Tomato Sauce Factory',
    constructionCost: 8500,
    hourlyUpkeep: 40,
    storageCapacity: 500,
    machineCost: 2200,
    recipeCode: 'FAC_SAUCE_BATCH',
  },
  DAIRY_FACTORY: {
    type: 'DAIRY_FACTORY',
    label: 'Dairy Factory',
    constructionCost: 12000,
    hourlyUpkeep: 55,
    storageCapacity: 450,
    machineCost: 3000,
    recipeCode: 'FAC_CHEESE_BATCH',
  },
  VEGETABLE_PROCESSING_FACTORY: {
    type: 'VEGETABLE_PROCESSING_FACTORY',
    label: 'Vegetable Processing Factory',
    constructionCost: 10000,
    hourlyUpkeep: 45,
    storageCapacity: 600,
    machineCost: 2500,
    recipeCode: 'FAC_VEG_BATCH',
  },
  PACKAGING_FACTORY: {
    type: 'PACKAGING_FACTORY',
    label: 'Packaging Factory',
    constructionCost: 7500,
    hourlyUpkeep: 35,
    storageCapacity: 800,
    machineCost: 2000,
    recipeCode: 'FAC_BOX_BATCH',
  },
};

export function calculateMachinePurchaseCost(
  baseMachineCost: number,
  currentMachines: number
): number {
  return Math.floor(baseMachineCost * Math.pow(1.45, Math.max(0, currentMachines - 1)));
}

export function calculateFactorySpeedMultiplier(
  machineCount: number,
  employeeBonus: number
): number {
  const machineBonus = 1 + Math.max(0, machineCount - 1) * 0.15;
  return Number(Math.min(5.0, machineBonus * Math.max(1, employeeBonus)).toFixed(2));
}
