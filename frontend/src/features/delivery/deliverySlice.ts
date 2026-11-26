import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { deliveryService } from '@/services/deliveryService';
import { DeliveryDashboardData, VehicleType } from '@/types/delivery.types';

interface DeliveryState {
  data: DeliveryDashboardData | null;
  loading: boolean;
  acting: boolean;
  error: string | null;
}

const initialState: DeliveryState = {
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

export const fetchDelivery = createAsyncThunk('delivery/fetch', async (_, { rejectWithValue }) => {
  try {
    return await deliveryService.getDashboard();
  } catch (err) {
    return rejectWithValue(extractErr(err, 'Failed to load delivery dashboard'));
  }
});

export const buyDeliveryVehicle = createAsyncThunk(
  'delivery/buyVehicle',
  async (
    { vehicleType, name }: { vehicleType: VehicleType; name: string },
    { rejectWithValue }
  ) => {
    try {
      return await deliveryService.buyVehicle(vehicleType, name);
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Vehicle purchase failed'));
    }
  }
);

export const upgradeDeliveryVehicle = createAsyncThunk(
  'delivery/upgradeVehicle',
  async (vehicleId: number, { rejectWithValue }) => {
    try {
      return await deliveryService.upgradeVehicle(vehicleId);
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Vehicle upgrade failed'));
    }
  }
);

export const dispatchDeliveryOrder = createAsyncThunk(
  'delivery/dispatch',
  async (
    payload: {
      restaurantId: number;
      itemId: number;
      quantity: number;
      zoneId: number;
      vehicleId: number;
      driverEmployeeId?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      return await deliveryService.dispatchOrder(payload);
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Dispatch failed'));
    }
  }
);

const deliverySlice = createSlice({
  name: 'delivery',
  initialState,
  reducers: {
    clearDeliveryError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDelivery.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDelivery.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchDelivery.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.payload ?? 'Failed to load delivery');
      });

    for (const thunk of [buyDeliveryVehicle, upgradeDeliveryVehicle, dispatchDeliveryOrder]) {
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

export const { clearDeliveryError } = deliverySlice.actions;
export default deliverySlice.reducer;
