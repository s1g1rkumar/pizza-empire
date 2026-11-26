import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { chainService } from '@/services/chainService';
import { ChainDashboardData } from '@/types/chain.types';

interface ChainState {
  data: ChainDashboardData | null;
  loading: boolean;
  acting: boolean;
  error: string | null;
}

const initialState: ChainState = {
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

export const fetchChain = createAsyncThunk('chain/fetch', async (_, { rejectWithValue }) => {
  try {
    return await chainService.getDashboard();
  } catch (err) {
    return rejectWithValue(extractErr(err, 'Failed to load restaurant chain'));
  }
});

export const assignBranchManager = createAsyncThunk(
  'chain/assignManager',
  async (
    { restaurantId, managerEmployeeId }: { restaurantId: number; managerEmployeeId: number },
    { rejectWithValue }
  ) => {
    try {
      return await chainService.assignManager(restaurantId, managerEmployeeId);
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Failed to assign manager'));
    }
  }
);

export const payBranchRent = createAsyncThunk(
  'chain/payRent',
  async (restaurantId: number, { rejectWithValue }) => {
    try {
      return await chainService.payRent(restaurantId);
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Failed to pay rent'));
    }
  }
);

const chainSlice = createSlice({
  name: 'chain',
  initialState,
  reducers: {
    clearChainError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChain.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChain.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchChain.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.payload ?? 'Failed to load chain');
      });

    for (const thunk of [assignBranchManager, payBranchRent]) {
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
          state.error = String(action.payload ?? 'Action failed');
        });
    }
  },
});

export const { clearChainError } = chainSlice.actions;
export default chainSlice.reducer;
