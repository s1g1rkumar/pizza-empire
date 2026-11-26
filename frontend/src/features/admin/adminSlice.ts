import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { adminService } from '@/services/adminService';
import { setApiAccessToken } from '@/services/apiClient';
import {
  AdminAnalyticsData,
  AdminConfigData,
  AdminPlayerRow,
  AdminReportsData,
  AdminUserDTO,
} from '@/types/admin.types';

interface AdminState {
  adminUser: AdminUserDTO | null;
  analytics: AdminAnalyticsData | null;
  players: AdminPlayerRow[];
  config: AdminConfigData | null;
  reports: AdminReportsData | null;
  loading: boolean;
  acting: boolean;
  error: string | null;
}

const initialState: AdminState = {
  adminUser: null,
  analytics: null,
  players: [],
  config: null,
  reports: null,
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

export const adminLogin = createAsyncThunk(
  'admin/login',
  async (payload: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const result = await adminService.login(payload);
      setApiAccessToken(result.accessToken);
      return result.user;
    } catch (err) {
      return rejectWithValue(extractError(err, 'Admin authentication failed'));
    }
  }
);

export const fetchAdminAnalytics = createAsyncThunk(
  'admin/analytics',
  async (_, { rejectWithValue }) => {
    try {
      return await adminService.getAnalytics();
    } catch (err) {
      return rejectWithValue(extractError(err, 'Failed to load analytics'));
    }
  }
);

export const fetchAdminPlayers = createAsyncThunk(
  'admin/players',
  async (payload: { search?: string; status?: string } | undefined, { rejectWithValue }) => {
    try {
      return await adminService.getPlayers(payload?.search, payload?.status);
    } catch (err) {
      return rejectWithValue(extractError(err, 'Failed to load players'));
    }
  }
);

export const fetchAdminConfig = createAsyncThunk('admin/config', async (_, { rejectWithValue }) => {
  try {
    return await adminService.getConfig();
  } catch (err) {
    return rejectWithValue(extractError(err, 'Failed to load configuration'));
  }
});

export const fetchAdminReports = createAsyncThunk(
  'admin/reports',
  async (_, { rejectWithValue }) => {
    try {
      return await adminService.getReports();
    } catch (err) {
      return rejectWithValue(extractError(err, 'Failed to load reports'));
    }
  }
);

export const adminUpdatePlayerAccount = createAsyncThunk(
  'admin/updatePlayerAccount',
  async (
    payload: {
      userId: number;
      status?: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
      role?: 'PLAYER' | 'MODERATOR' | 'ADMIN';
      cashBalance?: number;
      gemsBalance?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      return await adminService.updatePlayerAccount(payload.userId, payload);
    } catch (err) {
      return rejectWithValue(extractError(err, 'Failed to update player account'));
    }
  }
);

export const adminUpdatePlayerProgression = createAsyncThunk(
  'admin/updatePlayerProgression',
  async (
    payload: {
      playerId: number;
      xpLevel?: number;
      currentXp?: number;
      stageNumber?: number;
      reputation?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      return await adminService.updatePlayerProgression(payload.playerId, payload);
    } catch (err) {
      return rejectWithValue(extractError(err, 'Failed to update player progression'));
    }
  }
);

export const adminUpdateSetting = createAsyncThunk(
  'admin/updateSetting',
  async (payload: { settingKey: string; settingValue: string }, { rejectWithValue }) => {
    try {
      return await adminService.updateSetting(payload.settingKey, payload.settingValue);
    } catch (err) {
      return rejectWithValue(extractError(err, 'Failed to update setting'));
    }
  }
);

export const adminUpdateCrop = createAsyncThunk(
  'admin/updateCrop',
  async (
    payload: {
      cropId: number;
      seedCost: number;
      growthSeconds: number;
      baseYield: number;
      marketSellPrice: number;
      unlockXpLevel: number;
    },
    { rejectWithValue }
  ) => {
    try {
      return await adminService.updateCrop(payload.cropId, payload);
    } catch (err) {
      return rejectWithValue(extractError(err, 'Failed to update crop'));
    }
  }
);

export const adminUpdateProduct = createAsyncThunk(
  'admin/updateProduct',
  async (
    payload: {
      itemId: number;
      unitWholesaleBuy: number;
      unitWholesaleSell: number;
      lowStockThreshold: number;
    },
    { rejectWithValue }
  ) => {
    try {
      return await adminService.updateProduct(payload.itemId, payload);
    } catch (err) {
      return rejectWithValue(extractError(err, 'Failed to update product'));
    }
  }
);

export const adminUpdateLocation = createAsyncThunk(
  'admin/updateLocation',
  async (
    payload: {
      locationId: number;
      demandMultiplier: number;
      rentMultiplier: number;
      priceElasticity: number;
    },
    { rejectWithValue }
  ) => {
    try {
      return await adminService.updateLocation(payload.locationId, payload);
    } catch (err) {
      return rejectWithValue(extractError(err, 'Failed to update location'));
    }
  }
);

