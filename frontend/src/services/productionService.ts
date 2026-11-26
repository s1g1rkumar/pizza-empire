import { apiClient } from './apiClient';
import { ApiResponse } from '@/types/api.types';
import { ProductionDashboardData } from '@/types/production.types';

export const productionService = {
  async getDashboard(): Promise<ProductionDashboardData> {
    const res = await apiClient.get<ApiResponse<ProductionDashboardData>>('/production');
    return res.data.data;
  },

  async startOrder(recipeId: number, quantity: number): Promise<ProductionDashboardData> {
    const res = await apiClient.post<ApiResponse<ProductionDashboardData>>('/production/orders', {
      recipeId,
      quantity,
    });
    return res.data.data;
  },

  async cancelOrder(orderId: number): Promise<ProductionDashboardData> {
    const res = await apiClient.post<ApiResponse<ProductionDashboardData>>(
      `/production/orders/${orderId}/cancel`
    );
    return res.data.data;
  },
};
