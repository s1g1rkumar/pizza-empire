import { joiResolver } from '@hookform/resolvers/joi';
import { motion } from 'framer-motion';
import Joi from 'joi';
import { Coins, KeyRound, LogOut, ShieldCheck, Sprout, Trophy, User } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { logoutUser, updatePlayerProfile } from '@/features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { authService } from '@/services/authService';

interface ProfileFormValues {
  displayName: string;
}

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
}

const profileSchema = Joi.object<ProfileFormValues>({
  displayName: Joi.string().min(2).max(64).required(),
});

const passwordSchema = Joi.object<PasswordFormValues>({
  currentPassword: Joi.string().min(1).required(),
  newPassword: Joi.string().min(8).max(128).required(),
});

export function ProfilePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, profile, overview } = useAppSelector((state) => state.auth);

  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordErr, setPasswordErr] = useState<string | null>(null);

  const profileForm = useForm<ProfileFormValues>({
    resolver: joiResolver(profileSchema),
    values: { displayName: profile?.displayName ?? '' },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: joiResolver(passwordSchema),
  });

  const onUpdateProfile = async (values: ProfileFormValues) => {
    setProfileMsg(null);
    const res = await dispatch(updatePlayerProfile({ displayName: values.displayName }));
    if (updatePlayerProfile.fulfilled.match(res)) {
      setProfileMsg('Profile updated.');
    }
  };

  const onChangePassword = async (values: PasswordFormValues) => {
    setPasswordMsg(null);
    setPasswordErr(null);
    try {
      const res = await authService.changePassword(values);
      setPasswordMsg(res.message);
      passwordForm.reset();
    } catch {
      setPasswordErr('Current password is incorrect.');
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  if (!user || !profile || !overview) return null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400">
              <User className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{profile.displayName}</h1>
              <p className="text-sm text-slate-400">
                @{user.username} · {user.email} ·{' '}
                <span className="text-emerald-400">{user.status}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-rose-500/50 hover:text-rose-300"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <Trophy className="h-4 w-4 text-amber-400" />
              Stage & Level
            </div>
            <p className="mt-2 text-lg font-semibold text-white">
              Lv {overview.currentLevelNumber}: {overview.currentLevelName}
            </p>
            <p className="text-xs text-slate-400">
              XP Level {overview.xpLevel} ({overview.currentXp} XP)
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <Coins className="h-4 w-4 text-emerald-400" />
              Starting Capital / Cash
            </div>
            <p className="mt-2 text-lg font-semibold text-white">
              ${Number(profile.cashBalance).toFixed(2)}
            </p>
            <p className="text-xs text-slate-400">
              Net Worth: ${Number(profile.netWorth).toFixed(2)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <Sprout className="h-4 w-4 text-emerald-400" />
              Starting Farm
            </div>
            <p className="mt-2 text-lg font-semibold text-white">
              {overview.farmCount} Farm · {overview.unlockedPlotsCount} Plots
            </p>
            <p className="text-xs text-slate-400">{overview.activeMissionsCount} Active Missions</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <ShieldCheck className="h-4 w-4 text-sky-400" />
              Workforce Cap
            </div>
            <p className="mt-2 text-lg font-semibold text-white">
              {profile.maxEmployeesAllowed} Max Staff
            </p>
            <p className="text-xs text-slate-400">Reputation: {profile.reputation}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Profile Settings</h2>
            {profileMsg && <p className="mb-3 text-sm text-emerald-400">{profileMsg}</p>}
            <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Display Name
                </label>
                <input
                  type="text"
                  {...profileForm.register('displayName')}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
                {profileForm.formState.errors.displayName && (
                  <p className="mt-1 text-xs text-rose-400">
                    {profileForm.formState.errors.displayName.message}
                  </p>
                )}
              </div>
              <button
                type="submit"
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400"
              >
                Save Changes
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-4 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-amber-400" />
              <h2 className="text-lg font-semibold text-white">Change Password</h2>
            </div>
            {passwordMsg && <p className="mb-3 text-sm text-emerald-400">{passwordMsg}</p>}
            {passwordErr && <p className="mb-3 text-sm text-rose-400">{passwordErr}</p>}
            <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Current Password
                </label>
                <input
                  type="password"
                  {...passwordForm.register('currentPassword')}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  New Password
                </label>
                <input
                  type="password"
                  {...passwordForm.register('newPassword')}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
                {passwordForm.formState.errors.newPassword && (
                  <p className="mt-1 text-xs text-rose-400">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>
              <button
                type="submit"
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
