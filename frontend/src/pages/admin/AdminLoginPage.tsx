import { Lock, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin, clearAdminError } from '@/features/admin/adminSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';

export function AdminLoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { acting, error } = useAppSelector((state) => state.admin);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await dispatch(adminLogin({ email, password }));
    if (adminLogin.fulfilled.match(res)) {
      navigate('/admin');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-slate-950">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">Internal Admin Portal</h1>
            <p className="text-xs text-slate-400">Pizza Empire Tycoon · Authorized Staff Only</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => dispatch(clearAdminError())}
              className="font-bold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-300">Admin Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@pizzaempire.internal"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-300">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={acting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-extrabold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
          >
            <Lock className="h-4 w-4" />
            {acting ? 'Authenticating...' : 'Sign In to Admin Console'}
          </button>
        </form>
      </div>
    </div>
  );
}
