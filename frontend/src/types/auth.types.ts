export type UserRole = 'PLAYER' | 'MODERATOR' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED';

export interface PublicUser {
  id: number;
  email: string;
  username: string;
  role: UserRole;
  status: AccountStatus;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface PlayerProfile {
  id: number;
  userId: number;
  displayName: string;
  avatarKey: string;
  cashBalance: number;
  gemsBalance: number;
  netWorth: number;
  reputation: number;
  maxEmployeesAllowed: number;
  offlineCapSeconds: number;
  lastActiveAt: string;
}

export interface GameOverview {
  currentLevelNumber: number;
  currentLevelCode: string;
  currentLevelName: string;
  xpLevel: number;
  currentXp: number;
  totalCropsHarvested: number;
  totalPizzasSold: number;
  farmCount: number;
  unlockedPlotsCount: number;
  activeMissionsCount: number;
  unreadNotificationsCount: number;
}

export interface AuthResponse {
  accessToken: string;
  user: PublicUser;
  profile: PlayerProfile;
  overview: GameOverview;
}

export interface ProfileResponse {
  user: PublicUser;
  profile: PlayerProfile;
  overview: GameOverview;
}
