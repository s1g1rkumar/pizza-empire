import { ApiResponse } from '@/types/api.types';
import {
  SupermarketsDashboardData,
  SupermarketTier,
  SupermarketUpgradeType,
} from '@/types/supermarket.types';
import { apiClient } from './apiClient';

export const supermarketService = {
  async getDashboard(): Promise<SupermarketsDashboardData> {
    const res = await apiClient.get<ApiResponse<SupermarketsDashboardData>>('/supermarkets');
    return res.data.data;
  },

  async construct(payload: {
    name: string;
    storeTier: SupermarketTier;
    locationId: number;
  }): Promise<SupermarketsDashboardData> {
    const res = await apiClient.post<ApiResponse<SupermarketsDashboardData>>(
      '/supermarkets/construct',
      payload
    );
    return res.data.data;
  },

  async purchaseProduct(
    supermarketId: number,
    payload: { itemId: number; quantity: number }
  ): Promise<SupermarketsDashboardData> {
    const res = await apiClient.post<ApiResponse<SupermarketsDashboardData>>(
      `/supermarkets/${supermarketId}/purchase`,
      payload
    );
    return res.data.data;
  },

  async supplyFromFactory(
    supermarketId: number,
    payload: { factoryId: number; itemId: number; quantity: number }
  ): Promise<SupermarketsDashboardData> {
    const res = await apiClient.post<ApiResponse<SupermarketsDashboardData>>(
      `/supermarkets/${supermarketId}/supply-from-factory`,
      payload
    );
    return res.data.data;
  },

  async updateListing(
    supermarketId: number,
    itemId: number,
    payload: { customPrice: number; isEnabled: boolean }
  ): Promise<SupermarketsDashboardData> {
    const res = await apiClient.patch<ApiResponse<SupermarketsDashboardData>>(
      `/supermarkets/${supermarketId}/listings/${itemId}`,
      payload
    );
    return res.data.data;
  },

  async upgrade(
    supermarketId: number,
    upgradeType: SupermarketUpgradeType
  ): Promise<SupermarketsDashboardData> {
    const res = await apiClient.post<ApiResponse<SupermarketsDashboardData>>(
      `/supermarkets/${supermarketId}/upgrade`,
      { upgradeType }
    );
    return res.data.data;
  },

  async assignEmployee(
    supermarketId: number,
    employeeId: number
  ): Promise<SupermarketsDashboardData> {
    const res = await apiClient.post<ApiResponse<SupermarketsDashboardData>>(
      `/supermarkets/${supermarketId}/assign-employee`,
      { employeeId }
    );
    return res.data.data;
  },

  async runSales(supermarketId: number): Promise<SupermarketsDashboardData> {
    const res = await apiClient.post<ApiResponse<SupermarketsDashboardData>>(
      `/supermarkets/${supermarketId}/sales/run`
    );
    return res.data.data;
  },
};
