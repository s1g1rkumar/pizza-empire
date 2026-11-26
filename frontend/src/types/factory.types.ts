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

export interface FactoryDetail {
  id: number;
  businessId: number;
  name: string;
  factoryType: FactoryType;
  typeLabel: string;
  locationName: string;
  machineCount: number;
  nextMachineCost: number;
  queueCapacity: number;
  speedMultiplier: number;
  storageCapacity: number;
  storageUsed: number;
  hourlyUpkeep: number;
  recipe: {
    id: number;
    name: string;
    outputItemId: number;
    outputItemName: string;
    outputQuantity: number;
    outputStock: number;
    durationSeconds: number;
    ingredients: Array<{
      itemId: number;
      name: string;
      quantityRequired: number;
      availableStock: number;
    }>;
  } | null;
  activeOrders: Array<{
    id: number;
    recipeName: string;
    quantity: number;
    status: string;
    startedAt: string;
    completesAt: string;
  }>;
  employees: Array<{
    id: number;
    fullName: string;
    role: string;
    skillLevel: number;
    productivity: number;
  }>;
}

export interface FactoriesDashboardData {
  cashBalance: number;
  blueprints: FactoryBlueprint[];
  locations: Array<{ id: number; name: string; rentMultiplier: number }>;
  targetBusinesses: Array<{ id: number; name: string; businessType: string }>;
  factories: FactoryDetail[];
}
