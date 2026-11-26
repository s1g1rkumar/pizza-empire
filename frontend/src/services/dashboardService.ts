import { apiClient } from './apiClient';
import { ApiResponse } from '@/types/api.types';
import { DashboardData } from '@/types/dashboard.types';

export const dashboardService = {
  async fetchDashboard(): Promise<DashboardData> {
    const res = await apiClient.get<ApiResponse<DashboardData>>('/dashboard');
    return res.data.data;
  },

  async markAllNotificationsRead(): Promise<void> {
    await apiClient.post('/dashboard/notifications/read-all');
  },
};
