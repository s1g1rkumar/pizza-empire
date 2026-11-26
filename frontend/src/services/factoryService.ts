import { apiClient } from './apiClient';
import { ApiResponse } from '@/types/api.types';
import { FactoriesDashboardData, FactoryType } from '@/types/factory.types';

export const factoryService = {
  async getDashboard(): Promise<FactoriesDashboardData> {
    const res = await apiClient.get<ApiResponse<FactoriesDashboardData>>('/factories');
    return res.data.data;
  },

  async construct(
    name: string,
    factoryType: FactoryType,
    locationId: number
  ): Promise<FactoriesDashboardData> {
    const res = await apiClient.post<ApiResponse<FactoriesDashboardData>>('/factories/construct', {
      name,
      factoryType,
      locationId,
    });
    return res.data.data;
  },

  async purchaseMachine(factoryId: number): Promise<FactoriesDashboardData> {
    const res = await apiClient.post<ApiResponse<FactoriesDashboardData>>(
      `/factories/${factoryId}/machines`
    );
    return res.data.data;
  },

  async upgradeStorage(factoryId: number): Promise<FactoriesDashboardData> {
    const res = await apiClient.post<ApiResponse<FactoriesDashboardData>>(
      `/factories/${factoryId}/storage`
    );
    return res.data.data;
  },

  async startOrder(factoryId: number, quantity: number): Promise<FactoriesDashboardData> {
    const res = await apiClient.post<ApiResponse<FactoriesDashboardData>>(
      `/factories/${factoryId}/orders`,
      { quantity }
    );
    return res.data.data;
  },

  async transferOutput(
    factoryId: number,
    toBusinessId: number,
    itemId: number,
    quantity: number
  ): Promise<FactoriesDashboardData> {
    const res = await apiClient.post<ApiResponse<FactoriesDashboardData>>(
      `/factories/${factoryId}/transfer`,
      { toBusinessId, itemId, quantity }
    );
    return res.data.data;
  },
};
