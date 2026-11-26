import { apiClient } from './apiClient';
import { ApiResponse } from '@/types/api.types';
import { UpgradesDashboardData } from '@/types/upgrade.types';

export const upgradeService = {
  async getDashboard(): Promise<UpgradesDashboardData> {
    const res = await apiClient.get<ApiResponse<UpgradesDashboardData>>('/upgrades');
    return res.data.data;
  },

  async purchase(upgradeCode: string): Promise<UpgradesDashboardData> {
    const res = await apiClient.post<ApiResponse<UpgradesDashboardData>>(
      `/upgrades/${upgradeCode}/purchase`
    );
    return res.data.data;
  },
};
