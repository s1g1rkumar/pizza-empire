import { apiClient } from './apiClient';
import { ApiResponse } from '@/types/api.types';
import { DeliveryDashboardData, VehicleType } from '@/types/delivery.types';

export const deliveryService = {
  async getDashboard(): Promise<DeliveryDashboardData> {
    const res = await apiClient.get<ApiResponse<DeliveryDashboardData>>('/delivery');
    return res.data.data;
  },

  async buyVehicle(vehicleType: VehicleType, name: string): Promise<DeliveryDashboardData> {
    const res = await apiClient.post<ApiResponse<DeliveryDashboardData>>('/delivery/vehicles/buy', {
      vehicleType,
      name,
    });
    return res.data.data;
  },

  async upgradeVehicle(vehicleId: number): Promise<DeliveryDashboardData> {
    const res = await apiClient.post<ApiResponse<DeliveryDashboardData>>(
      `/delivery/vehicles/${vehicleId}/upgrade`
    );
    return res.data.data;
  },

  async dispatchOrder(payload: {
    restaurantId: number;
    itemId: number;
    quantity: number;
    zoneId: number;
    vehicleId: number;
    driverEmployeeId?: number;
  }): Promise<DeliveryDashboardData> {
    const res = await apiClient.post<ApiResponse<DeliveryDashboardData>>(
      '/delivery/dispatch',
      payload
    );
    return res.data.data;
  },
};
