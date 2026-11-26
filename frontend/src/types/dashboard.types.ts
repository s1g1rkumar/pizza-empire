export interface DashboardData {
  profile: {
    displayName: string;
    cashBalance: number;
    gemsBalance: number;
    netWorth: number;
    reputation: number;
    maxEmployeesAllowed: number;
  };
  progression: {
    currentLevelNumber: number;
    currentLevelName: string;
    xpLevel: number;
    currentXp: number;
    nextLevelXp: number;
  };
  financials: {
    currentBalance: number;
    dailyRevenue: number;
    dailyExpenses: number;
    netProfit: number;
    performanceSeries: Array<{ label: string; revenue: number; expenses: number }>;
  };
  employees: {
    activeCount: number;
    maxAllowed: number;
  };
  businesses: Array<{
    id: number;
    businessType: string;
    name: string;
    level: number;
    isOperational: boolean;
  }>;
  unlockableBusinesses: Array<{
    levelNumber: number;
    code: string;
    name: string;
    description: string;
    minXp: number;
    minCash: number;
    isUnlocked: boolean;
    isMvp: boolean;
  }>;
  currentMissions: Array<{
    id: number;
    code: string;
    title: string;
    missionType: string;
    progressValue: number;
    targetValue: number;
    rewardCash: number;
    rewardXp: number;
    status: string;
  }>;
  recentTransactions: Array<{
    id: number;
    transactionType: string;
    category: string;
    amount: number;
    balanceAfter: number;
    description: string | null;
    createdAt: string;
  }>;
  notifications: {
    unreadCount: number;
    items: Array<{
      id: number;
      type: string;
      title: string;
      message: string;
      isRead: boolean;
      createdAt: string;
    }>;
  };
}
