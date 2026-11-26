import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpCircle, Award, Bell, Cog, Sprout, Star, Target, X } from 'lucide-react';
import { useEffect } from 'react';
import {
  dismissAchievementPopup,
  dismissLevelUpBanner,
  dismissToast,
  ToastKind,
} from '@/features/experience/experienceSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';

const TOAST_STYLE: Record<ToastKind, { icon: typeof Bell; color: string }> = {
  NOTIFICATION: { icon: Bell, color: 'text-[#49352A] bg-[#FFC857]/25' },
  PRODUCTION: { icon: Cog, color: 'text-[#E94B35] bg-[#E94B35]/15' },
  HARVEST: { icon: Sprout, color: 'text-[#2E8B57] bg-[#2E8B57]/15' },
  MISSION: { icon: Target, color: 'text-[#F28C38] bg-[#F28C38]/15' },
  UPGRADE: { icon: ArrowUpCircle, color: 'text-[#2E8B57] bg-[#2E8B57]/15' },
};

export function GameExperienceOverlay() {
  const dispatch = useAppDispatch();
  const shouldReduceMotion = useReducedMotion();
  const { toasts, achievementPopup, levelUpBanner } = useAppSelector((state) => state.experience);

  useEffect(() => {
    const firstToast = toasts[0];
    if (!firstToast) return;
    const timer = window.setTimeout(() => {
      dispatch(dismissToast(firstToast.id));
    }, 4200);
    return () => window.clearTimeout(timer);
  }, [toasts, dispatch]);

  useEffect(() => {
    if (!achievementPopup) return;
    const timer = window.setTimeout(() => {
      dispatch(dismissAchievementPopup());
    }, 5500);
    return () => window.clearTimeout(timer);
  }, [achievementPopup, dispatch]);

  return (
    <>
      {/* Accessible Live Toast Stack */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-full max-w-xs flex-col gap-2 sm:max-w-sm"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const cfg = TOAST_STYLE[toast.kind] ?? TOAST_STYLE.NOTIFICATION;
            const Icon = cfg.icon;
            return (
              <motion.div
                key={toast.id}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-[#49352A]/15 bg-white p-3.5 shadow-lg"
              >
                <div className={`rounded-xl p-2 ${cfg.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold text-[#49352A]">{toast.title}</p>
                  <p className="mt-0.5 text-[11px] text-[#49352A]/75">{toast.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => dispatch(dismissToast(toast.id))}
                  aria-label="Dismiss notification"
                  className="rounded-lg p-1 text-[#49352A]/50 hover:bg-[#49352A]/10 hover:text-[#49352A]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Achievement Popup */}
      <AnimatePresence>
        {achievementPopup && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            className="fixed top-20 left-1/2 z-50 flex w-[90%] max-w-sm -translate-x-1/2 items-center gap-3 rounded-2xl border-2 border-[#FFC857] bg-[#49352A] px-4 py-3 text-[#FFF7E8] shadow-2xl"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFC857] text-[#49352A]">
              <Award className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-[#FFC857]">{achievementPopup.title}</p>
              <p className="text-xs text-[#FFF7E8]/90">{achievementPopup.message}</p>
            </div>
            <button
              type="button"
              onClick={() => dispatch(dismissAchievementPopup())}
              aria-label="Close achievement popup"
              className="rounded-lg p-1 text-[#FFF7E8]/70 hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level-Up Celebration Banner */}
      <AnimatePresence>
        {levelUpBanner && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Level up notification"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          >
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm rounded-3xl border-2 border-[#FFC857] bg-[#FFF7E8] p-6 text-center shadow-2xl"
            >
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E94B35] text-white shadow">
                <Star className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-extrabold text-[#49352A]">{levelUpBanner.title}</h2>
              <p className="mt-1.5 text-sm text-[#49352A]/80">{levelUpBanner.subtitle}</p>
              <button
                type="button"
                onClick={() => dispatch(dismissLevelUpBanner())}
                className="mt-5 w-full rounded-xl bg-[#49352A] px-4 py-2.5 text-sm font-bold text-[#FFF7E8] hover:opacity-95"
              >
                Continue Building Empire
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
