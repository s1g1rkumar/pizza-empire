import { apiClient } from './apiClient';
import { ApiResponse } from '@/types/api.types';
import { RestaurantsDashboardData, RestaurantType } from '@/types/restaurant.types';

export const restaurantService = {
  async getDashboard(): Promise<RestaurantsDashboardData> {
    const res = await apiClient.get<ApiResponse<RestaurantsDashboardData>>('/restaurants');
    return res.data.data;
  },

  async construct(
    name: string,
    restaurantType: RestaurantType,
    locationId: number
  ): Promise<RestaurantsDashboardData> {
    const res = await apiClient.post<ApiResponse<RestaurantsDashboardData>>(
      '/restaurants/construct',
      { name, restaurantType, locationId }
    );
    return res.data.data;
  },

  async upgrade(
    restaurantId: number,
    upgradeType: 'OVEN' | 'TABLES' | 'DECOR'
  ): Promise<RestaurantsDashboardData> {
    const res = await apiClient.post<ApiResponse<RestaurantsDashboardData>>(
      `/restaurants/${restaurantId}/upgrade`,
      { upgradeType }
    );
    return res.data.data;
  },

  async updateMenu(
    restaurantId: number,
    menuId: number,
    updates: { customPrice?: number; isEnabled?: boolean; upgradeStarQuality?: boolean }
  ): Promise<RestaurantsDashboardData> {
    const res = await apiClient.patch<ApiResponse<RestaurantsDashboardData>>(
      `/restaurants/${restaurantId}/menu/${menuId}`,
      updates
    );
    return res.data.data;
  },

  async serve(restaurantId: number): Promise<RestaurantsDashboardData> {
    const res = await apiClient.post<ApiResponse<RestaurantsDashboardData>>(
      `/restaurants/${restaurantId}/serve`
    );
    return res.data.data;
  },
};
