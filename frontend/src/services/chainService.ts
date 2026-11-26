import { apiClient } from './apiClient';
import { ApiResponse } from '@/types/api.types';
import { ChainDashboardData } from '@/types/chain.types';

export const chainService = {
  async getDashboard(): Promise<ChainDashboardData> {
    const res = await apiClient.get<ApiResponse<ChainDashboardData>>('/chain');
    return res.data.data;
  },

  async assignManager(
    restaurantId: number,
    managerEmployeeId: number
  ): Promise<ChainDashboardData> {
    const res = await apiClient.post<ApiResponse<ChainDashboardData>>(
      `/chain/restaurants/${restaurantId}/assign-manager`,
      { managerEmployeeId }
    );
    return res.data.data;
  },

  async payRent(restaurantId: number): Promise<ChainDashboardData> {
    const res = await apiClient.post<ApiResponse<ChainDashboardData>>(
      `/chain/restaurants/${restaurantId}/rent/pay`
    );
    return res.data.data;
  },
};
