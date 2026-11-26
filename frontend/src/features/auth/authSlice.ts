import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { setApiAccessToken } from '@/services/apiClient';
import { authService } from '@/services/authService';
import { GameOverview, PlayerProfile, PublicUser } from '@/types/auth.types';

interface AuthState {
  user: PublicUser | null;
  profile: PlayerProfile | null;
  overview: GameOverview | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  initializing: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  profile: null,
  overview: null,
  accessToken: null,
  isAuthenticated: false,
  initializing: true,
  loading: false,
  error: null,
};

function extractApiError(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    const msg = (err.response?.data as { error?: { message?: string } } | undefined)?.error
      ?.message;
    if (msg) return msg;
  }
  return err instanceof Error ? err.message : fallback;
}

export const registerUser = createAsyncThunk(
  'auth/register',
  async (
    payload: { email: string; username: string; password: string; displayName?: string },
    { rejectWithValue }
  ) => {
    try {
      const data = await authService.register(payload);
      setApiAccessToken(data.accessToken);
      return data;
    } catch (err) {
      return rejectWithValue(extractApiError(err, 'Registration failed'));
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (payload: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const data = await authService.login(payload);
      setApiAccessToken(data.accessToken);
      return data;
    } catch (err) {
      return rejectWithValue(extractApiError(err, 'Login failed'));
    }
  }
);

export const restoreSession = createAsyncThunk('auth/restore', async (_, { rejectWithValue }) => {
  try {
    const { accessToken } = await authService.refresh();
    setApiAccessToken(accessToken);
    const profileData = await authService.getProfile();
    return { accessToken, ...profileData };
  } catch {
    setApiAccessToken(null);
    return rejectWithValue('No active session');
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try {
    await authService.logout();
  } finally {
    setApiAccessToken(null);
  }
});

export const updatePlayerProfile = createAsyncThunk(
  'auth/updateProfile',
  async (payload: { displayName: string; avatarKey?: string }, { rejectWithValue }) => {
    try {
      return await authService.updateProfile(payload);
    } catch (err) {
      return rejectWithValue(extractApiError(err, 'Profile update failed'));
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.accessToken = action.payload.accessToken;
        state.user = action.payload.user;
        state.profile = action.payload.profile;
        state.overview = action.payload.overview;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.payload ?? 'Registration failed');
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.accessToken = action.payload.accessToken;
        state.user = action.payload.user;
        state.profile = action.payload.profile;
        state.overview = action.payload.overview;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.payload ?? 'Login failed');
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.initializing = false;
        state.isAuthenticated = true;
        state.accessToken = action.payload.accessToken;
        state.user = action.payload.user;
        state.profile = action.payload.profile;
        state.overview = action.payload.overview;
      })
      .addCase(restoreSession.rejected, (state) => {
        state.initializing = false;
        state.isAuthenticated = false;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.profile = null;
        state.overview = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(updatePlayerProfile.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.profile = action.payload.profile;
        state.overview = action.payload.overview;
      });
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
