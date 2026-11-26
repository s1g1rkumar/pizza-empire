export interface ProductionRecipeIngredient {
  itemId: number;
  code: string;
  name: string;
  quantityRequired: number;
  availableStock: number;
}

export interface ProductionRecipe {
  id: number;
  code: string;
  name: string;
  facilityType: string;
  outputItemId: number;
  outputItemName: string;
  outputQuantity: number;
  durationSeconds: number;
  unlockXpLevel: number;
  isUnlocked: boolean;
  ingredients: ProductionRecipeIngredient[];
}

export interface ProductionDashboardData {
  business: {
    id: number;
    name: string;
    businessType: string;
    productionCapacity: number;
    activeOrdersCount: number;
    efficiencyMultiplier: number;
  };
  recipes: ProductionRecipe[];
  availableIngredients: Array<{
    itemId: number;
    code: string;
    name: string;
    quantity: number;
    reservedQuantity: number;
    availableQuantity: number;
  }>;
  activeOrders: Array<{
    id: number;
    recipeId: number;
    recipeName: string;
    quantity: number;
    outputQuantity: number;
    status: string;
    startedAt: string;
    completesAt: string;
  }>;
  completedOrders: Array<{
    id: number;
    recipeName: string;
    quantity: number;
    outputQuantity: number;
    status: string;
    completedAt: string;
  }>;
  employees: Array<{
    id: number;
    fullName: string;
    role: string;
    skillLevel: number;
    happiness: number;
    productivity: number;
  }>;
}
