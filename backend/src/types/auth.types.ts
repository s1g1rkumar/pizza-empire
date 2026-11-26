export type UserRole = 'PLAYER' | 'MODERATOR' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED';

export interface AuthTokenPayload {
  userId: number;
  playerId: number;
  role: UserRole;
}

export interface UserRecord {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  role: UserRole;
  status: AccountStatus;
  last_login_at: string | null;
  created_at: string;
}

export interface PublicUser {
  id: number;
  email: string;
  username: string;
  role: UserRole;
  status: AccountStatus;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface PlayerProfileDTO {
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

export interface GameOverviewDTO {
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

export interface AuthResponseDTO {
  accessToken: string;
  user: PublicUser;
  profile: PlayerProfileDTO;
  overview: GameOverviewDTO;
}
