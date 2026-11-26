import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { upgradeService } from '@/services/upgradeService';
import { UpgradesDashboardData } from '@/types/upgrade.types';

interface UpgradeState {
  data: UpgradesDashboardData | null;
  loading: boolean;
  acting: boolean;
  error: string | null;
}

const initialState: UpgradeState = {
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

export const fetchUpgrades = createAsyncThunk('upgrades/fetch', async (_, { rejectWithValue }) => {
  try {
    return await upgradeService.getDashboard();
  } catch (err) {
    return rejectWithValue(extractErr(err, 'Failed to load upgrades'));
  }
});

export const purchaseBusinessUpgrade = createAsyncThunk(
  'upgrades/purchase',
  async (upgradeCode: string, { rejectWithValue }) => {
    try {
      return await upgradeService.purchase(upgradeCode);
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Upgrade purchase failed'));
    }
  }
);

const upgradeSlice = createSlice({
  name: 'upgrades',
  initialState,
  reducers: {
    clearUpgradeError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUpgrades.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUpgrades.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchUpgrades.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.payload ?? 'Failed to load upgrades');
      })
      .addCase(purchaseBusinessUpgrade.pending, (state) => {
        state.acting = true;
        state.error = null;
      })
      .addCase(purchaseBusinessUpgrade.fulfilled, (state, action) => {
        state.acting = false;
        state.data = action.payload;
      })
      .addCase(purchaseBusinessUpgrade.rejected, (state, action) => {
        state.acting = false;
        state.error = String(action.payload ?? 'Upgrade failed');
      });
  },
});

export const { clearUpgradeError } = upgradeSlice.actions;
export default upgradeSlice.reducer;
