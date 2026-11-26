import {
  ArrowUpCircle,
  Building2,
  Coins,
  Flame,
  PlusCircle,
  RefreshCw,
  Star,
  Store,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { GameLayout } from '@/components/GameLayout';
import { IsometricRestaurantView } from '@/components/game/IsometricRestaurantView';
import { RestaurantCard } from '@/components/RestaurantCard';
import { SectionCard } from '@/components/ui/SectionCard';
import { StatCard } from '@/components/ui/StatCard';
import {
  clearRestaurantError,
  constructRestaurant,
  fetchRestaurants,
  serveRestaurantCustomers,
  updateRestaurantMenu,
  upgradeRestaurant,
} from '@/features/restaurants/restaurantSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { RestaurantType } from '@/types/restaurant.types';

export function RestaurantsPage() {
  const dispatch = useAppDispatch();
  const { data, loading, acting, error } = useAppSelector((state) => state.restaurants);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newName, setNewName] = useState('Bella Napoli Pizzeria');
  const [newType, setNewType] = useState<RestaurantType>('SMALL_SHOP');
  const [newLocId, setNewLocId] = useState<number>(1);

  useEffect(() => {
    void dispatch(fetchRestaurants());
  }, [dispatch]);

  useEffect(() => {
    if (data && data.restaurants.length > 0 && selectedId === null) {
      setSelectedId(data.restaurants[0]!.id);
    }
    if (data && data.locations.length > 0 && newLocId === 1) {
      setNewLocId(data.locations[0]!.id);
    }
  }, [data, selectedId, newLocId]);

  if (loading && !data) {
    return (
      <GameLayout>
        <div className="h-64 animate-pulse rounded-2xl border border-[#49352A]/10 bg-white/70" />
      </GameLayout>
    );
  }

  if (!data) return null;

  const selectedRest =
    data.restaurants.find((r) => r.id === selectedId) ?? data.restaurants[0] ?? null;

  return (
    <GameLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-[#49352A]">Restaurant Management</h1>
            <p className="text-sm text-[#49352A]/70">
              Construct restaurants, tune menu pricing & quality, and serve customer demand
            </p>
          </div>
          <button
            type="button"
            onClick={() => void dispatch(fetchRestaurants())}
            disabled={loading || acting}
            className="inline-flex items-center gap-2 rounded-xl bg-[#49352A] px-4 py-2 text-xs font-bold text-[#FFF7E8] hover:bg-[#3a2a21]"
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
              onClick={() => dispatch(clearRestaurantError())}
              className="text-xs font-bold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Restaurant Cards Grid */}
        {data.restaurants.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.restaurants.map((rest) => (
              <RestaurantCard
                key={rest.id}
                restaurant={rest}
                selected={selectedRest?.id === rest.id}
                onSelect={() => setSelectedId(rest.id)}
              />
            ))}
          </div>
        )}

        {/* Selected Restaurant Detailed Dashboard */}
        {selectedRest && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#49352A]/10 bg-white p-5">
              <div>
                <h2 className="text-xl font-extrabold text-[#49352A]">{selectedRest.name}</h2>
                <p className="text-xs text-[#49352A]/70">
                  {selectedRest.typeLabel} · {selectedRest.locationName} (Demand{' '}
                  {selectedRest.locationDemandMultiplier}x) · Upkeep ${selectedRest.hourlyUpkeep}
                  /hr
                </p>
              </div>
              <button
                type="button"
                disabled={acting}
                onClick={() => void dispatch(serveRestaurantCustomers(selectedRest.id))}
                className="inline-flex items-center gap-2 rounded-xl bg-[#E94B35] px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-[#d63e29] disabled:opacity-50"
              >
                <Flame className="h-4 w-4" />
                Serve Customer Demand ({selectedRest.estimatedDemand} orders)
              </button>
            </div>

            <IsometricRestaurantView
              restaurant={selectedRest}
              cashBalance={data.cashBalance}
              acting={acting}
              onServeCustomers={() => void dispatch(serveRestaurantCustomers(selectedRest.id))}
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="24h Revenue"
                value={`$${selectedRest.dailyRevenue.toFixed(2)}`}
                icon={TrendingUp}
                accentColor="green"
              />
              <StatCard
                label="24h Expenses"
                value={`$${selectedRest.dailyExpenses.toFixed(2)}`}
                icon={TrendingDown}
                accentColor="red"
              />
              <StatCard
                label="Net Profit"
                value={`$${selectedRest.netProfit.toFixed(2)}`}
                icon={Coins}
                accentColor={selectedRest.netProfit >= 0 ? 'green' : 'red'}
              />
              <StatCard
                label="Rating & Staff"
                value={`${selectedRest.avgRating.toFixed(1)}★`}
                subtitle={`${selectedRest.totalRatingsCount} reviews · ${selectedRest.employees.length} staff`}
                icon={Star}
                accentColor="yellow"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <SectionCard
                  title="Restaurant Menu & Pizza Inventory"
                  subtitle="Adjust pricing, toggle availability, or upgrade star quality"
                >
                  <div className="space-y-3">
                    {selectedRest.menu.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#49352A]/10 bg-[#FFF7E8]/60 p-3.5"
                      >
                        <div>
                          <p className="font-bold text-[#49352A]">
                            {item.itemName}{' '}
                            <span className="text-xs text-[#F28C38]">
                              ({'★'.repeat(item.starQuality)})
                            </span>
                          </p>
                          <p className="text-xs text-[#49352A]/70">
                            In Stock: <span className="font-bold">{item.availableStock}</span> ·
                            Sold: {item.totalSold} · Base: ${item.basePrice}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            step="0.5"
                            defaultValue={item.customPrice}
                            onBlur={(e) => {
                              const val = Number(e.target.value);
                              if (val > 0 && val !== item.customPrice) {
                                void dispatch(
                                  updateRestaurantMenu({
                                    restaurantId: selectedRest.id,
                                    menuId: item.id,
                                    updates: { customPrice: val },
                                  })
                                );
                              }
                            }}
                            className="w-20 rounded-lg border border-[#49352A]/20 bg-white px-2 py-1 text-xs font-bold text-[#49352A]"
                          />
                          <button
                            type="button"
                            disabled={acting || item.starQuality >= 5}
                            onClick={() =>
                              void dispatch(
                                updateRestaurantMenu({
                                  restaurantId: selectedRest.id,
                                  menuId: item.id,
                                  updates: { upgradeStarQuality: true },
                                })
                              )
                            }
                            className="rounded-lg bg-[#F28C38] px-2.5 py-1 text-[11px] font-bold text-white disabled:opacity-40"
                          >
                            {item.starQuality >= 5 ? '5★ Max' : `+1★ ($${item.starUpgradeCost})`}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>

              <div className="space-y-6">
                <SectionCard title="Restaurant Upgrades" subtitle="Expand capacity & decor">
                  <div className="space-y-2.5">
                    {(['OVEN', 'TABLES', 'DECOR'] as const).map((uType) => (
                      <button
                        key={uType}
                        type="button"
                        disabled={acting}
                        onClick={() =>
                          void dispatch(
                            upgradeRestaurant({
                              restaurantId: selectedRest.id,
                              upgradeType: uType,
                            })
                          )
                        }
                        className="flex w-full items-center justify-between rounded-xl border border-[#49352A]/15 bg-[#FFF7E8] px-3.5 py-2.5 text-xs font-bold text-[#49352A] hover:border-[#E94B35]"
                      >
                        <span>
                          Upgrade {uType} (
                          {uType === 'OVEN'
                            ? selectedRest.ovenCount
                            : uType === 'TABLES'
                              ? selectedRest.diningTablesCount
                              : selectedRest.decorLevel}
                          )
                        </span>
                        <ArrowUpCircle className="h-4 w-4 text-[#E94B35]" />
                      </button>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Assigned Staff" subtitle="Chefs, Cashiers & Prep Cooks">
                  {selectedRest.employees.length === 0 ? (
                    <div className="flex flex-col items-center py-4 text-center text-xs text-[#49352A]/60">
                      <Users className="mb-1 h-5 w-5 text-[#49352A]/40" />
                      No staff assigned yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedRest.employees.map((emp) => (
                        <div
                          key={emp.id}
                          className="flex items-center justify-between rounded-lg bg-[#FFF7E8]/60 px-3 py-2 text-xs"
                        >
                          <span className="font-bold text-[#49352A]">
                            {emp.fullName} ({emp.role})
                          </span>
                          <span className="font-semibold text-[#58A66A]">{emp.productivity}x</span>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
              </div>
            </div>
          </div>
        )}

        {/* Construct New Restaurant */}
        <SectionCard
          title="Construct New Restaurant"
          subtitle={`Available Cash: $${data.cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {data.blueprints.map((bp) => (
              <div
                key={bp.type}
                onClick={() => setNewType(bp.type)}
                className={`cursor-pointer rounded-xl border p-3.5 transition ${
                  newType === bp.type
                    ? 'border-[#E94B35] bg-[#FFC857]/20'
                    : 'border-[#49352A]/10 bg-[#FFF7E8]/50 hover:border-[#F28C38]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-sm font-bold text-[#49352A]">
                  <Store className="h-4 w-4 text-[#E94B35]" />
                  <span>{bp.label}</span>
                </div>
                <p className="mt-1 text-xs font-extrabold text-[#58A66A]">
                  ${bp.constructionCost.toLocaleString()}
                </p>
                <p className="mt-1 text-[11px] text-[#49352A]/70">
                  {bp.baseTables} Tables · {bp.baseOvens} Ovens · {bp.demandBonus}x Demand
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <label className="mb-1 block text-xs font-bold text-[#49352A]">Restaurant Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded-xl border border-[#49352A]/20 bg-[#FFF7E8]/50 px-3 py-2 text-sm text-[#49352A]"
              />
            </div>
            <div className="min-w-[180px]">
              <label className="mb-1 block text-xs font-bold text-[#49352A]">Location</label>
              <select
                value={newLocId}
                onChange={(e) => setNewLocId(Number(e.target.value))}
                className="w-full rounded-xl border border-[#49352A]/20 bg-[#FFF7E8]/50 px-3 py-2 text-sm text-[#49352A]"
              >
                {data.locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.demandMultiplier}x)
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              disabled={acting || newName.trim().length < 2}
              onClick={() =>
                void dispatch(
                  constructRestaurant({
                    name: newName,
                    restaurantType: newType,
                    locationId: newLocId,
                  })
                )
              }
              className="inline-flex items-center gap-2 rounded-xl bg-[#58A66A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#498f59] disabled:opacity-45"
            >
              <PlusCircle className="h-4 w-4" />
              Construct Restaurant
            </button>
          </div>
        </SectionCard>

        {data.restaurants.length === 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-[#49352A]/20 bg-white/70 p-6 text-sm text-[#49352A]/75">
            <Building2 className="h-5 w-5 text-[#F28C38]" />
            <span>
              You have not built a restaurant yet. Select a blueprint above to open your first pizza
              shop!
            </span>
          </div>
        )}
      </div>
    </GameLayout>
  );
}
