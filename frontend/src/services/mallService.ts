import { ApiResponse } from '@/types/api.types';
import { MallsDashboardData, MallTier, MallUnitType } from '@/types/mall.types';
import { apiClient } from './apiClient';

export const mallService = {
  async getDashboard(): Promise<MallsDashboardData> {
    const res = await apiClient.get<ApiResponse<MallsDashboardData>>('/malls');
    return res.data.data;
  },

  async purchaseLand(payload: {
    locationId: number;
    parcelName: string;
    maxFloors: number;
  }): Promise<MallsDashboardData> {
    const res = await apiClient.post<ApiResponse<MallsDashboardData>>(
      '/malls/lands/purchase',
      payload
    );
    return res.data.data;
  },

  async constructMall(payload: {
    mallLandId: number;
    name: string;
    mallTier: MallTier;
  }): Promise<MallsDashboardData> {
    const res = await apiClient.post<ApiResponse<MallsDashboardData>>('/malls/construct', payload);
    return res.data.data;
  },

  async addFloor(mallId: number): Promise<MallsDashboardData> {
    const res = await apiClient.post<ApiResponse<MallsDashboardData>>(
      `/malls/${mallId}/floors/add`
    );
    return res.data.data;
  },

  async upgradeParking(mallId: number): Promise<MallsDashboardData> {
    const res = await apiClient.post<ApiResponse<MallsDashboardData>>(
      `/malls/${mallId}/parking/upgrade`
    );
    return res.data.data;
  },

  async createUnit(
    mallId: number,
    payload: {
      floorNumber: number;
      unitType: MallUnitType;
      unitName: string;
      occupancyStatus: 'VACANT' | 'LEASED' | 'SELF_OPERATED';
      tenantName?: string;
      monthlyRent?: number;
    }
  ): Promise<MallsDashboardData> {
    const res = await apiClient.post<ApiResponse<MallsDashboardData>>(
      `/malls/${mallId}/units`,
      payload
    );
    return res.data.data;
  },

  async updateLease(
    mallId: number,
    unitId: number,
    payload: {
      occupancyStatus: 'VACANT' | 'LEASED' | 'SELF_OPERATED';
      tenantName: string | null;
      monthlyRent: number;
      leaseMonths: number;
    }
  ): Promise<MallsDashboardData> {
    const res = await apiClient.patch<ApiResponse<MallsDashboardData>>(
      `/malls/${mallId}/units/${unitId}/lease`,
      payload
    );
    return res.data.data;
  },

  async collectRent(mallId: number): Promise<MallsDashboardData> {
    const res = await apiClient.post<ApiResponse<MallsDashboardData>>(
      `/malls/${mallId}/rent/collect`
    );
    return res.data.data;
  },
};
