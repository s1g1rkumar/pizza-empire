import { apiClient } from './apiClient';
import { ApiResponse } from '@/types/api.types';
import { FarmDashboardData } from '@/types/farm.types';

export const farmService = {
  async getDashboard(): Promise<FarmDashboardData> {
    const res = await apiClient.get<ApiResponse<FarmDashboardData>>('/farm');
    return res.data.data;
  },

  async buySeeds(cropId: number, quantity: number): Promise<FarmDashboardData> {
    const res = await apiClient.post<ApiResponse<FarmDashboardData>>('/farm/seeds/buy', {
      cropId,
      quantity,
    });
    return res.data.data;
  },

  async unlockPlot(plotId: number): Promise<FarmDashboardData> {
    const res = await apiClient.post<ApiResponse<FarmDashboardData>>(
      `/farm/plots/${plotId}/unlock`
    );
    return res.data.data;
  },

  async plantCrop(plotId: number, cropId: number): Promise<FarmDashboardData> {
    const res = await apiClient.post<ApiResponse<FarmDashboardData>>(
      `/farm/plots/${plotId}/plant`,
      { cropId, autoBuySeed: true }
    );
    return res.data.data;
  },

  async waterPlot(plotId: number): Promise<FarmDashboardData> {
    const res = await apiClient.post<ApiResponse<FarmDashboardData>>(`/farm/plots/${plotId}/water`);
    return res.data.data;
  },

  async fertilizePlot(
    plotId: number,
    fertilizerType: 'COMPOST' | 'BIO_NUTRIENT'
  ): Promise<FarmDashboardData> {
    const res = await apiClient.post<ApiResponse<FarmDashboardData>>(
      `/farm/plots/${plotId}/fertilize`,
      { fertilizerType }
    );
    return res.data.data;
  },

  async harvestPlot(plotId: number): Promise<FarmDashboardData> {
    const res = await apiClient.post<ApiResponse<FarmDashboardData>>(
      `/farm/plots/${plotId}/harvest`
    );
    return res.data.data;
  },

  async sellCrops(itemId: number, quantity: number): Promise<FarmDashboardData> {
    const res = await apiClient.post<ApiResponse<FarmDashboardData>>('/farm/crops/sell', {
      itemId,
      quantity,
    });
    return res.data.data;
  },

  async purchaseUpgrade(upgradeCode: string): Promise<FarmDashboardData> {
    const res = await apiClient.post<ApiResponse<FarmDashboardData>>(
      `/farm/upgrades/${upgradeCode}`
    );
    return res.data.data;
  },
};
