import { joiResolver } from '@hookform/resolvers/joi';
import { motion } from 'framer-motion';
import Joi from 'joi';
import { Lock, Mail, Sprout, User } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { clearAuthError, registerUser } from '@/features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';

interface RegisterFormValues {
  email: string;
  username: string;
  displayName: string;
  password: string;
}

const registerSchema = Joi.object<RegisterFormValues>({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Enter a valid email address',
      'string.empty': 'Email is required',
    }),
  username: Joi.string().alphanum().min(3).max(32).required().messages({
    'string.alphanum': 'Username must contain only letters and numbers',
    'string.min': 'Username must be at least 3 characters',
  }),
  displayName: Joi.string().min(2).max(64).required().messages({
    'string.min': 'Display name must be at least 2 characters',
  }),
  password: Joi.string().min(8).max(128).required().messages({
    'string.min': 'Password must be at least 8 characters',
  }),
});

export function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: joiResolver(registerSchema),
  });

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (values: RegisterFormValues) => {
    const result = await dispatch(registerUser(values));
    if (registerUser.fulfilled.match(result)) {
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
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <Sprout className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-white">Start Your Farm</h1>
          <p className="mt-1 text-sm text-slate-400">
            Begin with $500, 2 farm plots, and grow into a global pizza empire
          </p>
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
                placeholder="founder@pizzaempire.com"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 pr-3 pl-10 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Username</label>
              <div className="relative">
                <User className="absolute top-3 left-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  {...register('username')}
                  placeholder="pizzaboss"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 pr-3 pl-10 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-xs text-rose-400">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Display Name
              </label>
              <input
                type="text"
                {...register('displayName')}
                placeholder="Chef Mario"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
              {errors.displayName && (
                <p className="mt-1 text-xs text-rose-400">{errors.displayName.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Password</label>
            <div className="relative">
              <Lock className="absolute top-3 left-3 h-4 w-4 text-slate-500" />
              <input
                type="password"
                {...register('password')}
                placeholder="Minimum 8 characters"
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
            {loading ? 'Creating Empire...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an empire?{' '}
          <Link to="/login" className="font-medium text-amber-400 hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
