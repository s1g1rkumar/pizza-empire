import { joiResolver } from '@hookform/resolvers/joi';
import { motion } from 'framer-motion';
import Joi from 'joi';
import { KeyRound, Mail } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '@/services/authService';

interface RequestResetValues {
  email: string;
}

interface ConfirmResetValues {
  newPassword: string;
}

const requestSchema = Joi.object<RequestResetValues>({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required(),
});

const confirmSchema = Joi.object<ConfirmResetValues>({
  newPassword: Joi.string().min(8).max(128).required(),
});

export function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('token');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const requestForm = useForm<RequestResetValues>({ resolver: joiResolver(requestSchema) });
  const confirmForm = useForm<ConfirmResetValues>({ resolver: joiResolver(confirmSchema) });

  const handleRequestReset = async (values: RequestResetValues) => {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await authService.forgotPassword(values.email);
      setStatusMessage(res.message);
    } catch {
      setErrorMessage('Unable to process password reset request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmReset = async (values: ConfirmResetValues) => {
    if (!resetToken) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await authService.resetPassword(resetToken, values.newPassword);
      setStatusMessage(res.message);
    } catch {
      setErrorMessage('Reset token is invalid or expired.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-md items-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl sm:p-8"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {resetToken ? 'Set New Password' : 'Reset Password'}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {resetToken
              ? 'Choose a strong new password for your empire'
              : 'Enter your email to receive a password reset link'}
          </p>
        </div>

        {statusMessage && (
          <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {statusMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {errorMessage}
          </div>
        )}

        {resetToken ? (
          <form onSubmit={confirmForm.handleSubmit(handleConfirmReset)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                New Password
              </label>
              <input
                type="password"
                {...confirmForm.register('newPassword')}
                placeholder="Minimum 8 characters"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
              {confirmForm.formState.errors.newPassword && (
                <p className="mt-1 text-xs text-rose-400">
                  {confirmForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Reset Password'}
            </button>
          </form>
        ) : (
          <form onSubmit={requestForm.handleSubmit(handleRequestReset)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
              <div className="relative">
                <Mail className="absolute top-3 left-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  {...requestForm.register('email')}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 pr-3 pl-10 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
              {requestForm.formState.errors.email && (
                <p className="mt-1 text-xs text-rose-400">
                  {requestForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
            >
              {submitting ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-400">
          Back to{' '}
          <Link to="/login" className="font-medium text-amber-400 hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
