import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { inventoryService } from '@/services/inventoryService';
import { InventoryDashboardData } from '@/types/inventory.types';

interface InventoryState {
  data: InventoryDashboardData | null;
  loading: boolean;
  acting: boolean;
  error: string | null;
}

const initialState: InventoryState = {
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

export const fetchInventory = createAsyncThunk(
  'inventory/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await inventoryService.getDashboard();
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Failed to load inventory'));
    }
  }
);

export const buyInventoryItem = createAsyncThunk(
  'inventory/buy',
  async (
    { businessId, itemId, quantity }: { businessId: number; itemId: number; quantity: number },
    { rejectWithValue }
  ) => {
    try {
      return await inventoryService.buyItem(businessId, itemId, quantity);
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Purchase failed'));
    }
  }
);

export const sellInventoryItem = createAsyncThunk(
  'inventory/sell',
  async (
    { businessId, itemId, quantity }: { businessId: number; itemId: number; quantity: number },
    { rejectWithValue }
  ) => {
    try {
      return await inventoryService.sellItem(businessId, itemId, quantity);
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Sale failed'));
    }
  }
);

export const transferInventoryItem = createAsyncThunk(
  'inventory/transfer',
  async (
    {
      fromBusinessId,
      toBusinessId,
      itemId,
      quantity,
    }: { fromBusinessId: number; toBusinessId: number; itemId: number; quantity: number },
    { rejectWithValue }
  ) => {
    try {
      return await inventoryService.transferItem(fromBusinessId, toBusinessId, itemId, quantity);
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Transfer failed'));
    }
  }
);

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    clearInventoryError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventory.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.payload ?? 'Failed to load inventory');
      });

    for (const thunk of [buyInventoryItem, sellInventoryItem, transferInventoryItem]) {
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
          state.error = String(action.payload ?? 'Inventory action failed');
        });
    }
  },
});

export const { clearInventoryError } = inventorySlice.actions;
export default inventorySlice.reducer;
