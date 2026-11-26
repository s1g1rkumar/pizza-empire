import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { progressionService } from '@/services/progressionService';
import { ProgressionDashboardData } from '@/types/progression.types';

interface ProgressionState {
  data: ProgressionDashboardData | null;
  loading: boolean;
  acting: boolean;
  error: string | null;
}

const initialState: ProgressionState = {
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

export const fetchProgression = createAsyncThunk(
  'progression/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await progressionService.getDashboard();
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Failed to load progression'));
    }
  }
);

export const unlockNextStage = createAsyncThunk(
  'progression/unlockStage',
  async (_, { rejectWithValue }) => {
    try {
      return await progressionService.unlockNextLevel();
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Unable to unlock next stage'));
    }
  }
);

export const claimMissionReward = createAsyncThunk(
  'progression/claimMission',
  async (missionId: number, { rejectWithValue }) => {
    try {
      return await progressionService.claimMission(missionId);
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Failed to claim mission reward'));
    }
  }
);

export const claimAchievementReward = createAsyncThunk(
  'progression/claimAchievement',
  async (achievementId: number, { rejectWithValue }) => {
    try {
      return await progressionService.claimAchievement(achievementId);
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Failed to claim achievement reward'));
    }
  }
);

const progressionSlice = createSlice({
  name: 'progression',
  initialState,
  reducers: {
    clearProgressionError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProgression.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProgression.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchProgression.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.payload ?? 'Failed to load progression');
      });

    for (const thunk of [unlockNextStage, claimMissionReward, claimAchievementReward]) {
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

export const { clearProgressionError } = progressionSlice.actions;
export default progressionSlice.reducer;
