import {
  ArrowUpCircle,
  Boxes,
  Building2,
  Coins,
  Factory,
  PackagePlus,
  Play,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
  Store,
  TrendingUp,
  UserPlus,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { GameLayout } from '@/components/GameLayout';
import { SectionCard } from '@/components/ui/SectionCard';
import { StatCard } from '@/components/ui/StatCard';
import {
  assignSupermarketEmployee,
  clearSupermarketError,
  constructSupermarket,
  fetchSupermarkets,
  purchaseSupermarketProduct,
  runSupermarketSales,
  supplySupermarketFromFactory,
  updateSupermarketListing,
  upgradeSupermarket,
} from '@/features/supermarkets/supermarketSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { SupermarketTier, SupermarketUpgradeType } from '@/types/supermarket.types';

const CATEGORY_OPTIONS = [
  'ALL',
  'RETAIL_GOOD',
  'PROCESSED_INGREDIENT',
  'PIZZA',
  'RAW_CROP',
  'PACKAGING',
] as const;

export function SupermarketsPage() {
  const dispatch = useAppDispatch();
  const { data, loading, acting, error } = useAppSelector((state) => state.supermarkets);

  const [storeName, setStoreName] = useState('Fresh Slice Market');
  const [storeTier, setStoreTier] = useState<SupermarketTier>('MINI_MART');
  const [locationId, setLocationId] = useState<number>(1);

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [buyItemByStore, setBuyItemByStore] = useState<Record<number, number>>({});
  const [buyQtyByStore, setBuyQtyByStore] = useState<Record<number, number>>({});

  const [factoryByStore, setFactoryByStore] = useState<Record<number, number>>({});
  const [factoryItemByStore, setFactoryItemByStore] = useState<Record<number, number>>({});
  const [factoryQtyByStore, setFactoryQtyByStore] = useState<Record<number, number>>({});

  const [priceDrafts, setPriceDrafts] = useState<Record<string, number>>({});
  const [empDrafts, setEmpDrafts] = useState<Record<number, number>>({});

  useEffect(() => {
    void dispatch(fetchSupermarkets());
  }, [dispatch]);

  if (loading && !data) {
    return (
      <GameLayout>
        <div className="h-64 animate-pulse rounded-2xl border border-[#49352A]/10 bg-white/70" />
      </GameLayout>
    );
  }

  if (!data) return null;

  const filteredCatalog = data.catalogItems.filter(
    (item) =>
      item.unitWholesaleBuy > 0 && (categoryFilter === 'ALL' || item.category === categoryFilter)
  );

  const handleConstruct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) return;
    const targetLocation = locationId || data.locations[0]?.id || 1;
    void dispatch(
      constructSupermarket({
        name: storeName.trim(),
        storeTier,
        locationId: targetLocation,
      })
    );
  };

  return (
    <GameLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-[#49352A]">Supermarket Management</h1>
            <p className="text-sm text-[#49352A]/70">
              Construct retail stores, stock factory & wholesale goods, tune shelf pricing, and
              drive daily profits
            </p>
          </div>
          <button
            type="button"
            onClick={() => void dispatch(fetchSupermarkets())}
            className="inline-flex items-center gap-2 rounded-xl bg-[#49352A] px-4 py-2 text-xs font-bold text-[#FFF7E8]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Stores
          </button>
        </div>

        {error && (
          <div className="flex items-center justify-between rounded-xl border border-[#E94B35]/40 bg-[#E94B35]/10 px-4 py-3 text-sm text-[#E94B35]">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => dispatch(clearSupermarketError())}
              className="text-xs font-bold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* KPI Summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Active Supermarkets"
            value={String(data.summary.totalStores)}
            subtitle={`${data.summary.totalInventoryUnits} units stocked`}
            icon={Store}
            accentColor="orange"
          />
          <StatCard
            label="Total Units Sold"
            value={String(data.summary.totalDailySales)}
            subtitle="Across all retail stores"
            icon={ShoppingBag}
            accentColor="yellow"
          />
          <StatCard
            label="24h Retail Revenue"
            value={`$${data.summary.totalDailyRevenue.toLocaleString()}`}
            subtitle={`Cash: $${data.cashBalance.toLocaleString()}`}
            icon={Coins}
            accentColor="green"
          />
          <StatCard
            label="24h Net Profit"
            value={`$${data.summary.totalNetProfit.toLocaleString()}`}
            subtitle={`Expenses: $${data.summary.totalDailyExpenses.toLocaleString()}`}
            icon={TrendingUp}
            accentColor={data.summary.totalNetProfit >= 0 ? 'green' : 'red'}
          />
        </div>

        {/* Store Construction */}
        <SectionCard
          title="Construct New Supermarket"
          subtitle="Open multiple supermarkets across city districts to sell retail & factory products"
        >
          <form onSubmit={handleConstruct} className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-[#49352A]/70">Store Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Downtown Fresh Market"
                className="w-full rounded-xl border border-[#49352A]/20 bg-white px-3 py-2 text-sm text-[#49352A]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-[#49352A]/70">Store Format</label>
              <select
                value={storeTier}
                onChange={(e) => setStoreTier(e.target.value as SupermarketTier)}
                className="w-full rounded-xl border border-[#49352A]/20 bg-white px-3 py-2 text-sm text-[#49352A]"
              >
                {data.blueprints.map((bp) => (
                  <option key={bp.tier} value={bp.tier}>
                    {bp.label} (${bp.constructionCost.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-[#49352A]/70">
                City District
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(Number(e.target.value))}
                className="w-full rounded-xl border border-[#49352A]/20 bg-white px-3 py-2 text-sm text-[#49352A]"
              >
                {data.locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.demandMultiplier.toFixed(2)}x demand)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={acting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#E94B35] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#d63f2a] disabled:opacity-50"
              >
                <Building2 className="h-4 w-4" />
                Construct Store
              </button>
            </div>
          </form>
        </SectionCard>

        {/* Supermarkets List */}
        {data.supermarkets.length === 0 ? (
          <SectionCard title="No Supermarkets Yet">
            <p className="text-sm text-[#49352A]/70">
              Construct your first supermarket above to start stocking wholesale goods and your own
              factory products!
            </p>
          </SectionCard>
        ) : (
          <div className="space-y-6">
            {data.supermarkets.map((store) => {
              const selectedBuyItemId = buyItemByStore[store.id] ?? filteredCatalog[0]?.id ?? 0;
              const buyQty = buyQtyByStore[store.id] ?? 25;

              const selectedFactoryId = factoryByStore[store.id] ?? data.factories[0]?.id ?? 0;
              const activeFactory = data.factories.find((f) => f.id === selectedFactoryId);
              const selectedFactoryItemId =
                factoryItemByStore[store.id] ?? activeFactory?.inventory[0]?.itemId ?? 0;
              const factoryQty = factoryQtyByStore[store.id] ?? 20;

              const selectedEmpId = empDrafts[store.id] ?? data.availableEmployees[0]?.id ?? 0;

              return (
                <SectionCard
                  key={store.id}
                  title={`${store.name} — ${store.tierLabel}`}
                  subtitle={`${store.locationName} (${store.districtType}) · ${store.locationDemandMultiplier.toFixed(2)}x demand · Storage ${store.storageUsed}/${store.storageCapacity}`}
                  action={
                    <button
                      type="button"
                      disabled={acting}
                      onClick={() => void dispatch(runSupermarketSales(store.id))}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#2E8B57] px-3.5 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                    >
                      <Play className="h-3.5 w-3.5" />
                      Run Daily Sales
                    </button>
                  }
                >
                  <div className="space-y-6">
                    {/* Store Financials */}
                    <div className="grid gap-3 sm:grid-cols-4">
                      <div className="rounded-xl border border-[#49352A]/10 bg-[#FFF7E8]/60 p-3">
                        <p className="text-xs font-semibold text-[#49352A]/60">Units Sold</p>
                        <p className="text-lg font-extrabold text-[#49352A]">
                          {store.dailySalesCount.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-xl border border-[#49352A]/10 bg-[#FFF7E8]/60 p-3">
                        <p className="text-xs font-semibold text-[#49352A]/60">24h Revenue</p>
                        <p className="text-lg font-extrabold text-[#2E8B57]">
                          ${store.dailyRevenue.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-xl border border-[#49352A]/10 bg-[#FFF7E8]/60 p-3">
                        <p className="text-xs font-semibold text-[#49352A]/60">24h Expenses</p>
                        <p className="text-lg font-extrabold text-[#E94B35]">
                          ${store.dailyExpenses.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-xl border border-[#49352A]/10 bg-[#FFF7E8]/60 p-3">
                        <p className="text-xs font-semibold text-[#49352A]/60">24h Net Profit</p>
                        <p
                          className={`text-lg font-extrabold ${
                            store.netProfit >= 0 ? 'text-[#2E8B57]' : 'text-[#E94B35]'
                          }`}
                        >
                          ${store.netProfit.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Store Upgrades */}
                    <div>
                      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#49352A]/70">
                        <ArrowUpCircle className="h-3.5 w-3.5 text-[#E94B35]" />
                        Store Upgrades
                      </h3>
                      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
                        {(Object.keys(data.upgradeConfigs) as SupermarketUpgradeType[]).map(
                          (upgKey) => {
                            const cfg = data.upgradeConfigs[upgKey];
                            const cost = store.upgradeCosts[upgKey];
                            const lvl =
                              upgKey === 'AISLES'
                                ? store.aisleLevel
                                : upgKey === 'CHECKOUT_LANES'
                                  ? store.checkoutLanes
                                  : upgKey === 'COLD_STORAGE'
                                    ? store.coldStorageLevel
                                    : upgKey === 'DECOR'
                                      ? store.decorLevel
                                      : Math.max(
                                          1,
                                          Math.round((store.storageCapacity - 100) / 300)
                                        );

                            return (
                              <div
                                key={upgKey}
                                className="flex flex-col justify-between rounded-xl border border-[#49352A]/10 bg-white p-3"
                              >
                                <div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-[#49352A]">
                                      {cfg.label}
                                    </span>
                                    <span className="rounded bg-[#FFC857]/30 px-1.5 py-0.5 text-[10px] font-extrabold text-[#49352A]">
                                      Lv {lvl}/{cfg.maxLevel}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-[11px] text-[#49352A]/65">
                                    {cfg.description}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  disabled={acting || lvl >= cfg.maxLevel}
                                  onClick={() =>
                                    void dispatch(
                                      upgradeSupermarket({
                                        supermarketId: store.id,
                                        upgradeType: upgKey,
                                      })
                                    )
                                  }
                                  className="mt-2.5 w-full rounded-lg bg-[#49352A] px-2.5 py-1.5 text-xs font-bold text-[#FFF7E8] disabled:opacity-40"
                                >
                                  {lvl >= cfg.maxLevel
                                    ? 'Maxed'
                                    : `Upgrade ($${cost.toLocaleString()})`}
                                </button>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>

                    {/* Supply & Purchasing Row */}
                    <div className="grid gap-4 lg:grid-cols-2">
                      {/* Wholesale Product Purchasing */}
                      <div className="rounded-xl border border-[#49352A]/10 bg-[#FFF7E8]/40 p-4">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <h3 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#49352A]/80">
                            <ShoppingCart className="h-3.5 w-3.5 text-[#E94B35]" />
                            Buy Wholesale Products
                          </h3>
                          <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="rounded-lg border border-[#49352A]/20 bg-white px-2 py-1 text-[11px] font-semibold text-[#49352A]"
                          >
                            {CATEGORY_OPTIONS.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat.replace(/_/g, ' ')}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <select
                            value={selectedBuyItemId}
                            onChange={(e) =>
                              setBuyItemByStore((prev) => ({
                                ...prev,
                                [store.id]: Number(e.target.value),
                              }))
                            }
                            className="min-w-[180px] flex-1 rounded-xl border border-[#49352A]/20 bg-white px-3 py-2 text-xs text-[#49352A]"
                          >
                            {filteredCatalog.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name} (${item.unitWholesaleBuy.toFixed(2)}/u)
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min={1}
                            max={2000}
                            value={buyQty}
                            onChange={(e) =>
                              setBuyQtyByStore((prev) => ({
                                ...prev,
                                [store.id]: Math.max(1, Number(e.target.value)),
                              }))
                            }
                            className="w-20 rounded-xl border border-[#49352A]/20 bg-white px-2.5 py-2 text-xs text-[#49352A]"
                          />
                          <button
                            type="button"
                            disabled={acting || !selectedBuyItemId}
                            onClick={() =>
                              void dispatch(
                                purchaseSupermarketProduct({
                                  supermarketId: store.id,
                                  itemId: selectedBuyItemId,
                                  quantity: buyQty,
                                })
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-xl bg-[#E94B35] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                          >
                            <PackagePlus className="h-3.5 w-3.5" />
                            Buy Stock
                          </button>
                        </div>
                      </div>

                      {/* Internal Factory -> Supermarket Supply */}
                      <div className="rounded-xl border border-[#49352A]/10 bg-[#FFF7E8]/40 p-4">
                        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#49352A]/80">
                          <Factory className="h-3.5 w-3.5 text-[#2E8B57]" />
                          Internal Factory-to-Supermarket Supply
                        </h3>
                        {data.factories.length === 0 ? (
                          <p className="text-xs text-[#49352A]/60">
                            Build a Food Processing Factory to supply your supermarkets directly.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <select
                              value={selectedFactoryId}
                              onChange={(e) =>
                                setFactoryByStore((prev) => ({
                                  ...prev,
                                  [store.id]: Number(e.target.value),
                                }))
                              }
                              className="rounded-xl border border-[#49352A]/20 bg-white px-2.5 py-2 text-xs text-[#49352A]"
                            >
                              {data.factories.map((fac) => (
                                <option key={fac.id} value={fac.id}>
                                  {fac.name}
                                </option>
                              ))}
                            </select>
                            <select
                              value={selectedFactoryItemId}
                              onChange={(e) =>
                                setFactoryItemByStore((prev) => ({
                                  ...prev,
                                  [store.id]: Number(e.target.value),
                                }))
                              }
                              className="min-w-[160px] flex-1 rounded-xl border border-[#49352A]/20 bg-white px-2.5 py-2 text-xs text-[#49352A]"
                            >
                              {activeFactory && activeFactory.inventory.length > 0 ? (
                                activeFactory.inventory.map((inv) => (
                                  <option key={inv.itemId} value={inv.itemId}>
                                    {inv.itemName} ({inv.availableQuantity} avail)
                                  </option>
                                ))
                              ) : (
                                <option value={0}>No factory stock available</option>
                              )}
                            </select>
                            <input
                              type="number"
                              min={1}
                              max={5000}
                              value={factoryQty}
                              onChange={(e) =>
                                setFactoryQtyByStore((prev) => ({
                                  ...prev,
                                  [store.id]: Math.max(1, Number(e.target.value)),
                                }))
                              }
                              className="w-20 rounded-xl border border-[#49352A]/20 bg-white px-2.5 py-2 text-xs text-[#49352A]"
                            />
                            <button
                              type="button"
                              disabled={acting || !selectedFactoryId || !selectedFactoryItemId}
                              onClick={() =>
                                void dispatch(
                                  supplySupermarketFromFactory({
                                    supermarketId: store.id,
                                    factoryId: selectedFactoryId,
                                    itemId: selectedFactoryItemId,
                                    quantity: factoryQty,
                                  })
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-xl bg-[#2E8B57] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                            >
                              <Boxes className="h-3.5 w-3.5" />
                              Transfer
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Employees */}
                    <div className="rounded-xl border border-[#49352A]/10 bg-white p-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#49352A]/75">
                          Store Staff ({store.employees.length})
                        </h3>
                        {data.availableEmployees.length > 0 && (
                          <div className="flex items-center gap-2">
                            <select
                              value={selectedEmpId}
                              onChange={(e) =>
                                setEmpDrafts((prev) => ({
                                  ...prev,
                                  [store.id]: Number(e.target.value),
                                }))
                              }
                              className="rounded-lg border border-[#49352A]/20 bg-white px-2.5 py-1.5 text-xs text-[#49352A]"
                            >
                              {data.availableEmployees.map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                  {emp.fullName} ({emp.role}, Lv {emp.skillLevel})
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              disabled={acting || !selectedEmpId}
                              onClick={() =>
                                void dispatch(
                                  assignSupermarketEmployee({
                                    supermarketId: store.id,
                                    employeeId: selectedEmpId,
                                  })
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-lg bg-[#49352A] px-3 py-1.5 text-xs font-bold text-[#FFF7E8] disabled:opacity-50"
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                              Assign
                            </button>
                          </div>
                        )}
                      </div>
                      {store.employees.length === 0 ? (
                        <p className="text-xs text-[#49352A]/60">
                          No employees assigned yet. Assign staff to boost customer checkout speed.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {store.employees.map((emp) => (
                            <span
                              key={emp.id}
                              className="rounded-lg border border-[#49352A]/15 bg-[#FFF7E8]/60 px-2.5 py-1 text-xs font-semibold text-[#49352A]"
                            >
                              {emp.fullName} · {emp.role} · {emp.productivity.toFixed(2)}x
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Shelf Listings & Pricing */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[#49352A]/15 text-[#49352A]/60">
                            <th className="py-2 pr-3 font-bold">Product</th>
                            <th className="py-2 pr-3 font-bold">Category</th>
                            <th className="py-2 pr-3 font-bold">Stock</th>
                            <th className="py-2 pr-3 font-bold">Est. Demand</th>
                            <th className="py-2 pr-3 font-bold">Retail Price</th>
                            <th className="py-2 pr-3 font-bold">Sold</th>
                            <th className="py-2 font-bold">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#49352A]/10">
                          {store.listings.map((item) => {
                            const draftKey = `${store.id}_${item.itemId}`;
                            const draftPrice = priceDrafts[draftKey] ?? item.customPrice;

                            return (
                              <tr key={item.id}>
                                <td className="py-2.5 pr-3 font-bold text-[#49352A]">
                                  {item.itemName}
                                </td>
                                <td className="py-2.5 pr-3">
                                  <span className="rounded bg-[#49352A]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#49352A]">
                                    {item.category.replace(/_/g, ' ')}
                                  </span>
                                </td>
                                <td className="py-2.5 pr-3 font-semibold text-[#49352A]">
                                  {item.availableStock}
                                </td>
                                <td className="py-2.5 pr-3 font-semibold text-[#2E8B57]">
                                  {item.estimatedDemand} / cycle
                                </td>
                                <td className="py-2.5 pr-3">
                                  <input
                                    type="number"
                                    step="0.25"
                                    min="0.50"
                                    value={draftPrice}
                                    onChange={(e) =>
                                      setPriceDrafts((prev) => ({
                                        ...prev,
                                        [draftKey]: Number(e.target.value),
                                      }))
                                    }
                                    className="w-20 rounded-lg border border-[#49352A]/20 bg-white px-2 py-1 text-xs font-bold text-[#49352A]"
                                  />
                                </td>
                                <td className="py-2.5 pr-3 text-[#49352A]/80">
                                  {item.totalSold} (${item.totalRevenue.toFixed(2)})
                                </td>
                                <td className="py-2.5">
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      disabled={acting}
                                      onClick={() =>
                                        void dispatch(
                                          updateSupermarketListing({
                                            supermarketId: store.id,
                                            itemId: item.itemId,
                                            customPrice: draftPrice,
                                            isEnabled: item.isEnabled,
                                          })
                                        )
                                      }
                                      className="rounded-lg bg-[#49352A] px-2.5 py-1 text-[11px] font-bold text-[#FFF7E8]"
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      disabled={acting}
                                      onClick={() =>
                                        void dispatch(
                                          updateSupermarketListing({
                                            supermarketId: store.id,
                                            itemId: item.itemId,
                                            customPrice: draftPrice,
                                            isEnabled: !item.isEnabled,
                                          })
                                        )
                                      }
                                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                                        item.isEnabled
                                          ? 'bg-[#2E8B57]/15 text-[#2E8B57]'
                                          : 'bg-[#E94B35]/15 text-[#E94B35]'
                                      }`}
                                    >
                                      {item.isEnabled ? 'On Sale' : 'Paused'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
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
