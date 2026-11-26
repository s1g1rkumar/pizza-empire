import { apiClient } from './apiClient';
import { ApiResponse, HealthData } from '@/types/api.types';

export const healthService = {
  async fetchHealth(): Promise<HealthData> {
    const response = await apiClient.get<ApiResponse<HealthData>>('/health');
    return response.data.data;
  },
};
