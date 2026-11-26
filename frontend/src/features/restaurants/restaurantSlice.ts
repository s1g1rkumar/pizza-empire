import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { restaurantService } from '@/services/restaurantService';
import { RestaurantsDashboardData, RestaurantType } from '@/types/restaurant.types';

interface RestaurantState {
  data: RestaurantsDashboardData | null;
  loading: boolean;
  acting: boolean;
  error: string | null;
}

const initialState: RestaurantState = {
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

export const fetchRestaurants = createAsyncThunk(
  'restaurants/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await restaurantService.getDashboard();
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Failed to load restaurants'));
    }
  }
);

export const constructRestaurant = createAsyncThunk(
  'restaurants/construct',
  async (
    {
      name,
      restaurantType,
      locationId,
    }: { name: string; restaurantType: RestaurantType; locationId: number },
    { rejectWithValue }
  ) => {
    try {
      return await restaurantService.construct(name, restaurantType, locationId);
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Construction failed'));
    }
  }
);

export const upgradeRestaurant = createAsyncThunk(
  'restaurants/upgrade',
  async (
    {
      restaurantId,
      upgradeType,
    }: { restaurantId: number; upgradeType: 'OVEN' | 'TABLES' | 'DECOR' },
    { rejectWithValue }
  ) => {
    try {
      return await restaurantService.upgrade(restaurantId, upgradeType);
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Upgrade failed'));
    }
  }
);

export const updateRestaurantMenu = createAsyncThunk(
  'restaurants/updateMenu',
  async (
    {
      restaurantId,
      menuId,
      updates,
    }: {
      restaurantId: number;
      menuId: number;
      updates: { customPrice?: number; isEnabled?: boolean; upgradeStarQuality?: boolean };
    },
    { rejectWithValue }
  ) => {
    try {
      return await restaurantService.updateMenu(restaurantId, menuId, updates);
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Menu update failed'));
    }
  }
);

export const serveRestaurantCustomers = createAsyncThunk(
  'restaurants/serve',
  async (restaurantId: number, { rejectWithValue }) => {
    try {
      return await restaurantService.serve(restaurantId);
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Unable to serve customers'));
    }
  }
);

const restaurantSlice = createSlice({
  name: 'restaurants',
  initialState,
  reducers: {
    clearRestaurantError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRestaurants.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRestaurants.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchRestaurants.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.payload ?? 'Failed to load restaurants');
      });

    for (const thunk of [
      constructRestaurant,
      upgradeRestaurant,
      updateRestaurantMenu,
      serveRestaurantCustomers,
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

export const { clearRestaurantError } = restaurantSlice.actions;
export default restaurantSlice.reducer;
