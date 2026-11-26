import {
  Building2,
  Coins,
  Landmark,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { GameLayout } from '@/components/GameLayout';
import { SectionCard } from '@/components/ui/SectionCard';
import { StatCard } from '@/components/ui/StatCard';
import { fetchFinance } from '@/features/finance/financeSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';

const PIE_COLORS = ['#E94B35', '#F28C38', '#FFC857', '#58A66A', '#49352A', '#3B82F6'];

function fmt(val: number): string {
  const abs = Math.abs(val).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return val < 0 ? `-$${abs}` : `$${abs}`;
}

export function FinancePage() {
  const dispatch = useAppDispatch();
  const { data, loading, error } = useAppSelector((state) => state.finance);
  const [txFilter, setTxFilter] = useState<string>('');
  const [reportTab, setReportTab] = useState<'DAILY' | 'MONTHLY'>('DAILY');

  useEffect(() => {
    void dispatch(fetchFinance(txFilter || undefined));
  }, [dispatch, txFilter]);

  if (loading && !data) {
    return (
      <GameLayout>
        <div className="h-64 animate-pulse rounded-2xl border border-[#49352A]/10 bg-white/70" />
      </GameLayout>
    );
  }

  if (!data) return null;

  return (
    <GameLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-[#49352A]">Financial Management</h1>
            <p className="text-sm text-[#49352A]/70">
              P&L analytics, daily & monthly reports, business valuation, and transaction ledger
            </p>
          </div>
          <button
            type="button"
            onClick={() => void dispatch(fetchFinance(txFilter || undefined))}
            className="inline-flex items-center gap-2 rounded-xl bg-[#49352A] px-4 py-2 text-xs font-bold text-[#FFF7E8]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Ledger
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-[#E94B35]/40 bg-[#E94B35]/10 px-4 py-3 text-sm text-[#E94B35]">
            {error}
          </div>
        )}

        {/* Top Financial KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            label="Cash Balance"
            value={fmt(data.summary.cashBalance)}
            icon={Coins}
            accentColor="yellow"
          />
          <StatCard
            label="Business Valuation"
            value={fmt(data.valuation.totalValuation)}
            subtitle="Assets + Cash + Inventory"
            icon={Landmark}
            accentColor="orange"
          />
          <StatCard
            label="Daily Net Profit"
            value={fmt(data.summary.dailyNetProfit)}
            subtitle={`Rev ${fmt(data.summary.dailyRevenue)}`}
            icon={TrendingUp}
            accentColor={data.summary.dailyNetProfit >= 0 ? 'green' : 'red'}
          />
          <StatCard
            label="Monthly Net Profit"
            value={fmt(data.summary.monthlyNetProfit)}
            subtitle={`Exp ${fmt(data.summary.monthlyExpenses)}`}
            icon={TrendingDown}
            accentColor={data.summary.monthlyNetProfit >= 0 ? 'green' : 'red'}
          />
          <StatCard
            label="Hourly Payroll & OpEx"
            value={fmt(data.summary.hourlyPayroll + data.summary.hourlyOperatingCosts)}
            subtitle={`Payroll ${fmt(data.summary.hourlyPayroll)}/hr`}
            icon={Users}
            accentColor="red"
          />
        </div>

        {/* Daily & Monthly Recharts Reports */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SectionCard
              title={reportTab === 'DAILY' ? 'Daily P&L Report (14 Days)' : 'Monthly P&L Report'}
              subtitle="Server-verified revenue vs. operating & CapEx expenses"
              action={
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setReportTab('DAILY')}
                    className={`rounded-lg px-3 py-1 text-xs font-bold ${
                      reportTab === 'DAILY'
                        ? 'bg-[#E94B35] text-white'
                        : 'bg-[#FFF7E8] text-[#49352A]'
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportTab('MONTHLY')}
                    className={`rounded-lg px-3 py-1 text-xs font-bold ${
                      reportTab === 'MONTHLY'
                        ? 'bg-[#E94B35] text-white'
                        : 'bg-[#FFF7E8] text-[#49352A]'
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              }
            >
              {reportTab === 'DAILY' ? (
                data.dailyReportSeries.length === 0 ? (
                  <p className="py-16 text-center text-xs text-[#49352A]/60">
                    No daily financial activity recorded yet.
                  </p>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.dailyReportSeries}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#49352A1A" />
                        <XAxis dataKey="date" fontSize={11} stroke="#49352A" />
                        <YAxis fontSize={11} stroke="#49352A" />
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
                )
              ) : data.monthlyReportSeries.length === 0 ? (
                <p className="py-16 text-center text-xs text-[#49352A]/60">
                  No monthly financial activity recorded yet.
                </p>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.monthlyReportSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#49352A1A" />
                      <XAxis dataKey="month" fontSize={11} stroke="#49352A" />
                      <YAxis fontSize={11} stroke="#49352A" />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#58A66A" name="Revenue ($)" />
                      <Bar dataKey="expenses" fill="#E94B35" name="Expenses ($)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </SectionCard>
          </div>

          {/* Business Valuation Breakdown */}
          <SectionCard title="Business Valuation" subtitle="Total empire asset breakdown">
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between rounded-xl bg-[#FFF7E8] px-3.5 py-2.5">
                <span className="font-semibold text-[#49352A]/75">Cash Reserves</span>
                <span className="font-bold text-[#49352A]">{fmt(data.valuation.cashBalance)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[#FFF7E8] px-3.5 py-2.5">
                <span className="font-semibold text-[#49352A]/75">Business Facilities & CapEx</span>
                <span className="font-bold text-[#49352A]">
                  {fmt(data.valuation.businessesValue)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[#FFF7E8] px-3.5 py-2.5">
                <span className="font-semibold text-[#49352A]/75">Inventory Value</span>
                <span className="font-bold text-[#49352A]">
                  {fmt(data.valuation.inventoryValue)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[#FFF7E8] px-3.5 py-2.5">
                <span className="font-semibold text-[#49352A]/75">Brand Goodwill</span>
                <span className="font-bold text-[#49352A]">
                  {fmt(data.valuation.goodwillValue)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[#49352A] px-3.5 py-3 text-[#FFF7E8]">
                <span className="inline-flex items-center gap-1.5 font-bold">
                  <Building2 className="h-4 w-4 text-[#FFC857]" />
                  Total Valuation
                </span>
                <span className="text-sm font-extrabold">{fmt(data.valuation.totalValuation)}</span>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Category Breakdowns + Ledger */}
        <div className="grid gap-6 lg:grid-cols-3">
          <SectionCard title="Expense Breakdown" subtitle="By category">
            {data.expensesByCategory.length === 0 ? (
              <p className="py-12 text-center text-xs text-[#49352A]/60">No expenses yet.</p>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.expensesByCategory}
                      dataKey="total"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                    >
                      {data.expensesByCategory.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

          <div className="lg:col-span-2">
            <SectionCard
              title="Financial History"
              subtitle="Immutable MySQL 8 ledger"
              action={
                <select
                  value={txFilter}
                  onChange={(e) => setTxFilter(e.target.value)}
                  className="rounded-xl border border-[#49352A]/15 bg-[#FFF7E8] px-3 py-1.5 text-xs font-bold text-[#49352A]"
                >
                  <option value="">All Types</option>
                  <option value="REVENUE">Revenue</option>
                  <option value="EXPENSE">Expenses</option>
                  <option value="CAPEX">CapEx Investments</option>
                  <option value="REWARD">Rewards</option>
                </select>
              }
            >
              {data.history.length === 0 ? (
                <p className="py-12 text-center text-xs text-[#49352A]/60">
                  No financial transactions recorded yet.
                </p>
              ) : (
                <div className="max-h-72 divide-y divide-[#49352A]/10 overflow-y-auto">
                  {data.history.map((tx) => {
                    const isCredit =
                      tx.transactionType === 'REVENUE' ||
                      tx.transactionType === 'REWARD' ||
                      tx.transactionType === 'LOAN_IN';
                    return (
                      <div key={tx.id} className="flex items-center justify-between py-2.5 text-xs">
                        <div>
                          <p className="font-bold text-[#49352A]">
                            {tx.description ?? tx.category}
                          </p>
                          <p className="text-[#49352A]/60">
                            {tx.transactionType} · {tx.category} · Bal: {fmt(tx.balanceAfter)}
                          </p>
                        </div>
                        <span
                          className={`font-extrabold ${
                            isCredit ? 'text-[#58A66A]' : 'text-[#E94B35]'
                          }`}
                        >
                          {isCredit ? '+' : '-'}
                          {fmt(tx.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      </div>
    </GameLayout>
  );
}
