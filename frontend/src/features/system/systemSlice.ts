import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { healthService } from '@/services/healthService';
import { HealthData } from '@/types/api.types';

interface SystemState {
  health: HealthData | null;
  loading: boolean;
  error: string | null;
}

const initialState: SystemState = {
  health: null,
  loading: false,
  error: null,
};

export const checkSystemHealth = createAsyncThunk('system/checkHealth', async () => {
  return healthService.fetchHealth();
});

const systemSlice = createSlice({
  name: 'system',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(checkSystemHealth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkSystemHealth.fulfilled, (state, action) => {
        state.loading = false;
        state.health = action.payload;
      })
      .addCase(checkSystemHealth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Unable to reach backend API';
      });
  },
});

export default systemSlice.reducer;
