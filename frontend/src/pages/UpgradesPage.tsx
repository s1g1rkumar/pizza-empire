import { ArrowUpCircle, Cpu, Gauge, Lock, RefreshCw, ShieldCheck, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { GameLayout } from '@/components/GameLayout';
import { SectionCard } from '@/components/ui/SectionCard';
import { StatCard } from '@/components/ui/StatCard';
import {
  clearUpgradeError,
  fetchUpgrades,
  purchaseBusinessUpgrade,
} from '@/features/upgrades/upgradeSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';

const BUSINESS_TABS = [
  { key: 'ALL', label: 'All Upgrades' },
  { key: 'FARM', label: 'Farm' },
  { key: 'FACTORY', label: 'Factory' },
  { key: 'RESTAURANT', label: 'Restaurant' },
  { key: 'DELIVERY_HUB', label: 'Delivery' },
  { key: 'GLOBAL', label: 'Management' },
] as const;

export function UpgradesPage() {
  const dispatch = useAppDispatch();
  const { data, loading, acting, error } = useAppSelector((state) => state.upgrades);
  const [bizFilter, setBizFilter] = useState<string>('ALL');

  useEffect(() => {
    void dispatch(fetchUpgrades());
  }, [dispatch]);

  if (loading && !data) {
    return (
      <GameLayout>
        <div className="h-64 animate-pulse rounded-2xl border border-[#49352A]/10 bg-white/70" />
      </GameLayout>
    );
  }

  if (!data) return null;

  const filtered =
    bizFilter === 'ALL' ? data.upgrades : data.upgrades.filter((u) => u.businessType === bizFilter);

  return (
    <GameLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-[#49352A]">Business Upgrade Center</h1>
            <p className="text-sm text-[#49352A]/70">
              Invest in Farm, Factory, Restaurant, Delivery, and Management upgrades that power the
              simulation engine
            </p>
          </div>
          <button
            type="button"
            onClick={() => void dispatch(fetchUpgrades())}
            className="inline-flex items-center gap-2 rounded-xl bg-[#49352A] px-4 py-2 text-xs font-bold text-[#FFF7E8]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="flex items-center justify-between rounded-xl border border-[#E94B35]/40 bg-[#E94B35]/10 px-4 py-3 text-sm text-[#E94B35]">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => dispatch(clearUpgradeError())}
              className="text-xs font-bold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Active Simulation Multipliers */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Revenue Multiplier"
            value={`${data.multipliers.revenueMultiplier}x`}
            subtitle="Marketing & food quality"
            icon={TrendingUp}
            accentColor="green"
          />
          <StatCard
            label="Upkeep Cost Factor"
            value={`${Math.round(data.multipliers.upkeepReductionFactor * 100)}%`}
            subtitle="Energy & management efficiency"
            icon={ShieldCheck}
            accentColor="yellow"
          />
          <StatCard
            label="Automation Bonus"
            value={`${data.multipliers.automationBonus}x`}
            subtitle="Idle & factory automation"
            icon={Cpu}
            accentColor="orange"
          />
          <StatCard
            label="Staff Productivity"
            value={`${data.multipliers.employeeProductivityBonus}x`}
            subtitle="Training program boost"
            icon={Gauge}
            accentColor="red"
          />
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {BUSINESS_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setBizFilter(t.key)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                bizFilter === t.key
                  ? 'bg-[#E94B35] text-white'
                  : 'bg-white text-[#49352A] hover:bg-[#FFC857]/30'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <SectionCard
          title="Available Upgrades"
          subtitle={`Cash Available: $${data.cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((u) => {
              const pct = Math.min(
                100,
                Math.round((u.currentLevel / Math.max(1, u.maxLevel)) * 100)
              );
              const isMaxed = u.currentLevel >= u.maxLevel;

              return (
                <div
                  key={u.id}
                  className={`flex flex-col justify-between rounded-2xl border p-4 ${
                    !u.isUnlocked
                      ? 'border-[#49352A]/10 bg-slate-100/70 opacity-75'
                      : 'border-[#49352A]/10 bg-[#FFF7E8]/60'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-extrabold text-[#F28C38] uppercase">
                          {u.businessType.replace('_', ' ')}
                        </span>
                        <h3 className="text-sm font-extrabold text-[#49352A]">{u.name}</h3>
                      </div>
                      <span className="rounded-full bg-[#49352A]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#49352A]">
                        Lv {u.currentLevel}/{u.maxLevel}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-[#49352A]/75">{u.description}</p>

                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#49352A]/10">
                      <div
                        className="h-full rounded-full bg-[#58A66A]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    {!u.isUnlocked ? (
                      <div className="flex items-center justify-center gap-1.5 rounded-xl bg-[#49352A]/10 py-2 text-xs font-bold text-[#49352A]/70">
                        <Lock className="h-3.5 w-3.5" />
                        Requires Stage {u.unlockLevelNumber}
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={acting || isMaxed || data.cashBalance < u.nextCost}
                        onClick={() => void dispatch(purchaseBusinessUpgrade(u.code))}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#F28C38] py-2 text-xs font-bold text-white transition hover:bg-[#df7c2b] disabled:opacity-45"
                      >
                        <ArrowUpCircle className="h-4 w-4" />
                        {isMaxed
                          ? 'Max Level Reached'
                          : `Upgrade ($${u.nextCost.toLocaleString()})`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </GameLayout>
  );
}
