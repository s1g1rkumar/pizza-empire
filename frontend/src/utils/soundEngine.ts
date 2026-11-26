export type SoundEffectType =
  'coin' | 'harvest' | 'production' | 'upgrade' | 'achievement' | 'levelup';

const STORAGE_KEY = 'pizza_empire_audio_prefs';

interface AudioPrefs {
  sfxMuted: boolean;
  musicEnabled: boolean;
}

export function loadAudioPrefs(): AudioPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { sfxMuted: false, musicEnabled: false };
    const parsed = JSON.parse(raw) as Partial<AudioPrefs>;
    return {
      sfxMuted: Boolean(parsed.sfxMuted),
      musicEnabled: Boolean(parsed.musicEnabled),
    };
  } catch {
    return { sfxMuted: false, musicEnabled: false };
  }
}

export function saveAudioPrefs(prefs: AudioPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private musicTimer: number | null = null;
  private sfxMuted = loadAudioPrefs().sfxMuted;
  private musicEnabled = loadAudioPrefs().musicEnabled;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => undefined);
    }
    return this.ctx;
  }

  private playTone(
    freq: number,
    durationSec: number,
    startOffsetSec = 0,
    type: OscillatorType = 'sine',
    volume = 0.08
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + startOffsetSec;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durationSec + 0.02);
  }

  play(effect: SoundEffectType): void {
    if (this.musicEnabled && this.musicTimer === null) {
      this.startMusicLoop();
    }
    if (this.sfxMuted) return;

    switch (effect) {
      case 'coin':
        this.playTone(987.77, 0.09, 0, 'triangle', 0.07);
        this.playTone(1318.51, 0.16, 0.07, 'triangle', 0.07);
        break;
      case 'harvest':
        this.playTone(440, 0.1, 0, 'sine', 0.07);
        this.playTone(554.37, 0.14, 0.08, 'sine', 0.07);
        break;
      case 'production':
        this.playTone(587.33, 0.12, 0, 'triangle', 0.07);
        this.playTone(880, 0.2, 0.1, 'triangle', 0.06);
        break;
      case 'upgrade':
        this.playTone(523.25, 0.09, 0, 'triangle', 0.07);
        this.playTone(659.25, 0.09, 0.08, 'triangle', 0.07);
        this.playTone(783.99, 0.18, 0.16, 'triangle', 0.08);
        break;
      case 'achievement':
        this.playTone(523.25, 0.12, 0, 'sine', 0.08);
        this.playTone(659.25, 0.12, 0.1, 'sine', 0.08);
        this.playTone(783.99, 0.12, 0.2, 'sine', 0.08);
        this.playTone(1046.5, 0.3, 0.3, 'sine', 0.09);
        break;
      case 'levelup':
        this.playTone(440, 0.11, 0, 'triangle', 0.08);
        this.playTone(554.37, 0.11, 0.1, 'triangle', 0.08);
        this.playTone(659.25, 0.11, 0.2, 'triangle', 0.08);
        this.playTone(880, 0.35, 0.3, 'triangle', 0.09);
        break;
    }
  }

  setSfxMuted(muted: boolean): void {
    this.sfxMuted = muted;
    saveAudioPrefs({ sfxMuted: this.sfxMuted, musicEnabled: this.musicEnabled });
  }

  setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    saveAudioPrefs({ sfxMuted: this.sfxMuted, musicEnabled: this.musicEnabled });
    if (enabled) {
      this.startMusicLoop();
    } else {
      this.stopMusicLoop();
    }
  }

  private startMusicLoop(): void {
    if (typeof window === 'undefined' || this.musicTimer !== null) return;

    const chords = [
      [261.63, 329.63, 392.0], // Cmaj
      [220.0, 261.63, 329.63], // Am
      [174.61, 220.0, 261.63], // Fmaj
      [196.0, 246.94, 293.66], // Gmaj
    ];
    let step = 0;

    const playBar = () => {
      if (!this.musicEnabled) return;
      const chord = chords[step % chords.length];
      if (!chord) return;
      chord.forEach((freq, idx) => {
        this.playTone(freq, 1.8, idx * 0.08, 'sine', 0.02);
      });
      step += 1;
    };

    playBar();
    this.musicTimer = window.setInterval(playBar, 2400);
  }

  private stopMusicLoop(): void {
    if (this.musicTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const soundEngine = new SoundEngine();
