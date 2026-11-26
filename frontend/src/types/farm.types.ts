export type FertilizerType = 'NONE' | 'COMPOST' | 'BIO_NUTRIENT';

export interface CropInfo {
  id: number;
  code: string;
  name: string;
  seedCost: number;
  growthSeconds: number;
  waterRequirement: number;
  baseYield: number;
  marketSellPrice: number;
  quality: number;
  unlockXpLevel: number;
  seedsOwned: number;
  isUnlocked: boolean;
}

export interface FarmPlot {
  id: number;
  plotIndex: number;
  isUnlocked: boolean;
  unlockCost: number;
  cropId: number | null;
  cropCode: string | null;
  cropName: string | null;
  status: 'EMPTY' | 'GROWING' | 'READY';
  hydrationPct: number;
  fertilizerType: FertilizerType;
  plantedAt: string | null;
  readyAt: string | null;
}

export interface BarnItem {
  itemId: number;
  code: string;
  name: string;
  quantity: number;
  sellPrice: number;
}

export interface FarmUpgrade {
  id: number;
  code: string;
  name: string;
  description: string;
  currentLevel: number;
  maxLevel: number;
  nextCost: number;
}

export interface FarmDashboardData {
  farm: {
    id: number;
    businessId: number;
    name: string;
    irrigationLevel: number;
    barnCapacity: number;
    barnUsed: number;
    unlockedPlotsCount: number;
    totalPlotsCapacity: number;
  };
  player: {
    cashBalance: number;
    xpLevel: number;
  };
  crops: CropInfo[];
  plots: FarmPlot[];
  barnInventory: BarnItem[];
  upgrades: FarmUpgrade[];
}
