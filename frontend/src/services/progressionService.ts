import { apiClient } from './apiClient';
import { ApiResponse } from '@/types/api.types';
import { ProgressionDashboardData } from '@/types/progression.types';

export const progressionService = {
  async getDashboard(): Promise<ProgressionDashboardData> {
    const res = await apiClient.get<ApiResponse<ProgressionDashboardData>>('/progression');
    return res.data.data;
  },

  async unlockNextLevel(): Promise<ProgressionDashboardData> {
    const res = await apiClient.post<ApiResponse<ProgressionDashboardData>>(
      '/progression/levels/unlock'
    );
    return res.data.data;
  },

  async claimMission(missionId: number): Promise<ProgressionDashboardData> {
    const res = await apiClient.post<ApiResponse<ProgressionDashboardData>>(
      `/progression/missions/${missionId}/claim`
    );
    return res.data.data;
  },

  async claimAchievement(achievementId: number): Promise<ProgressionDashboardData> {
    const res = await apiClient.post<ApiResponse<ProgressionDashboardData>>(
      `/progression/achievements/${achievementId}/claim`
    );
    return res.data.data;
  },
};
