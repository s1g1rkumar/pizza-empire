import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { factoryService } from '@/services/factoryService';
import { FactoriesDashboardData, FactoryType } from '@/types/factory.types';

interface FactoryState {
  data: FactoriesDashboardData | null;
  loading: boolean;
  acting: boolean;
  error: string | null;
}

const initialState: FactoryState = {
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

export const fetchFactories = createAsyncThunk(
  'factories/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await factoryService.getDashboard();
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Failed to load factories'));
    }
  }
);

export const constructFactory = createAsyncThunk(
  'factories/construct',
  async (
    {
      name,
      factoryType,
      locationId,
    }: { name: string; factoryType: FactoryType; locationId: number },
    { rejectWithValue }
  ) => {
    try {
      return await factoryService.construct(name, factoryType, locationId);
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Factory construction failed'));
    }
  }
);

export const purchaseFactoryMachine = createAsyncThunk(
  'factories/machine',
  async (factoryId: number, { rejectWithValue }) => {
    try {
      return await factoryService.purchaseMachine(factoryId);
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Machine purchase failed'));
    }
  }
);

export const upgradeFactoryStorage = createAsyncThunk(
  'factories/storage',
  async (factoryId: number, { rejectWithValue }) => {
    try {
      return await factoryService.upgradeStorage(factoryId);
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Storage upgrade failed'));
    }
  }
);

export const startFactoryBatch = createAsyncThunk(
  'factories/startBatch',
  async ({ factoryId, quantity }: { factoryId: number; quantity: number }, { rejectWithValue }) => {
    try {
      return await factoryService.startOrder(factoryId, quantity);
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Batch start failed'));
    }
  }
);

export const transferFactoryOutput = createAsyncThunk(
  'factories/transfer',
  async (
    {
      factoryId,
      toBusinessId,
      itemId,
      quantity,
    }: { factoryId: number; toBusinessId: number; itemId: number; quantity: number },
    { rejectWithValue }
  ) => {
    try {
      return await factoryService.transferOutput(factoryId, toBusinessId, itemId, quantity);
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Transfer failed'));
    }
  }
);

const factorySlice = createSlice({
  name: 'factories',
  initialState,
  reducers: {
    clearFactoryError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFactories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFactories.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchFactories.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.payload ?? 'Failed to load factories');
      });

    for (const thunk of [
      constructFactory,
      purchaseFactoryMachine,
      upgradeFactoryStorage,
      startFactoryBatch,
      transferFactoryOutput,
    ]) {
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

export const { clearFactoryError } = factorySlice.actions;
export default factorySlice.reducer;
