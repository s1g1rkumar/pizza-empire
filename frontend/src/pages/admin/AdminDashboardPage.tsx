import { Clock, DollarSign, RefreshCw, TrendingUp, UserCheck, Users } from 'lucide-react';
import { useEffect } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { fetchAdminAnalytics } from '@/features/admin/adminSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';

export function AdminDashboardPage() {
  const dispatch = useAppDispatch();
  const { analytics, loading } = useAppSelector((state) => state.admin);

  useEffect(() => {
    void dispatch(fetchAdminAnalytics());
  }, [dispatch]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Executive Analytics</h1>
            <p className="text-xs text-slate-400">
              Live player registrations, engagement, retention, monetization, and progression
              metrics
            </p>
          </div>
          <button
            type="button"
            onClick={() => void dispatch(fetchAdminAnalytics())}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {analytics && (
          <>
            {/* Top 6 Analytics KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Total Registrations</span>
                  <Users className="h-4 w-4 text-amber-400" />
                </div>
                <p className="mt-2 text-2xl font-extrabold text-white">
                  {analytics.totalRegistrations.toLocaleString()}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Daily Active (DAU)</span>
                  <UserCheck className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="mt-2 text-2xl font-extrabold text-emerald-400">
                  {analytics.dailyActiveUsers.toLocaleString()}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Monthly Active (MAU)</span>
                  <Users className="h-4 w-4 text-sky-400" />
                </div>
                <p className="mt-2 text-2xl font-extrabold text-sky-400">
                  {analytics.monthlyActiveUsers.toLocaleString()}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>7d Player Retention</span>
                  <TrendingUp className="h-4 w-4 text-amber-400" />
                </div>
                <p className="mt-2 text-2xl font-extrabold text-white">
                  {analytics.retentionRate7d}%
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Avg Session Duration</span>
                  <Clock className="h-4 w-4 text-purple-400" />
                </div>
                <p className="mt-2 text-2xl font-extrabold text-white">
                  {analytics.avgSessionDurationMinutes}m
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Monetization Revenue</span>
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="mt-2 text-2xl font-extrabold text-emerald-400">
                  ${analytics.monetizationRevenueUsd.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <h2 className="mb-4 text-sm font-extrabold text-white">
                  Most Popular Business Types
                </h2>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.mostPopularBusinesses}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="businessType" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          color: '#f8fafc',
                        }}
                      />
                      <Bar
                        dataKey="count"
                        name="Active Facilities"
                        fill="#f59e0b"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <h2 className="mb-4 text-sm font-extrabold text-white">
                  Player Progression Statistics (By Business Stage)
                </h2>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.progressionStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="levelName" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          color: '#f8fafc',
                        }}
                      />
                      <Bar
                        dataKey="playerCount"
                        name="Players"
                        fill="#10b981"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
