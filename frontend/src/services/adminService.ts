import {
  AdminAnalyticsData,
  AdminConfigData,
  AdminPlayerRow,
  AdminReportsData,
  AdminUserDTO,
} from '@/types/admin.types';
import { ApiResponse } from '@/types/api.types';
import { apiClient } from './apiClient';

export const adminService = {
  async login(payload: { email: string; password: string }) {
    const res = await apiClient.post<ApiResponse<{ accessToken: string; user: AdminUserDTO }>>(
      '/admin/auth/login',
      payload
    );
    return res.data.data;
  },

  async getAnalytics(): Promise<AdminAnalyticsData> {
    const res = await apiClient.get<ApiResponse<AdminAnalyticsData>>('/admin/analytics');
    return res.data.data;
  },

  async getPlayers(search?: string, status?: string): Promise<AdminPlayerRow[]> {
    const res = await apiClient.get<ApiResponse<AdminPlayerRow[]>>('/admin/players', {
      params: { search, status },
    });
    return res.data.data;
  },

  async getConfig(): Promise<AdminConfigData> {
    const res = await apiClient.get<ApiResponse<AdminConfigData>>('/admin/config');
    return res.data.data;
  },

  async getReports(): Promise<AdminReportsData> {
    const res = await apiClient.get<ApiResponse<AdminReportsData>>('/admin/reports');
    return res.data.data;
  },

  async updatePlayerAccount(
    userId: number,
    payload: {
      status?: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
      role?: 'PLAYER' | 'MODERATOR' | 'ADMIN';
      cashBalance?: number;
      gemsBalance?: number;
    }
  ): Promise<AdminPlayerRow[]> {
    const res = await apiClient.patch<ApiResponse<AdminPlayerRow[]>>(
      `/admin/players/${userId}/account`,
      payload
    );
    return res.data.data;
  },

  async updatePlayerProgression(
    playerId: number,
    payload: {
      xpLevel?: number;
      currentXp?: number;
      stageNumber?: number;
      reputation?: number;
    }
  ): Promise<AdminPlayerRow[]> {
    const res = await apiClient.patch<ApiResponse<AdminPlayerRow[]>>(
      `/admin/players/${playerId}/progression`,
      payload
    );
    return res.data.data;
  },

  async updateCrop(
    cropId: number,
    payload: {
      seedCost: number;
      growthSeconds: number;
      baseYield: number;
      marketSellPrice: number;
      unlockXpLevel: number;
    }
  ): Promise<AdminConfigData> {
    const res = await apiClient.patch<ApiResponse<AdminConfigData>>(
      `/admin/config/crops/${cropId}`,
      payload
    );
    return res.data.data;
  },

  async updateProduct(
    itemId: number,
    payload: {
      unitWholesaleBuy: number;
      unitWholesaleSell: number;
      lowStockThreshold: number;
    }
  ): Promise<AdminConfigData> {
    const res = await apiClient.patch<ApiResponse<AdminConfigData>>(
      `/admin/config/products/${itemId}`,
      payload
    );
    return res.data.data;
  },

  async updateLocation(
    locationId: number,
    payload: {
      demandMultiplier: number;
      rentMultiplier: number;
      priceElasticity: number;
    }
  ): Promise<AdminConfigData> {
    const res = await apiClient.patch<ApiResponse<AdminConfigData>>(
      `/admin/config/locations/${locationId}`,
      payload
    );
    return res.data.data;
  },

  async updateUpgrade(
    upgradeId: number,
    payload: {
      baseCost: number;
      costMultiplier: number;
      effectValue: number;
      maxLevel: number;
      isActive: boolean;
    }
  ): Promise<AdminConfigData> {
    const res = await apiClient.patch<ApiResponse<AdminConfigData>>(
      `/admin/config/upgrades/${upgradeId}`,
      payload
    );
    return res.data.data;
  },

  async updateMission(
    missionId: number,
    payload: {
      targetValue: number;
      rewardCash: number;
      rewardXp: number;
      rewardGems: number;
      isActive: boolean;
    }
  ): Promise<AdminConfigData> {
    const res = await apiClient.patch<ApiResponse<AdminConfigData>>(
      `/admin/config/missions/${missionId}`,
      payload
    );
    return res.data.data;
  },

  async updateAchievement(
    achievementId: number,
    payload: {
      targetValue: number;
      rewardCash: number;
      rewardXp: number;
      rewardGems: number;
      isActive: boolean;
    }
  ): Promise<AdminConfigData> {
    const res = await apiClient.patch<ApiResponse<AdminConfigData>>(
      `/admin/config/achievements/${achievementId}`,
      payload
    );
    return res.data.data;
  },

  async updateSetting(settingKey: string, settingValue: string): Promise<AdminConfigData> {
    const res = await apiClient.patch<ApiResponse<AdminConfigData>>(
      `/admin/config/settings/${encodeURIComponent(settingKey)}`,
      { settingValue }
    );
    return res.data.data;
  },

  async createAnnouncement(payload: {
    title: string;
    message: string;
    severity: 'INFO' | 'WARNING' | 'EVENT' | 'MAINTENANCE';
  }): Promise<AdminConfigData> {
    const res = await apiClient.post<ApiResponse<AdminConfigData>>('/admin/announcements', payload);
    return res.data.data;
  },

  async toggleAnnouncement(announcementId: number, isActive: boolean): Promise<AdminConfigData> {
    const res = await apiClient.patch<ApiResponse<AdminConfigData>>(
      `/admin/announcements/${announcementId}`,
      { isActive }
    );
    return res.data.data;
  },
};
