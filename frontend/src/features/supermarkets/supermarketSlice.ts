import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { supermarketService } from '@/services/supermarketService';
import {
  SupermarketsDashboardData,
  SupermarketTier,
  SupermarketUpgradeType,
} from '@/types/supermarket.types';

interface SupermarketState {
  data: SupermarketsDashboardData | null;
  loading: boolean;
  acting: boolean;
  error: string | null;
}

const initialState: SupermarketState = {
  data: null,
  loading: false,
  acting: false,
  error: null,
};

const extractError = (err: unknown, fallback: string): string => {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const res = (err as { response?: { data?: { message?: string } } }).response;
    if (res?.data?.message) return res.data.message;
  }
  return fallback;
};

export const fetchSupermarkets = createAsyncThunk(
  'supermarkets/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await supermarketService.getDashboard();
    } catch (err) {
      return rejectWithValue(extractError(err, 'Failed to load supermarkets'));
    }
  }
);

export const constructSupermarket = createAsyncThunk(
  'supermarkets/construct',
  async (
    payload: { name: string; storeTier: SupermarketTier; locationId: number },
    { rejectWithValue }
  ) => {
    try {
      return await supermarketService.construct(payload);
    } catch (err) {
      return rejectWithValue(extractError(err, 'Failed to construct supermarket'));
    }
  }
);

export const purchaseSupermarketProduct = createAsyncThunk(
  'supermarkets/purchase',
  async (
    payload: { supermarketId: number; itemId: number; quantity: number },
    { rejectWithValue }
  ) => {
    try {
      return await supermarketService.purchaseProduct(payload.supermarketId, {
        itemId: payload.itemId,
        quantity: payload.quantity,
      });
    } catch (err) {
      return rejectWithValue(extractError(err, 'Failed to purchase wholesale product'));
    }
  }
);

export const supplySupermarketFromFactory = createAsyncThunk(
  'supermarkets/supplyFromFactory',
  async (
    payload: { supermarketId: number; factoryId: number; itemId: number; quantity: number },
    { rejectWithValue }
  ) => {
    try {
      return await supermarketService.supplyFromFactory(payload.supermarketId, {
        factoryId: payload.factoryId,
        itemId: payload.itemId,
        quantity: payload.quantity,
      });
    } catch (err) {
      return rejectWithValue(extractError(err, 'Failed to transfer factory stock'));
    }
  }
);

export const updateSupermarketListing = createAsyncThunk(
  'supermarkets/updateListing',
  async (
    payload: { supermarketId: number; itemId: number; customPrice: number; isEnabled: boolean },
    { rejectWithValue }
  ) => {
    try {
      return await supermarketService.updateListing(payload.supermarketId, payload.itemId, {
        customPrice: payload.customPrice,
        isEnabled: payload.isEnabled,
      });
    } catch (err) {
      return rejectWithValue(extractError(err, 'Failed to update product pricing'));
    }
  }
);

export const upgradeSupermarket = createAsyncThunk(
  'supermarkets/upgrade',
  async (
    payload: { supermarketId: number; upgradeType: SupermarketUpgradeType },
    { rejectWithValue }
  ) => {
    try {
      return await supermarketService.upgrade(payload.supermarketId, payload.upgradeType);
    } catch (err) {
      return rejectWithValue(extractError(err, 'Failed to upgrade supermarket'));
    }
  }
);

export const assignSupermarketEmployee = createAsyncThunk(
  'supermarkets/assignEmployee',
  async (payload: { supermarketId: number; employeeId: number }, { rejectWithValue }) => {
    try {
      return await supermarketService.assignEmployee(payload.supermarketId, payload.employeeId);
    } catch (err) {
      return rejectWithValue(extractError(err, 'Failed to assign employee'));
    }
  }
);

export const runSupermarketSales = createAsyncThunk(
  'supermarkets/runSales',
  async (supermarketId: number, { rejectWithValue }) => {
    try {
      return await supermarketService.runSales(supermarketId);
    } catch (err) {
      return rejectWithValue(extractError(err, 'Failed to process supermarket sales'));
    }
  }
);

const supermarketSlice = createSlice({
  name: 'supermarkets',
  initialState,
  reducers: {
    clearSupermarketError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSupermarkets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSupermarkets.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchSupermarkets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    for (const thunk of [
      constructSupermarket,
      purchaseSupermarketProduct,
      supplySupermarketFromFactory,
      updateSupermarketListing,
      upgradeSupermarket,
      assignSupermarketEmployee,
      runSupermarketSales,
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
          state.error = action.payload as string;
        });
    }
  },
});

export const { clearSupermarketError } = supermarketSlice.actions;
export default supermarketSlice.reducer;
