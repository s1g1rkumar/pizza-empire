import { apiClient } from './apiClient';
import { ApiResponse } from '@/types/api.types';
import { FinanceDashboardData } from '@/types/finance.types';

export const financeService = {
  async getDashboard(transactionType?: string): Promise<FinanceDashboardData> {
    const params = transactionType ? { transactionType } : undefined;
    const res = await apiClient.get<ApiResponse<FinanceDashboardData>>('/finance', { params });
    return res.data.data;
  },

  async payOperatingExpense(payload: {
    category: 'ELECTRICITY' | 'MAINTENANCE' | 'RENT' | 'MARKETING';
    amount: number;
    idempotencyKey: string;
    description?: string;
  }): Promise<{ balanceAfter: number; skippedDuplicate: boolean }> {
    const res = await apiClient.post<
      ApiResponse<{ balanceAfter: number; skippedDuplicate: boolean }>
    >('/finance/operating-costs/pay', payload);
    return res.data.data;
  },
};
