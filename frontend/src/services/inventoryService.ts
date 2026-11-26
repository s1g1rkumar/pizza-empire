import { apiClient } from './apiClient';
import { ApiResponse } from '@/types/api.types';
import { InventoryDashboardData } from '@/types/inventory.types';

export const inventoryService = {
  async getDashboard(): Promise<InventoryDashboardData> {
    const res = await apiClient.get<ApiResponse<InventoryDashboardData>>('/inventory');
    return res.data.data;
  },

  async buyItem(
    businessId: number,
    itemId: number,
    quantity: number
  ): Promise<InventoryDashboardData> {
    const res = await apiClient.post<ApiResponse<InventoryDashboardData>>('/inventory/buy', {
      businessId,
      itemId,
      quantity,
    });
    return res.data.data;
  },

  async sellItem(
    businessId: number,
    itemId: number,
    quantity: number
  ): Promise<InventoryDashboardData> {
    const res = await apiClient.post<ApiResponse<InventoryDashboardData>>('/inventory/sell', {
      businessId,
      itemId,
      quantity,
    });
    return res.data.data;
  },

  async transferItem(
    fromBusinessId: number,
    toBusinessId: number,
    itemId: number,
    quantity: number
  ): Promise<InventoryDashboardData> {
    const res = await apiClient.post<ApiResponse<InventoryDashboardData>>('/inventory/transfer', {
      fromBusinessId,
      toBusinessId,
      itemId,
      quantity,
    });
    return res.data.data;
  },
};
