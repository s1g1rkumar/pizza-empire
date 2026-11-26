import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { loadAudioPrefs, soundEngine } from '@/utils/soundEngine';

export type ToastKind = 'NOTIFICATION' | 'PRODUCTION' | 'HARVEST' | 'MISSION' | 'UPGRADE';

export interface GameToast {
  id: string;
  kind: ToastKind;
  title: string;
  message: string;
  createdAt: number;
}

export interface AchievementPopup {
  id: string;
  title: string;
  message: string;
}

export interface LevelUpBanner {
  id: string;
  title: string;
  subtitle: string;
}

export interface CurrencyDelta {
  id: number;
  amount: number;
}

interface ExperienceState {
  toasts: GameToast[];
  achievementPopup: AchievementPopup | null;
  levelUpBanner: LevelUpBanner | null;
  currencyDelta: CurrencyDelta | null;
  sfxMuted: boolean;
  musicEnabled: boolean;
}

const prefs = loadAudioPrefs();

const initialState: ExperienceState = {
  toasts: [],
  achievementPopup: null,
  levelUpBanner: null,
  currencyDelta: null,
  sfxMuted: prefs.sfxMuted,
  musicEnabled: prefs.musicEnabled,
};

const experienceSlice = createSlice({
  name: 'experience',
  initialState,
  reducers: {
    pushToast(state, action: PayloadAction<Omit<GameToast, 'id' | 'createdAt'>>) {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      state.toasts = [...state.toasts.slice(-3), { ...action.payload, id, createdAt: Date.now() }];
    },
    dismissToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    showAchievementPopup(state, action: PayloadAction<{ title: string; message: string }>) {
      state.achievementPopup = {
        id: `${Date.now()}`,
        title: action.payload.title,
        message: action.payload.message,
      };
    },
    dismissAchievementPopup(state) {
      state.achievementPopup = null;
    },
    showLevelUpBanner(state, action: PayloadAction<{ title: string; subtitle: string }>) {
      state.levelUpBanner = {
        id: `${Date.now()}`,
        title: action.payload.title,
        subtitle: action.payload.subtitle,
      };
    },
    dismissLevelUpBanner(state) {
      state.levelUpBanner = null;
    },
    triggerCurrencyDelta(state, action: PayloadAction<number>) {
      if (Math.abs(action.payload) < 0.01) return;
      state.currencyDelta = {
        id: Date.now(),
        amount: Number(action.payload.toFixed(2)),
      };
    },
    clearCurrencyDelta(state) {
      state.currencyDelta = null;
    },
    toggleSfxMute(state) {
      state.sfxMuted = !state.sfxMuted;
      soundEngine.setSfxMuted(state.sfxMuted);
    },
    toggleBackgroundMusic(state) {
      state.musicEnabled = !state.musicEnabled;
      soundEngine.setMusicEnabled(state.musicEnabled);
    },
  },
});

export const {
  pushToast,
  dismissToast,
  showAchievementPopup,
  dismissAchievementPopup,
  showLevelUpBanner,
  dismissLevelUpBanner,
  triggerCurrencyDelta,
  clearCurrencyDelta,
  toggleSfxMute,
  toggleBackgroundMusic,
} = experienceSlice.actions;

export default experienceSlice.reducer;
