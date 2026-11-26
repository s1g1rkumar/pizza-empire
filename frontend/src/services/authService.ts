import { apiClient } from './apiClient';
import { ApiResponse } from '@/types/api.types';
import { AuthResponse, ProfileResponse } from '@/types/auth.types';

export const authService = {
  async register(payload: {
    email: string;
    username: string;
    password: string;
    displayName?: string;
  }): Promise<AuthResponse> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', payload);
    return res.data.data;
  },

  async login(payload: { email: string; password: string }): Promise<AuthResponse> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', payload);
    return res.data.data;
  },

  async refresh(): Promise<{ accessToken: string }> {
    const res = await apiClient.post<ApiResponse<{ accessToken: string }>>('/auth/refresh');
    return res.data.data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async getProfile(): Promise<ProfileResponse> {
    const res = await apiClient.get<ApiResponse<ProfileResponse>>('/auth/profile');
    return res.data.data;
  },

  async updateProfile(payload: {
    displayName: string;
    avatarKey?: string;
  }): Promise<ProfileResponse> {
    const res = await apiClient.patch<ApiResponse<ProfileResponse>>('/auth/profile', payload);
    return res.data.data;
  },

  async changePassword(payload: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    const res = await apiClient.post<ApiResponse<{ message: string }>>(
      '/auth/change-password',
      payload
    );
    return res.data.data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/auth/forgot-password', {
      email,
    });
    return res.data.data;
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/auth/reset-password', {
      token,
      newPassword,
    });
    return res.data.data;
  },
};
