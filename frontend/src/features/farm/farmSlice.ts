import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { farmService } from '@/services/farmService';
import { FarmDashboardData } from '@/types/farm.types';

interface FarmState {
  data: FarmDashboardData | null;
  loading: boolean;
  acting: boolean;
  error: string | null;
}

const initialState: FarmState = {
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

export const fetchFarm = createAsyncThunk('farm/fetch', async (_, { rejectWithValue }) => {
  try {
    return await farmService.getDashboard();
  } catch (err) {
    return rejectWithValue(extractErr(err, 'Failed to load farm'));
  }
});

export const buyFarmSeeds = createAsyncThunk(
  'farm/buySeeds',
  async ({ cropId, quantity }: { cropId: number; quantity: number }, { rejectWithValue }) => {
    try {
      return await farmService.buySeeds(cropId, quantity);
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Failed to purchase seeds'));
    }
  }
);

export const unlockFarmPlot = createAsyncThunk(
  'farm/unlockPlot',
  async (plotId: number, { rejectWithValue }) => {
    try {
      return await farmService.unlockPlot(plotId);
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Failed to unlock plot'));
    }
  }
);

export const plantFarmCrop = createAsyncThunk(
  'farm/plantCrop',
  async ({ plotId, cropId }: { plotId: number; cropId: number }, { rejectWithValue }) => {
    try {
      return await farmService.plantCrop(plotId, cropId);
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Failed to plant crop'));
    }
  }
);

export const waterFarmPlot = createAsyncThunk(
  'farm/waterPlot',
  async (plotId: number, { rejectWithValue }) => {
    try {
      return await farmService.waterPlot(plotId);
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Failed to water plot'));
    }
  }
);

export const fertilizeFarmPlot = createAsyncThunk(
  'farm/fertilizePlot',
  async (
    { plotId, fertilizerType }: { plotId: number; fertilizerType: 'COMPOST' | 'BIO_NUTRIENT' },
    { rejectWithValue }
  ) => {
    try {
      return await farmService.fertilizePlot(plotId, fertilizerType);
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Failed to apply fertilizer'));
    }
  }
);

export const harvestFarmPlot = createAsyncThunk(
  'farm/harvestPlot',
  async (plotId: number, { rejectWithValue }) => {
    try {
      return await farmService.harvestPlot(plotId);
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Failed to harvest plot'));
    }
  }
);

export const sellFarmCrops = createAsyncThunk(
  'farm/sellCrops',
  async ({ itemId, quantity }: { itemId: number; quantity: number }, { rejectWithValue }) => {
    try {
      return await farmService.sellCrops(itemId, quantity);
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Failed to sell crops'));
    }
  }
);

export const upgradeFarm = createAsyncThunk(
  'farm/upgrade',
  async (upgradeCode: string, { rejectWithValue }) => {
    try {
      return await farmService.purchaseUpgrade(upgradeCode);
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Failed to purchase upgrade'));
    }
  }
);

const farmSlice = createSlice({
  name: 'farm',
  initialState,
  reducers: {
    clearFarmError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const thunks = [
      buyFarmSeeds,
      unlockFarmPlot,
      plantFarmCrop,
      waterFarmPlot,
      fertilizeFarmPlot,
      harvestFarmPlot,
      sellFarmCrops,
      upgradeFarm,
    ];

    builder
      .addCase(fetchFarm.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFarm.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchFarm.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.payload ?? 'Failed to load farm');
      });

    for (const t of thunks) {
      builder
        .addCase(t.pending, (state) => {
          state.acting = true;
          state.error = null;
        })
        .addCase(t.fulfilled, (state, action) => {
          state.acting = false;
          state.data = action.payload;
        })
        .addCase(t.rejected, (state, action) => {
          state.acting = false;
          state.error = String(action.payload ?? 'Action failed');
        });
    }
  },
});

export const { clearFarmError } = farmSlice.actions;
export default farmSlice.reducer;
