export interface ProgressionLevelDTO {
  id: number;
  levelNumber: number;
  code: string;
  name: string;
  description: string;
  minXp: number;
  minCash: number;
  minNetWorth: number;
  maxEmployeesCap: number;
  isUnlocked: boolean;
  isCurrent: boolean;
  isNextTarget: boolean;
  eligibleToUnlock: boolean;
  missingReasons: string[];
}

export interface MissionDTO {
  id: number;
  missionId: number;
  code: string;
  title: string;
  missionType: string;
  progressValue: number;
  targetValue: number;
  rewardCash: number;
  rewardXp: number;
  rewardGems: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CLAIMED';
}

export interface AchievementDTO {
  id: number;
  achievementId: number;
  code: string;
  name: string;
  category: string;
  description: string;
  progressValue: number;
  targetValue: number;
  rewardCash: number;
  rewardXp: number;
  rewardGems: number;
  isUnlocked: boolean;
  isClaimed: boolean;
}

export interface ProgressionDashboardData {
  summary: {
    currentLevelNumber: number;
    currentLevelName: string;
    xpLevel: number;
    currentXp: number;
    nextLevelXp: number;
    cashBalance: number;
    gemsBalance: number;
    netWorth: number;
  };
  levels: ProgressionLevelDTO[];
  missions: MissionDTO[];
  achievements: AchievementDTO[];
}
