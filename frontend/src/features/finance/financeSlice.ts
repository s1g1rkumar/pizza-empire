import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { financeService } from '@/services/financeService';
import { FinanceDashboardData } from '@/types/finance.types';

interface FinanceState {
  data: FinanceDashboardData | null;
  loading: boolean;
  error: string | null;
}

const initialState: FinanceState = {
  data: null,
  loading: false,
  error: null,
};

export const fetchFinance = createAsyncThunk(
  'finance/fetch',
  async (transactionType: string | undefined = undefined, { rejectWithValue }) => {
    try {
      return await financeService.getDashboard(transactionType);
    } catch (err) {
      if (err instanceof AxiosError) {
        const msg = (err.response?.data as { error?: { message?: string } } | undefined)?.error
          ?.message;
        if (msg) return rejectWithValue(msg);
      }
      return rejectWithValue('Failed to load financial reports');
    }
  }
);

const financeSlice = createSlice({
  name: 'finance',
  initialState,
  reducers: {
    clearFinanceError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFinance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFinance.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchFinance.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.payload ?? 'Failed to load financial reports');
      });
  },
});

export const { clearFinanceError } = financeSlice.actions;
export default financeSlice.reducer;
