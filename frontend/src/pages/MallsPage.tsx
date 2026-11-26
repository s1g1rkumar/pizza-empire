import {
  Building,
  Building2,
  Car,
  Coins,
  Layers,
  MapPin,
  Plus,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { GameLayout } from '@/components/GameLayout';
import { SectionCard } from '@/components/ui/SectionCard';
import { StatCard } from '@/components/ui/StatCard';
import {
  addMallFloor,
  clearMallError,
  collectMallRent,
  constructMall,
  createMallUnit,
  fetchMalls,
  purchaseMallLand,
  updateMallLease,
  upgradeMallParking,
} from '@/features/malls/mallSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { MallTier, MallUnitType } from '@/types/mall.types';

export function MallsPage() {
  const dispatch = useAppDispatch();
  const { data, loading, acting, error } = useAppSelector((state) => state.malls);

  const [landLocId, setLandLocId] = useState<number>(1);
  const [parcelName, setParcelName] = useState('Central Plaza Lot');
  const [maxFloors, setMaxFloors] = useState<number>(4);

  const [selectedLandId, setSelectedLandId] = useState<number>(0);
  const [mallName, setMallName] = useState('Grand Pizza Galleria');
  const [mallTier, setMallTier] = useState<MallTier>('BOUTIQUE_PLAZA');

  const [floorDraftByMall, setFloorDraftByMall] = useState<Record<number, number>>({});
  const [unitTypeByMall, setUnitTypeByMall] = useState<Record<number, MallUnitType>>({});
  const [unitNameByMall, setUnitNameByMall] = useState<Record<number, string>>({});
  const [occupancyByMall, setOccupancyByMall] = useState<
    Record<number, 'VACANT' | 'LEASED' | 'SELF_OPERATED'>
  >({});
  const [tenantByMall, setTenantByMall] = useState<Record<number, string>>({});
  const [rentDraftByUnit, setRentDraftByUnit] = useState<Record<number, number>>({});

  useEffect(() => {
    void dispatch(fetchMalls());
  }, [dispatch]);

  if (loading && !data) {
    return (
      <GameLayout>
        <div className="h-64 animate-pulse rounded-2xl border border-[#49352A]/10 bg-white/70" />
      </GameLayout>
    );
  }

  if (!data) return null;

  const undevelopedLands = data.lands.filter((l) => !l.isDeveloped);
  const resolvedLandId = selectedLandId || undevelopedLands[0]?.id || 0;

  const handlePurchaseLand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parcelName.trim()) return;
    void dispatch(
      purchaseMallLand({
        locationId: landLocId || data.locations[0]?.id || 1,
        parcelName: parcelName.trim(),
        maxFloors,
      })
    );
  };

  const handleConstructMall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedLandId || !mallName.trim()) return;
    void dispatch(
      constructMall({
        mallLandId: resolvedLandId,
        name: mallName.trim(),
        mallTier,
      })
    );
  };

  return (
    <GameLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-[#49352A]">Shopping Mall Empire</h1>
            <p className="text-sm text-[#49352A]/70">
              Acquire commercial land, build multi-floor malls, lease food courts & entertainment
              zones, and collect rental income
            </p>
          </div>
          <button
            type="button"
            onClick={() => void dispatch(fetchMalls())}
            className="inline-flex items-center gap-2 rounded-xl bg-[#49352A] px-4 py-2 text-xs font-bold text-[#FFF7E8]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Malls
          </button>
        </div>

        {error && (
          <div className="flex items-center justify-between rounded-xl border border-[#E94B35]/40 bg-[#E94B35]/10 px-4 py-3 text-sm text-[#E94B35]">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => dispatch(clearMallError())}
              className="text-xs font-bold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Summary KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Shopping Malls"
            value={String(data.summary.totalMalls)}
            subtitle={`${data.summary.totalUnits} units across ${data.summary.totalParcels} parcels`}
            icon={Building2}
            accentColor="orange"
          />
          <StatCard
            label="Daily Visitors"
            value={data.summary.totalDailyVisitors.toLocaleString()}
            subtitle="Combined mall footfall"
            icon={Users}
            accentColor="yellow"
          />
          <StatCard
            label="Lifetime Rental Income"
            value={`$${data.summary.totalRentalIncome.toLocaleString()}`}
            subtitle={`Cash: $${data.cashBalance.toLocaleString()}`}
            icon={Coins}
            accentColor="green"
          />
          <StatCard
            label="Projected Daily Profit"
            value={`$${data.summary.totalDailyNetProfit.toLocaleString()}`}
            subtitle="Rent + Visitor Rev - Upkeep"
            icon={TrendingUp}
            accentColor={data.summary.totalDailyNetProfit >= 0 ? 'green' : 'red'}
          />
        </div>

        {/* Land Purchase & Mall Construction */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard
            title="1. Purchase Commercial Land"
            subtitle="Acquire zoned land parcels in high-traffic districts"
          >
            <form onSubmit={handlePurchaseLand} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#49352A]/70">District</label>
                  <select
                    value={landLocId}
                    onChange={(e) => setLandLocId(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#49352A]/20 bg-white px-3 py-2 text-xs text-[#49352A]"
                  >
                    {data.locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} (~${loc.estimatedLandCost3Floors.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#49352A]/70">
                    Parcel Name
                  </label>
                  <input
                    type="text"
                    value={parcelName}
                    onChange={(e) => setParcelName(e.target.value)}
                    className="w-full rounded-xl border border-[#49352A]/20 bg-white px-3 py-2 text-xs text-[#49352A]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#49352A]/70">
                    Max Floors
                  </label>
                  <select
                    value={maxFloors}
                    onChange={(e) => setMaxFloors(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#49352A]/20 bg-white px-3 py-2 text-xs text-[#49352A]"
                  >
                    {[2, 3, 4, 5, 6].map((f) => (
                      <option key={f} value={f}>
                        Up to {f} Floors
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={acting}
                className="inline-flex items-center gap-2 rounded-xl bg-[#49352A] px-4 py-2 text-xs font-bold text-[#FFF7E8] disabled:opacity-50"
              >
                <MapPin className="h-3.5 w-3.5 text-[#FFC857]" />
                Buy Commercial Land
              </button>
            </form>
          </SectionCard>

          <SectionCard
            title="2. Construct Shopping Mall"
            subtitle="Build a mall on any undeveloped commercial parcel"
          >
            {undevelopedLands.length === 0 ? (
              <p className="text-xs text-[#49352A]/70">
                Purchase a commercial land parcel on the left first to begin mall construction.
              </p>
            ) : (
              <form onSubmit={handleConstructMall} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#49352A]/70">
                      Land Parcel
                    </label>
                    <select
                      value={resolvedLandId}
                      onChange={(e) => setSelectedLandId(Number(e.target.value))}
                      className="w-full rounded-xl border border-[#49352A]/20 bg-white px-3 py-2 text-xs text-[#49352A]"
                    >
                      {undevelopedLands.map((land) => (
                        <option key={land.id} value={land.id}>
                          {land.parcelName} ({land.locationName}, max {land.maxFloors}F)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#49352A]/70">
                      Mall Name
                    </label>
                    <input
                      type="text"
                      value={mallName}
                      onChange={(e) => setMallName(e.target.value)}
                      className="w-full rounded-xl border border-[#49352A]/20 bg-white px-3 py-2 text-xs text-[#49352A]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#49352A]/70">
                      Mall Blueprint
                    </label>
                    <select
                      value={mallTier}
                      onChange={(e) => setMallTier(e.target.value as MallTier)}
                      className="w-full rounded-xl border border-[#49352A]/20 bg-white px-3 py-2 text-xs text-[#49352A]"
                    >
                      {data.blueprints.map((bp) => (
                        <option key={bp.tier} value={bp.tier}>
                          {bp.label} (${bp.constructionCost.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={acting}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#E94B35] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  <Building className="h-3.5 w-3.5" />
                  Construct Mall
                </button>
              </form>
            )}
          </SectionCard>
        </div>

        {/* Malls Visual Management */}
        {data.malls.length === 0 ? (
          <SectionCard title="No Shopping Malls Constructed">
            <p className="text-sm text-[#49352A]/70">
              Buy commercial land and construct your first shopping mall above to unlock multi-floor
              tenants, food courts, and rental income!
            </p>
          </SectionCard>
        ) : (
          <div className="space-y-6">
            {data.malls.map((mall) => {
              const targetFloor = floorDraftByMall[mall.id] ?? 1;
              const targetUnitType = unitTypeByMall[mall.id] ?? 'FOOD_COURT';
              const targetUnitName = unitNameByMall[mall.id] ?? 'Empire Food Hall';
              const targetOccupancy = occupancyByMall[mall.id] ?? 'LEASED';
              const targetTenant = tenantByMall[mall.id] ?? 'Artisan Brands Co.';

              return (
                <SectionCard
                  key={mall.id}
                  title={`${mall.name} — ${mall.tierLabel}`}
                  subtitle={`${mall.locationName} (${mall.districtType}) · ${mall.floorsCount}/${mall.maxFloors} Floors · ${mall.occupiedUnitsCount}/${mall.totalCapacity} Units · ${mall.parkingSpaces} Parking Spaces`}
                  action={
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={acting || mall.floorsCount >= mall.maxFloors}
                        onClick={() => void dispatch(addMallFloor(mall.id))}
                        className="inline-flex items-center gap-1 rounded-xl bg-[#49352A] px-3 py-2 text-xs font-bold text-[#FFF7E8] disabled:opacity-40"
                      >
                        <Layers className="h-3.5 w-3.5 text-[#FFC857]" />
                        {mall.floorsCount >= mall.maxFloors
                          ? 'Max Floors'
                          : `+1 Floor ($${mall.nextFloorCost.toLocaleString()})`}
                      </button>
                      <button
                        type="button"
                        disabled={acting || mall.parkingLevel >= 10}
                        onClick={() => void dispatch(upgradeMallParking(mall.id))}
                        className="inline-flex items-center gap-1 rounded-xl bg-[#F28C38] px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
                      >
                        <Car className="h-3.5 w-3.5" />
                        +50 Parking (${mall.parkingUpgradeCost.toLocaleString()})
                      </button>
                      <button
                        type="button"
                        disabled={acting}
                        onClick={() => void dispatch(collectMallRent(mall.id))}
                        className="inline-flex items-center gap-1 rounded-xl bg-[#2E8B57] px-3.5 py-2 text-xs font-bold text-white disabled:opacity-50"
                      >
                        <Coins className="h-3.5 w-3.5" />
                        Collect Rent & Income
                      </button>
                    </div>
                  }
                >
                  <div className="space-y-5">
                    {/* Mall Metrics */}
                    <div className="grid gap-3 sm:grid-cols-4">
                      <div className="rounded-xl border border-[#49352A]/10 bg-[#FFF7E8]/60 p-3">
                        <p className="text-xs font-semibold text-[#49352A]/60">Daily Visitors</p>
                        <p className="text-lg font-extrabold text-[#49352A]">
                          {mall.dailyVisitors.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-xl border border-[#49352A]/10 bg-[#FFF7E8]/60 p-3">
                        <p className="text-xs font-semibold text-[#49352A]/60">
                          Daily Rental + Visitor Rev
                        </p>
                        <p className="text-lg font-extrabold text-[#2E8B57]">
                          ${(mall.dailyRentalIncome + mall.dailyVisitorIncome).toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-xl border border-[#49352A]/10 bg-[#FFF7E8]/60 p-3">
                        <p className="text-xs font-semibold text-[#49352A]/60">
                          Operating Expenses
                        </p>
                        <p className="text-lg font-extrabold text-[#E94B35]">
                          ${mall.dailyOperatingExpenses.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-xl border border-[#49352A]/10 bg-[#FFF7E8]/60 p-3">
                        <p className="text-xs font-semibold text-[#49352A]/60">Daily Net Profit</p>
                        <p
                          className={`text-lg font-extrabold ${
                            mall.dailyNetProfit >= 0 ? 'text-[#2E8B57]' : 'text-[#E94B35]'
                          }`}
                        >
                          ${mall.dailyNetProfit.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Build New Modular Mall Unit */}
                    <div className="rounded-xl border border-[#49352A]/10 bg-[#FFF7E8]/40 p-4">
                      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#49352A]/80">
                        <Sparkles className="h-3.5 w-3.5 text-[#E94B35]" />
                        Build Modular Mall Unit
                      </h3>
                      <div className="grid gap-2.5 sm:grid-cols-6">
                        <select
                          value={targetFloor}
                          onChange={(e) =>
                            setFloorDraftByMall((prev) => ({
                              ...prev,
                              [mall.id]: Number(e.target.value),
                            }))
                          }
                          className="rounded-xl border border-[#49352A]/20 bg-white px-2.5 py-2 text-xs text-[#49352A]"
                        >
                          {Array.from({ length: mall.floorsCount }, (_, i) => i + 1).map((fl) => (
                            <option key={fl} value={fl}>
                              Floor {fl}
                            </option>
                          ))}
                        </select>
                        <select
                          value={targetUnitType}
                          onChange={(e) =>
                            setUnitTypeByMall((prev) => ({
                              ...prev,
                              [mall.id]: e.target.value as MallUnitType,
                            }))
                          }
                          className="rounded-xl border border-[#49352A]/20 bg-white px-2.5 py-2 text-xs text-[#49352A]"
                        >
                          {data.unitBlueprints.map((ub) => (
                            <option key={ub.unitType} value={ub.unitType}>
                              {ub.label} (${ub.buildCost.toLocaleString()})
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={targetUnitName}
                          onChange={(e) =>
                            setUnitNameByMall((prev) => ({
                              ...prev,
                              [mall.id]: e.target.value,
                            }))
                          }
                          placeholder="Unit Name"
                          className="rounded-xl border border-[#49352A]/20 bg-white px-2.5 py-2 text-xs text-[#49352A]"
                        />
                        <select
                          value={targetOccupancy}
                          onChange={(e) =>
                            setOccupancyByMall((prev) => ({
                              ...prev,
                              [mall.id]: e.target.value as 'VACANT' | 'LEASED' | 'SELF_OPERATED',
                            }))
                          }
                          className="rounded-xl border border-[#49352A]/20 bg-white px-2.5 py-2 text-xs text-[#49352A]"
                        >
                          <option value="LEASED">Lease to Tenant</option>
                          <option value="SELF_OPERATED">Self-Operated</option>
                          <option value="VACANT">Leave Vacant</option>
                        </select>
                        <input
                          type="text"
                          value={targetTenant}
                          disabled={targetOccupancy !== 'LEASED'}
                          onChange={(e) =>
                            setTenantByMall((prev) => ({
                              ...prev,
                              [mall.id]: e.target.value,
                            }))
                          }
                          placeholder="Tenant Name"
                          className="rounded-xl border border-[#49352A]/20 bg-white px-2.5 py-2 text-xs text-[#49352A] disabled:opacity-50"
                        />
                        <button
                          type="button"
                          disabled={acting || !targetUnitName.trim()}
                          onClick={() =>
                            void dispatch(
                              createMallUnit({
                                mallId: mall.id,
                                floorNumber: targetFloor,
                                unitType: targetUnitType,
                                unitName: targetUnitName.trim(),
                                occupancyStatus: targetOccupancy,
                                tenantName: targetTenant,
                              })
                            )
                          }
                          className="inline-flex items-center justify-center gap-1 rounded-xl bg-[#E94B35] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Build Unit
                        </button>
                      </div>
                    </div>

                    {/* Visual Floor-by-Floor Layout */}
                    <div className="space-y-3">
                      {Array.from({ length: mall.floorsCount }, (_, i) => mall.floorsCount - i).map(
                        (floorNum) => {
                          const floorUnits = mall.units.filter((u) => u.floorNumber === floorNum);
                          const emptySlots = Math.max(0, mall.shopsPerFloor - floorUnits.length);

                          return (
                            <div
                              key={floorNum}
                              className="rounded-xl border border-[#49352A]/15 bg-white p-3.5"
                            >
                              <div className="mb-2.5 flex items-center justify-between">
                                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#49352A]">
                                  <Layers className="h-3.5 w-3.5 text-[#E94B35]" />
                                  Floor {floorNum} ({floorUnits.length}/{mall.shopsPerFloor} slots)
                                </span>
                              </div>
                              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                                {floorUnits.map((unit) => {
                                  const rentDraft = rentDraftByUnit[unit.id] ?? unit.monthlyRent;
                                  return (
                                    <div
                                      key={unit.id}
                                      className="flex flex-col justify-between rounded-xl border border-[#49352A]/15 bg-[#FFF7E8]/50 p-3"
                                    >
                                      <div>
                                        <div className="flex items-center justify-between gap-1">
                                          <span className="truncate text-xs font-extrabold text-[#49352A]">
                                            {unit.unitName}
                                          </span>
                                          <span
                                            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                              unit.occupancyStatus === 'LEASED'
                                                ? 'bg-[#2E8B57]/15 text-[#2E8B57]'
                                                : unit.occupancyStatus === 'SELF_OPERATED'
                                                  ? 'bg-[#FFC857]/30 text-[#49352A]'
                                                  : 'bg-[#49352A]/10 text-[#49352A]/60'
                                            }`}
                                          >
                                            {unit.occupancyStatus}
                                          </span>
                                        </div>
                                        <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-[#E94B35]">
                                          <ShoppingBag className="h-3 w-3" />
                                          {unit.typeLabel}
                                        </p>
                                        {unit.tenantName && (
                                          <p className="mt-1 text-[11px] text-[#49352A]/70">
                                            Tenant: {unit.tenantName}
                                          </p>
                                        )}
                                      </div>

                                      <div className="mt-2.5 flex items-center gap-1.5 border-t border-[#49352A]/10 pt-2">
                                        <input
                                          type="number"
                                          min={0}
                                          step={100}
                                          value={rentDraft}
                                          onChange={(e) =>
                                            setRentDraftByUnit((prev) => ({
                                              ...prev,
                                              [unit.id]: Number(e.target.value),
                                            }))
                                          }
                                          className="w-20 rounded-lg border border-[#49352A]/20 bg-white px-2 py-1 text-[11px] font-bold text-[#49352A]"
                                        />
                                        <button
                                          type="button"
                                          disabled={acting}
                                          onClick={() =>
                                            void dispatch(
                                              updateMallLease({
                                                mallId: mall.id,
                                                unitId: unit.id,
                                                occupancyStatus: 'LEASED',
                                                tenantName: unit.tenantName || 'Mall Tenant',
                                                monthlyRent: rentDraft,
                                                leaseMonths: unit.leaseMonths,
                                              })
                                            )
                                          }
                                          className="flex-1 rounded-lg bg-[#49352A] px-2 py-1 text-[10px] font-bold text-[#FFF7E8]"
                                        >
                                          Update Rent
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}

                                {Array.from({ length: emptySlots }).map((_, idx) => (
                                  <div
                                    key={`empty-${floorNum}-${idx}`}
                                    className="flex items-center justify-center rounded-xl border border-dashed border-[#49352A]/20 bg-[#FFF7E8]/20 p-4 text-[11px] font-semibold text-[#49352A]/45"
                                  >
                                    Available Floor Slot
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                </SectionCard>
              );
            })}
          </div>
        )}
      </div>
    </GameLayout>
  );
}
