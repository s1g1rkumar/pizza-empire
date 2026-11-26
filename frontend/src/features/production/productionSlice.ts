import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { productionService } from '@/services/productionService';
import { ProductionDashboardData } from '@/types/production.types';

interface ProductionState {
  data: ProductionDashboardData | null;
  loading: boolean;
  acting: boolean;
  error: string | null;
}

const initialState: ProductionState = {
  data: null,
  loading: false,
  acting: false,
  error: null,
};

function extractErr(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    const msg = (err.response?.data as { error?: { message?: string } } | undefined)?.error
      ?.message;
    if (msg) return msg;
  }
  return err instanceof Error ? err.message : fallback;
}

export const fetchProduction = createAsyncThunk(
  'production/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await productionService.getDashboard();
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Failed to load production dashboard'));
    }
  }
);

export const startProductionOrder = createAsyncThunk(
  'production/startOrder',
  async ({ recipeId, quantity }: { recipeId: number; quantity: number }, { rejectWithValue }) => {
    try {
      return await productionService.startOrder(recipeId, quantity);
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Failed to start production order'));
    }
  }
);

export const cancelProductionOrder = createAsyncThunk(
  'production/cancelOrder',
  async (orderId: number, { rejectWithValue }) => {
    try {
      return await productionService.cancelOrder(orderId);
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Failed to cancel production order'));
    }
  }
);

const productionSlice = createSlice({
  name: 'production',
  initialState,
  reducers: {
    clearProductionError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProduction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProduction.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchProduction.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.payload ?? 'Failed to load production');
      });

    for (const thunk of [startProductionOrder, cancelProductionOrder]) {
      builder
        .addCase(thunk.pending, (state) => {
          state.acting = true;
          state.error = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.acting = false;
          state.data = action.payload;
        })
        .addCase(thunk.rejected, (state, action) => {
          state.acting = false;
          state.error = String(action.payload ?? 'Production action failed');
        });
    }
  },
});

export const { clearProductionError } = productionSlice.actions;
export default productionSlice.reducer;
