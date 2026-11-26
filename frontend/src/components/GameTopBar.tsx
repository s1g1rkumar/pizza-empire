import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Bell, Coins, Menu, Music, Star, User, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { markNotificationsRead } from '@/features/dashboard/dashboardSlice';
import {
  clearCurrencyDelta,
  toggleBackgroundMusic,
  toggleSfxMute,
} from '@/features/experience/experienceSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';

interface GameTopBarProps {
  onOpenMobileMenu: () => void;
}

export function GameTopBar({ onOpenMobileMenu }: GameTopBarProps) {
  const dispatch = useAppDispatch();
  const { data } = useAppSelector((state) => state.dashboard);
  const { data: farmData } = useAppSelector((state) => state.farm);
  const { profile: authProfile, overview } = useAppSelector((state) => state.auth);
  const { currencyDelta, sfxMuted, musicEnabled } = useAppSelector((state) => state.experience);
  const shouldReduceMotion = useReducedMotion();
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    if (!currencyDelta) return;
    const timer = window.setTimeout(() => {
      dispatch(clearCurrencyDelta());
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [currencyDelta, dispatch]);

  const levelNumber = data?.progression.currentLevelNumber ?? overview?.currentLevelNumber ?? 1;
  const levelName =
    data?.progression.currentLevelName ?? overview?.currentLevelName ?? 'Small Farmer';
  const xpLevel = farmData?.player.xpLevel ?? data?.progression.xpLevel ?? overview?.xpLevel ?? 1;
  const currentXp = data?.progression.currentXp ?? overview?.currentXp ?? 0;
  const nextLevelXp = data?.progression.nextLevelXp ?? 100;
  const xpPercent = Math.min(100, Math.round((currentXp / Math.max(1, nextLevelXp)) * 100));

  const cashBalance =
    farmData?.player.cashBalance ?? data?.profile.cashBalance ?? authProfile?.cashBalance ?? 0;
  const displayName = data?.profile.displayName ?? authProfile?.displayName ?? 'Player';
  const unreadCount = data?.notifications.unreadCount ?? overview?.unreadNotificationsCount ?? 0;
  const notifications = data?.notifications.items ?? [];

  const handleToggleNotifs = () => {
    const nextOpen = !notifOpen;
    setNotifOpen(nextOpen);
    if (nextOpen && unreadCount > 0) {
      void dispatch(markNotificationsRead());
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[#49352A]/10 bg-[#FFF7E8]/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="rounded-xl border border-[#49352A]/15 bg-white p-2 text-[#49352A] lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 rounded-xl bg-[#FFC857]/30 px-3 py-1.5">
            <Star className="h-4 w-4 text-[#E94B35]" />
            <span className="text-xs font-extrabold text-[#49352A]">
              Stage {levelNumber}: {levelName}
            </span>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-xs font-bold text-[#49352A]">XP Lv {xpLevel}</span>
            <div className="h-2.5 w-28 overflow-hidden rounded-full bg-[#49352A]/15">
              <div
                className="h-full rounded-full bg-[#F28C38] transition-all"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <span className="text-[11px] font-medium text-[#49352A]/70">
              {currentXp}/{nextLevelXp}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex items-center gap-1.5 rounded-xl bg-[#58A66A]/15 px-3 py-1.5 text-sm font-extrabold text-[#49352A]">
            <Coins className="h-4 w-4 text-[#58A66A]" />
            <span>${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            <AnimatePresence>
              {currencyDelta && (
                <motion.span
                  key={currencyDelta.id}
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: -14 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  aria-live="polite"
                  className={`pointer-events-none absolute -top-2 right-1 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold shadow-sm ${
                    currencyDelta.amount >= 0
                      ? 'bg-[#2E8B57] text-white'
                      : 'bg-[#E94B35] text-white'
                  }`}
                >
                  {currencyDelta.amount >= 0 ? '+' : '-'}$
                  {Math.abs(currencyDelta.amount).toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={() => dispatch(toggleSfxMute())}
            aria-pressed={!sfxMuted}
            aria-label={sfxMuted ? 'Unmute sound effects' : 'Mute sound effects'}
            title={sfxMuted ? 'Sound Effects Muted' : 'Sound Effects On'}
            className={`rounded-xl border p-2 transition ${
              sfxMuted
                ? 'border-[#49352A]/15 bg-white text-[#49352A]/50'
                : 'border-[#FFC857] bg-[#FFC857]/25 text-[#49352A]'
            }`}
          >
            {sfxMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => dispatch(toggleBackgroundMusic())}
            aria-pressed={musicEnabled}
            aria-label={musicEnabled ? 'Disable background music' : 'Enable background music'}
            title={musicEnabled ? 'Background Music On' : 'Background Music Off'}
            className={`rounded-xl border p-2 transition ${
              musicEnabled
                ? 'border-[#58A66A] bg-[#58A66A]/20 text-[#2E8B57]'
                : 'border-[#49352A]/15 bg-white text-[#49352A]/50'
            }`}
          >
            <Music className="h-4 w-4" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={handleToggleNotifs}
              className="relative rounded-xl border border-[#49352A]/15 bg-white p-2 text-[#49352A] transition hover:bg-[#FFC857]/20"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E94B35] px-1 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-[#49352A]/15 bg-white p-4 shadow-xl">
                <p className="mb-2 text-xs font-bold tracking-wide text-[#49352A]/70 uppercase">
                  Notifications
                </p>
                {notifications.length === 0 ? (
                  <p className="py-3 text-center text-xs text-[#49352A]/60">
                    No notifications yet.
                  </p>
                ) : (
                  <ul className="max-h-60 space-y-2 overflow-y-auto">
                    {notifications.map((n) => (
                      <li
                        key={n.id}
                        className="rounded-xl border border-[#49352A]/10 bg-[#FFF7E8]/60 p-2.5 text-xs"
                      >
                        <p className="font-bold text-[#49352A]">{n.title}</p>
                        <p className="mt-0.5 text-[#49352A]/75">{n.message}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <Link
            to="/profile"
            className="flex items-center gap-2 rounded-xl border border-[#49352A]/15 bg-white px-3 py-1.5 text-xs font-bold text-[#49352A] transition hover:border-[#F28C38]"
          >
            <User className="h-4 w-4 text-[#E94B35]" />
            <span className="hidden sm:inline">{displayName}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
