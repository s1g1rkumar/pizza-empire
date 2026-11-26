import { joiResolver } from '@hookform/resolvers/joi';
import { motion } from 'framer-motion';
import Joi from 'joi';
import { LogIn, Mail, Lock } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { clearAuthError, loginUser } from '@/features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';

interface LoginFormValues {
  email: string;
  password: string;
}

const loginSchema = Joi.object<LoginFormValues>({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Enter a valid email address',
      'string.empty': 'Email is required',
    }),
  password: Joi.string().min(1).required().messages({ 'string.empty': 'Password is required' }),
});

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: joiResolver(loginSchema),
  });

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (values: LoginFormValues) => {
    const result = await dispatch(loginUser(values));
    if (loginUser.fulfilled.match(result)) {
      navigate('/dashboard');
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
            <LogIn className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome Back, Tycoon</h1>
          <p className="mt-1 text-sm text-slate-400">Sign in to manage your pizza empire</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
            <div className="relative">
              <Mail className="absolute top-3 left-3 h-4 w-4 text-slate-500" />
              <input
                type="email"
                {...register('email')}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 pr-3 pl-10 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <Link to="/forgot-password" className="text-xs text-amber-400 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute top-3 left-3 h-4 w-4 text-slate-500" />
              <input
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 pr-3 pl-10 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-rose-400">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          New to Pizza Empire?{' '}
          <Link to="/register" className="font-medium text-amber-400 hover:underline">
            Create an empire
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