export const adminUpdateUpgrade = createAsyncThunk(
  'admin/updateUpgrade',
  async (
    payload: {
      upgradeId: number;
      baseCost: number;
      costMultiplier: number;
      effectValue: number;
      maxLevel: number;
      isActive: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      return await adminService.updateUpgrade(payload.upgradeId, payload);
    } catch (err) {
      return rejectWithValue(extractError(err, 'Failed to update upgrade'));
    }
  }
);

export const adminUpdateMission = createAsyncThunk(
  'admin/updateMission',
  async (
    payload: {
      missionId: number;
      targetValue: number;
      rewardCash: number;
      rewardXp: number;
      rewardGems: number;
      isActive: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      return await adminService.updateMission(payload.missionId, payload);
    } catch (err) {
      return rejectWithValue(extractError(err, 'Failed to update mission'));
    }
  }
);

export const adminUpdateAchievement = createAsyncThunk(
  'admin/updateAchievement',
  async (
    payload: {
      achievementId: number;
      targetValue: number;
      rewardCash: number;
      rewardXp: number;
      rewardGems: number;
      isActive: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      return await adminService.updateAchievement(payload.achievementId, payload);
    } catch (err) {
      return rejectWithValue(extractError(err, 'Failed to update achievement'));
    }
  }
);

export const adminCreateAnnouncement = createAsyncThunk(
  'admin/createAnnouncement',
  async (
    payload: {
      title: string;
      message: string;
      severity: 'INFO' | 'WARNING' | 'EVENT' | 'MAINTENANCE';
    },
    { rejectWithValue }
  ) => {
    try {
      return await adminService.createAnnouncement(payload);
    } catch (err) {
      return rejectWithValue(extractError(err, 'Failed to publish announcement'));
    }
  }
);

export const adminToggleAnnouncement = createAsyncThunk(
  'admin/toggleAnnouncement',
  async (payload: { announcementId: number; isActive: boolean }, { rejectWithValue }) => {
    try {
      return await adminService.toggleAnnouncement(payload.announcementId, payload.isActive);
    } catch (err) {
      return rejectWithValue(extractError(err, 'Failed to toggle announcement'));
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    adminLogout(state) {
      state.adminUser = null;
      setApiAccessToken(null);
    },
    clearAdminError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(adminLogin.pending, (state) => {
        state.acting = true;
        state.error = null;
      })
      .addCase(adminLogin.fulfilled, (state, action) => {
        state.acting = false;
        state.adminUser = action.payload;
      })
      .addCase(adminLogin.rejected, (state, action) => {
        state.acting = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAdminAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchAdminAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAdminPlayers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminPlayers.fulfilled, (state, action) => {
        state.loading = false;
        state.players = action.payload;
      })
      .addCase(fetchAdminPlayers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAdminConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.config = action.payload;
      })
      .addCase(fetchAdminConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAdminReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminReports.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = action.payload;
      })
      .addCase(fetchAdminReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(adminUpdatePlayerAccount.pending, (state) => {
        state.acting = true;
        state.error = null;
      })
      .addCase(adminUpdatePlayerAccount.fulfilled, (state, action) => {
        state.acting = false;
        state.players = action.payload;
      })
      .addCase(adminUpdatePlayerAccount.rejected, (state, action) => {
        state.acting = false;
        state.error = action.payload as string;
      })
      .addCase(adminUpdatePlayerProgression.pending, (state) => {
        state.acting = true;
        state.error = null;
      })
      .addCase(adminUpdatePlayerProgression.fulfilled, (state, action) => {
        state.acting = false;
        state.players = action.payload;
      })
      .addCase(adminUpdatePlayerProgression.rejected, (state, action) => {
        state.acting = false;
        state.error = action.payload as string;
      });

    for (const cfgThunk of [
      adminUpdateSetting,
      adminUpdateCrop,
      adminUpdateProduct,
      adminUpdateLocation,
      adminUpdateUpgrade,
      adminUpdateMission,
      adminUpdateAchievement,
      adminCreateAnnouncement,
      adminToggleAnnouncement,
    ]) {
      builder
        .addCase(cfgThunk.pending, (state) => {
          state.acting = true;
          state.error = null;
        })
        .addCase(cfgThunk.fulfilled, (state, action) => {
          state.acting = false;
          state.config = action.payload;
        })
        .addCase(cfgThunk.rejected, (state, action) => {
          state.acting = false;
          state.error = action.payload as string;
        });
    }
  },
});

export const { adminLogout, clearAdminError } = adminSlice.actions;
export default adminSlice.reducer;
