import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { mallService } from '@/services/mallService';
import { MallsDashboardData, MallTier, MallUnitType } from '@/types/mall.types';

interface MallState {
  data: MallsDashboardData | null;
  loading: boolean;
  acting: boolean;
  error: string | null;
}

const initialState: MallState = {
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

export const fetchMalls = createAsyncThunk('malls/fetch', async (_, { rejectWithValue }) => {
  try {
    return await mallService.getDashboard();
  } catch (err) {
    return rejectWithValue(extractError(err, 'Failed to load shopping malls'));
  }
});

export const purchaseMallLand = createAsyncThunk(
  'malls/purchaseLand',
  async (
    payload: { locationId: number; parcelName: string; maxFloors: number },
    { rejectWithValue }
  ) => {
    try {
      return await mallService.purchaseLand(payload);
    } catch (err) {
      return rejectWithValue(extractError(err, 'Failed to purchase commercial land'));
    }
  }
);

export const constructMall = createAsyncThunk(
  'malls/construct',
  async (
    payload: { mallLandId: number; name: string; mallTier: MallTier },
    { rejectWithValue }
  ) => {
    try {
      return await mallService.constructMall(payload);
    } catch (err) {
      return rejectWithValue(extractError(err, 'Failed to construct shopping mall'));
    }
  }
);

export const addMallFloor = createAsyncThunk(
  'malls/addFloor',
  async (mallId: number, { rejectWithValue }) => {
    try {
      return await mallService.addFloor(mallId);
    } catch (err) {
      return rejectWithValue(extractError(err, 'Failed to add floor'));
    }
  }
);

export const upgradeMallParking = createAsyncThunk(
  'malls/upgradeParking',
  async (mallId: number, { rejectWithValue }) => {
    try {
      return await mallService.upgradeParking(mallId);
    } catch (err) {
      return rejectWithValue(extractError(err, 'Failed to upgrade parking'));
    }
  }
);

export const createMallUnit = createAsyncThunk(
  'malls/createUnit',
  async (
    payload: {
      mallId: number;
      floorNumber: number;
      unitType: MallUnitType;
      unitName: string;
      occupancyStatus: 'VACANT' | 'LEASED' | 'SELF_OPERATED';
      tenantName?: string;
      monthlyRent?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      return await mallService.createUnit(payload.mallId, {
        floorNumber: payload.floorNumber,
        unitType: payload.unitType,
        unitName: payload.unitName,
        occupancyStatus: payload.occupancyStatus,
        tenantName: payload.tenantName,
        monthlyRent: payload.monthlyRent,
      });
    } catch (err) {
      return rejectWithValue(extractError(err, 'Failed to build mall unit'));
    }
  }
);

export const updateMallLease = createAsyncThunk(
  'malls/updateLease',
  async (
    payload: {
      mallId: number;
      unitId: number;
      occupancyStatus: 'VACANT' | 'LEASED' | 'SELF_OPERATED';
      tenantName: string | null;
      monthlyRent: number;
      leaseMonths: number;
    },
    { rejectWithValue }
  ) => {
    try {
      return await mallService.updateLease(payload.mallId, payload.unitId, {
        occupancyStatus: payload.occupancyStatus,
        tenantName: payload.tenantName,
        monthlyRent: payload.monthlyRent,
        leaseMonths: payload.leaseMonths,
      });
    } catch (err) {
      return rejectWithValue(extractError(err, 'Failed to update lease'));
    }
  }
);

export const collectMallRent = createAsyncThunk(
  'malls/collectRent',
  async (mallId: number, { rejectWithValue }) => {
    try {
      return await mallService.collectRent(mallId);
    } catch (err) {
      return rejectWithValue(extractError(err, 'Failed to collect mall income'));
    }
  }
);

const mallSlice = createSlice({
  name: 'malls',
  initialState,
  reducers: {
    clearMallError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMalls.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMalls.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchMalls.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    for (const thunk of [
      purchaseMallLand,
      constructMall,
      addMallFloor,
      upgradeMallParking,
      createMallUnit,
      updateMallLease,
      collectMallRent,
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

export const { clearMallError } = mallSlice.actions;
export default mallSlice.reducer;
