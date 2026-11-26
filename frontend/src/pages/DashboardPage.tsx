import { motion } from 'framer-motion';
import {
  AlertCircle,
  Building2,
  Coins,
  Lock,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Unlock,
  Users,
  Wallet,
} from 'lucide-react';
import { useEffect } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { GameLayout } from '@/components/GameLayout';
import { SectionCard } from '@/components/ui/SectionCard';
import { StatCard } from '@/components/ui/StatCard';
import { fetchDashboard } from '@/features/dashboard/dashboardSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';

function formatCurrency(val: number): string {
  const absFormatted = Math.abs(val).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return val < 0 ? `-$${absFormatted}` : `$${absFormatted}`;
}

export function DashboardPage() {
  const dispatch = useAppDispatch();
  const { data, loading, error } = useAppSelector((state) => state.dashboard);

  useEffect(() => {
    void dispatch(fetchDashboard());
  }, [dispatch]);

  if (loading && !data) {
    return (
      <GameLayout>
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={idx}
                className="h-28 animate-pulse rounded-2xl border border-[#49352A]/10 bg-white/70"
              />
            ))}
          </div>
          <div className="h-72 animate-pulse rounded-2xl border border-[#49352A]/10 bg-white/70" />
        </div>
      </GameLayout>
    );
  }

  if (error && !data) {
    return (
      <GameLayout>
        <div className="rounded-2xl border border-[#E94B35]/30 bg-white p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto h-10 w-10 text-[#E94B35]" />
          <h2 className="mt-3 text-lg font-bold text-[#49352A]">Unable to Load Dashboard</h2>
          <p className="mt-1 text-sm text-[#49352A]/70">{error}</p>
          <button
            type="button"
            onClick={() => void dispatch(fetchDashboard())}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#E94B35] px-4 py-2 text-sm font-semibold text-white hover:bg-[#d63e29]"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </GameLayout>
    );
  }

  if (!data) return null;

  return (
    <GameLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#49352A]">
              Empire Command Center
            </h1>
            <p className="text-sm text-[#49352A]/70">
              Welcome back, {data.profile.displayName}. Net Worth:{' '}
              <span className="font-bold text-[#49352A]">
                {formatCurrency(data.profile.netWorth)}
              </span>{' '}
              · Reputation: <span className="font-bold">{data.profile.reputation}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => void dispatch(fetchDashboard())}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-[#F28C38] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#e07d2b] disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Empire
          </button>
        </div>

        {/* 1-6: Financial & Workforce KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Current Balance"
            value={formatCurrency(data.financials.currentBalance)}
            subtitle={`${data.profile.gemsBalance} Empire Gems`}
            icon={Wallet}
            accentColor="yellow"
          />
          <StatCard
            label="Daily Revenue (24h)"
            value={formatCurrency(data.financials.dailyRevenue)}
            subtitle="Gross sales & rewards"
            icon={TrendingUp}
            accentColor="green"
          />
          <StatCard
            label="Daily Expenses (24h)"
            value={formatCurrency(data.financials.dailyExpenses)}
            subtitle="Payroll, upkeep & CapEx"
            icon={TrendingDown}
            accentColor="red"
          />
          <StatCard
            label="Net Profit (24h)"
            value={formatCurrency(data.financials.netProfit)}
            subtitle={`${data.businesses.length} Active Business(es)`}
            icon={Coins}
            accentColor={data.financials.netProfit >= 0 ? 'green' : 'red'}
          />
          <StatCard
            label="Employee Count"
            value={`${data.employees.activeCount} / ${data.employees.maxAllowed}`}
            subtitle="Workforce capacity"
            icon={Users}
            accentColor="orange"
          />
        </div>

        {/* 1. Business Overview Cards */}
        <SectionCard
          title="Active Business Overview"
          subtitle="Operational facilities generating value in your empire"
        >
          {data.businesses.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#49352A]/60">
              No active businesses found yet.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.businesses.map((biz) => (
                <motion.div
                  key={biz.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between rounded-xl border border-[#49352A]/10 bg-[#FFF7E8]/60 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F28C38]/20 text-[#E94B35]">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#49352A]">{biz.name}</p>
                      <p className="text-xs text-[#49352A]/65">
                        {biz.businessType.replace('_', ' ')} · Lv {biz.level}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      biz.isOperational
                        ? 'bg-[#58A66A]/20 text-[#347544]'
                        : 'bg-[#E94B35]/15 text-[#E94B35]'
                    }`}
                  >
                    {biz.isOperational ? 'Active' : 'Paused'}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* 7 & 8: Business Performance Chart + Current Missions */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SectionCard
              title="Business Performance (24h)"
              subtitle="Hourly revenue vs. operating expenses"
            >
              {data.financials.performanceSeries.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-[#49352A]/20 bg-[#FFF7E8]/50 text-center">
                  <p className="text-sm font-semibold text-[#49352A]">No financial activity yet</p>
                  <p className="mt-1 text-xs text-[#49352A]/65">
                    Start farming crops and selling pizzas to populate your performance chart.
                  </p>
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.financials.performanceSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#49352A1A" />
                      <XAxis dataKey="label" stroke="#49352A" fontSize={12} />
                      <YAxis stroke="#49352A" fontSize={12} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#58A66A"
                        fill="#58A66A"
                        fillOpacity={0.2}
                        name="Revenue ($)"
                      />
                      <Area
                        type="monotone"
                        dataKey="expenses"
                        stroke="#E94B35"
                        fill="#E94B35"
                        fillOpacity={0.18}
                        name="Expenses ($)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </SectionCard>
          </div>

          <SectionCard title="Current Missions" subtitle="Complete objectives for Cash & XP">
            {data.currentMissions.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#49352A]/60">
                All assigned missions completed!
              </p>
            ) : (
              <div className="space-y-3">
                {data.currentMissions.map((m) => {
                  const pct = Math.min(
                    100,
                    Math.round((m.progressValue / Math.max(1, m.targetValue)) * 100)
                  );
                  return (
                    <div
                      key={m.id}
                      className="rounded-xl border border-[#49352A]/10 bg-[#FFF7E8]/50 p-3.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-[#49352A]">{m.title}</p>
                        <span className="text-xs font-bold text-[#58A66A]">+${m.rewardCash}</span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#49352A]/10">
                        <div
                          className="h-full rounded-full bg-[#F28C38]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-[#49352A]/65">
                        {m.progressValue} / {m.targetValue} · +{m.rewardXp} XP
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>

        {/* 9 & 10: Recent Transactions + Unlockable Businesses */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard
            title="Recent Transactions"
            subtitle="Latest verified financial ledger entries"
          >
            {data.recentTransactions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#49352A]/20 bg-[#FFF7E8]/40 py-10 text-center">
                <p className="text-sm font-semibold text-[#49352A]">No transactions recorded yet</p>
                <p className="mt-1 text-xs text-[#49352A]/65">
                  Crop sales, seed purchases, payroll, and upgrades will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#49352A]/10">
                {data.recentTransactions.map((tx) => {
                  const isPositive =
                    tx.transactionType === 'REVENUE' ||
                    tx.transactionType === 'REWARD' ||
                    tx.transactionType === 'LOAN_IN';
                  return (
                    <div key={tx.id} className="flex items-center justify-between py-2.5 text-sm">
                      <div>
                        <p className="font-semibold text-[#49352A]">
                          {tx.description ?? tx.category.replace('_', ' ')}
                        </p>
                        <p className="text-[11px] text-[#49352A]/60">
                          {new Date(tx.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`font-bold ${isPositive ? 'text-[#58A66A]' : 'text-[#E94B35]'}`}
                      >
                        {isPositive ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Unlockable Businesses"
            subtitle="Expand from Small Farmer to Global Business Empire"
          >
            <div className="space-y-2.5">
              {data.unlockableBusinesses.map((stage) => (
                <div
                  key={stage.levelNumber}
                  className={`flex items-center justify-between rounded-xl border p-3.5 ${
                    stage.isUnlocked
                      ? 'border-[#58A66A]/30 bg-[#58A66A]/10'
                      : 'border-[#49352A]/10 bg-[#FFF7E8]/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        stage.isUnlocked
                          ? 'bg-[#58A66A] text-white'
                          : 'bg-[#49352A]/10 text-[#49352A]/60'
                      }`}
                    >
                      {stage.isUnlocked ? (
                        <Unlock className="h-4 w-4" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#49352A]">
                        Lv {stage.levelNumber}: {stage.name}
                      </p>
                      <p className="text-xs text-[#49352A]/65">
                        Requires {stage.minXp.toLocaleString()} XP · {formatCurrency(stage.minCash)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      stage.isUnlocked
                        ? 'bg-[#58A66A]/20 text-[#347544]'
                        : 'bg-[#FFC857]/35 text-[#49352A]'
                    }`}
                  >
                    {stage.isUnlocked ? 'Unlocked' : 'Locked'}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </GameLayout>
  );
}
