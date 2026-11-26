import {
  Building2,
  Coins,
  MapPin,
  RefreshCw,
  Star,
  Store,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { GameLayout } from '@/components/GameLayout';
import { SectionCard } from '@/components/ui/SectionCard';
import { StatCard } from '@/components/ui/StatCard';
import {
  assignBranchManager,
  clearChainError,
  fetchChain,
  payBranchRent,
} from '@/features/chain/chainSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';

export function ChainPage() {
  const dispatch = useAppDispatch();
  const { data, loading, acting, error } = useAppSelector((state) => state.chain);
  const [selectedMgr, setSelectedMgr] = useState<Record<number, number>>({});

  useEffect(() => {
    void dispatch(fetchChain());
  }, [dispatch]);

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
            <h1 className="text-2xl font-extrabold text-[#49352A]">
              Restaurant Chain Headquarters
            </h1>
            <p className="text-sm text-[#49352A]/70">
              Compare branch performance, assign store managers, and manage district rents
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/game/restaurants"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#E94B35] px-4 py-2 text-xs font-bold text-white"
            >
              <Store className="h-3.5 w-3.5" />
              Open New Branch
            </Link>
            <button
              type="button"
              onClick={() => void dispatch(fetchChain())}
              className="inline-flex items-center gap-2 rounded-xl bg-[#49352A] px-4 py-2 text-xs font-bold text-[#FFF7E8]"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Sync HQ
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center justify-between rounded-xl border border-[#E94B35]/40 bg-[#E94B35]/10 px-4 py-3 text-sm text-[#E94B35]">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => dispatch(clearChainError())}
              className="text-xs font-bold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Chain KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Branches"
            value={`${data.summary.totalBranches}`}
            subtitle={
              data.summary.topBranchName ? `Top: ${data.summary.topBranchName}` : 'No branches yet'
            }
            icon={Building2}
            accentColor="orange"
          />
          <StatCard
            label="Chain Revenue (24h)"
            value={`$${data.summary.totalRevenue24h.toFixed(2)}`}
            icon={TrendingUp}
            accentColor="green"
          />
          <StatCard
            label="Chain Net Profit (24h)"
            value={`$${data.summary.totalNetProfit24h.toFixed(2)}`}
            subtitle={`Monthly Rent: $${data.summary.totalMonthlyRent.toFixed(0)}`}
            icon={Coins}
            accentColor={data.summary.totalNetProfit24h >= 0 ? 'green' : 'red'}
          />
          <StatCard
            label="Avg Chain Rating"
            value={`${data.summary.avgChainRating.toFixed(2)}★`}
            icon={Star}
            accentColor="yellow"
          />
        </div>

        {/* Revenue & Profit Comparison Chart */}
        <SectionCard
          title="Branch Revenue & Profit Comparison"
          subtitle="Side-by-side 24h financial comparison across all locations"
        >
          {data.branches.length === 0 ? (
            <p className="py-10 text-center text-xs text-[#49352A]/60">
              Construct your first restaurant branch to compare chain performance.
            </p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.branches}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#49352A1A" />
                  <XAxis dataKey="name" fontSize={11} stroke="#49352A" />
                  <YAxis fontSize={11} stroke="#49352A" />
                  <Tooltip />
                  <Bar dataKey="revenue24h" fill="#58A66A" name="Revenue ($)" />
                  <Bar dataKey="netProfit24h" fill="#F28C38" name="Net Profit ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        {/* Branch Management Table */}
        <SectionCard
          title="Branch Operations, Managers & Rent"
          subtitle="Assign managers and pay district rents from HQ"
        >
          {data.branches.length === 0 ? (
            <p className="py-8 text-center text-xs text-[#49352A]/60">No branches owned yet.</p>
          ) : (
            <div className="space-y-3">
              {data.branches.map((b) => (
                <div
                  key={b.restaurantId}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#49352A]/10 bg-[#FFF7E8]/60 p-4 text-xs"
                >
                  <div>
                    <p className="text-sm font-extrabold text-[#49352A]">{b.name}</p>
                    <p className="text-[#49352A]/70">
                      {b.locationName} ({b.demandMultiplier}x Demand) · {b.staffCount} Staff ·{' '}
                      {b.avgRating.toFixed(1)}★
                    </p>
                    <p className="mt-1 font-semibold text-[#58A66A]">
                      Rev: ${b.revenue24h.toFixed(2)} · Net: ${b.netProfit24h.toFixed(2)} · Manager:{' '}
                      {b.managerName ?? 'None'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={selectedMgr[b.restaurantId] ?? b.managerEmployeeId ?? ''}
                      onChange={(e) =>
                        setSelectedMgr({ ...selectedMgr, [b.restaurantId]: Number(e.target.value) })
                      }
                      className="rounded-lg border border-[#49352A]/20 bg-white px-2.5 py-1.5 text-xs"
                    >
                      <option value="">Select Manager...</option>
                      {data.availableManagers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.fullName} ({m.role})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={acting || !(selectedMgr[b.restaurantId] ?? b.managerEmployeeId)}
                      onClick={() => {
                        const mgrId = selectedMgr[b.restaurantId] ?? b.managerEmployeeId;
                        if (mgrId) {
                          void dispatch(
                            assignBranchManager({
                              restaurantId: b.restaurantId,
                              managerEmployeeId: mgrId,
                            })
                          );
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#49352A] px-3 py-1.5 font-bold text-white disabled:opacity-40"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      Assign
                    </button>
                    <button
                      type="button"
                      disabled={acting}
                      onClick={() => void dispatch(payBranchRent(b.restaurantId))}
                      className="rounded-lg bg-[#F28C38] px-3 py-1.5 font-bold text-white hover:bg-[#df7c2b]"
                    >
                      Pay Rent (${b.monthlyRent.toFixed(0)})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* 6 City Districts Overview */}
        <SectionCard title="City Districts" subtitle="Location-based demand and rent multipliers">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.locations.map((loc) => (
              <div
                key={loc.id}
                className="rounded-xl border border-[#49352A]/10 bg-[#FFF7E8]/50 p-3.5 text-xs"
              >
                <div className="flex items-center gap-1.5 font-bold text-[#49352A]">
                  <MapPin className="h-3.5 w-3.5 text-[#E94B35]" />
                  <span>{loc.name}</span>
                </div>
                <p className="mt-1 text-[#49352A]/75">
                  Demand: <span className="font-bold">{loc.demandMultiplier}x</span> · Rent:{' '}
                  <span className="font-bold">{loc.rentMultiplier}x</span> · Elasticity:{' '}
                  {loc.priceElasticity}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </GameLayout>
  );
}
