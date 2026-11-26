import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { dashboardService } from '@/services/dashboardService';
import { DashboardData } from '@/types/dashboard.types';

interface DashboardState {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  data: null,
  loading: false,
  error: null,
};

export const fetchDashboard = createAsyncThunk(
  'dashboard/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await dashboardService.fetchDashboard();
    } catch (err) {
      if (err instanceof AxiosError) {
        const msg = (err.response?.data as { error?: { message?: string } } | undefined)?.error
          ?.message;
        if (msg) return rejectWithValue(msg);
      }
      return rejectWithValue('Failed to load empire dashboard');
    }
  }
);

export const markNotificationsRead = createAsyncThunk(
  'dashboard/markNotificationsRead',
  async () => {
    await dashboardService.markAllNotificationsRead();
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.payload ?? 'Failed to load dashboard');
      })
      .addCase(markNotificationsRead.fulfilled, (state) => {
        if (state.data) {
          state.data.notifications.unreadCount = 0;
          state.data.notifications.items = state.data.notifications.items.map((n) => ({
            ...n,
            isRead: true,
          }));
        }
      });
  },
});

export default dashboardSlice.reducer;
