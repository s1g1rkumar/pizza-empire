export interface AdminUserDTO {
  id: number;
  email: string;
  username: string;
  role: 'PLAYER' | 'MODERATOR' | 'ADMIN';
}

export interface AdminAnalyticsData {
  totalRegistrations: number;
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  retentionRate7d: number;
  avgSessionDurationMinutes: number;
  monetizationRevenueUsd: number;
  mostPopularBusinesses: Array<{ businessType: string; count: number }>;
  progressionStats: Array<{ levelNumber: number; levelName: string; playerCount: number }>;
  registrationTrend: Array<{ date: string; count: number }>;
}

export interface AdminPlayerRow {
  userId: number;
  email: string;
  username: string;
  role: 'PLAYER' | 'MODERATOR' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  lastLoginAt: string | null;
  createdAt: string;
  playerId: number | null;
  displayName: string | null;
  cashBalance: number | null;
  gemsBalance: number | null;
  netWorth: number | null;
  reputation: number | null;
  xpLevel: number | null;
  currentXp: number | null;
  stageNumber: number | null;
  stageName: string | null;
}

export interface AdminConfigData {
  crops: Array<{
    id: number;
    code: string;
    name: string;
    seedCost: number;
    growthSeconds: number;
    baseYield: number;
    marketSellPrice: number;
    unlockXpLevel: number;
  }>;
  products: Array<{
    id: number;
    code: string;
    name: string;
    category: string;
    unitWholesaleBuy: number;
    unitWholesaleSell: number;
    lowStockThreshold: number;
  }>;
  locations: Array<{
    id: number;
    code: string;
    name: string;
    districtType: string;
    demandMultiplier: number;
    rentMultiplier: number;
    priceElasticity: number;
  }>;
  upgrades: Array<{
    id: number;
    code: string;
    category: string;
    name: string;
    baseCost: number;
    costMultiplier: number;
    maxLevel: number;
    effectValue: number;
    isActive: number | boolean;
  }>;
  missions: Array<{
    id: number;
    code: string;
    title: string;
    missionType: string;
    targetMetric: string;
    targetValue: number;
    rewardCash: number;
    rewardXp: number;
    rewardGems: number;
    isActive: number | boolean;
  }>;
  achievements: Array<{
    id: number;
    code: string;
    title: string;
    targetMetric: string;
    targetValue: number;
    rewardCash: number;
    rewardXp: number;
    rewardGems: number;
    isActive: number | boolean;
  }>;
  settings: Array<{
    settingKey: string;
    settingGroup: 'ECONOMY' | 'BUSINESS' | 'EMPLOYEE' | 'GAMEPLAY' | 'MAINTENANCE';
    label: string;
    settingValue: string;
    valueType: 'NUMBER' | 'BOOLEAN' | 'STRING';
    description: string;
    updatedAt: string;
  }>;
  announcements: Array<{
    id: number;
    title: string;
    message: string;
    severity: 'INFO' | 'WARNING' | 'EVENT' | 'MAINTENANCE';
    isActive: number | boolean;
    expiresAt: string | null;
    createdAt: string;
  }>;
}

export interface AdminReportsData {
  auditLogs: Array<{
    id: number;
    actorUserId: number;
    actorUsername: string;
    targetPlayerId: number | null;
    actionType: string;
    beforeState: unknown;
    afterState: unknown;
    ipAddress: string | null;
    createdAt: string;
  }>;
  economyByCategory: Array<{
    transactionType: string;
    category: string;
    txCount: number;
    totalAmount: number;
  }>;
  topPlayers: Array<{
    playerId: number;
    username: string;
    displayName: string;
    cashBalance: number;
    netWorth: number;
    reputation: number;
    stageName: string | null;
  }>;
}
