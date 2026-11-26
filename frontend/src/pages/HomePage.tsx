import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Database, RefreshCw, Server } from 'lucide-react';
import { checkSystemHealth } from '@/features/system/systemSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';

export function HomePage() {
  const dispatch = useAppDispatch();
  const { health, loading, error } = useAppSelector((state) => state.system);

  useEffect(() => {
    void dispatch(checkSystemHealth());
  }, [dispatch]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Pizza Empire Tycoon</h1>
            <p className="mt-2 text-slate-400">
              Full-stack TypeScript foundation ready for core game module implementation.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void dispatch(checkSystemHealth())}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Health
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
              <Server className="h-4 w-4 text-amber-400" />
              Backend API
            </div>
            <p className="mt-2 text-xl font-semibold text-white">
              {loading ? 'Checking...' : error ? 'Offline' : health?.status.toUpperCase()}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
              <Database className="h-4 w-4 text-amber-400" />
              MySQL 8 Pool
            </div>
            <p className="mt-2 text-xl font-semibold text-white">
              {health?.database.connected ? 'Connected' : 'Disconnected'}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
              <Activity className="h-4 w-4 text-amber-400" />
              Uptime
            </div>
            <p className="mt-2 text-xl font-semibold text-white">
              {health ? `${health.uptimeSeconds}s` : '—'}
            </p>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </p>
        )}
      </motion.div>
    </main>
  );
}
