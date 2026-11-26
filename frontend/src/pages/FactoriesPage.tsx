import {
  ArrowUpCircle,
  Boxes,
  Clock,
  Cog,
  Factory,
  Gauge,
  PlusCircle,
  RefreshCw,
  Send,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { GameLayout } from '@/components/GameLayout';
import { SectionCard } from '@/components/ui/SectionCard';
import { StatCard } from '@/components/ui/StatCard';
import {
  clearFactoryError,
  constructFactory,
  fetchFactories,
  purchaseFactoryMachine,
  startFactoryBatch,
  transferFactoryOutput,
  upgradeFactoryStorage,
} from '@/features/factories/factorySlice';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { FactoryType } from '@/types/factory.types';

export function FactoriesPage() {
  const dispatch = useAppDispatch();
  const { data, loading, acting, error } = useAppSelector((state) => state.factories);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newName, setNewName] = useState('Eastside Processing Plant');
  const [newType, setNewType] = useState<FactoryType>('FLOUR_MILL');
  const [newLocId, setNewLocId] = useState<number>(1);
  const [batchQty, setBatchQty] = useState<number>(1);
  const [targetBizId, setTargetBizId] = useState<number>(0);
  const [transferQty, setTransferQty] = useState<number>(10);

  useEffect(() => {
    void dispatch(fetchFactories());
  }, [dispatch]);

  useEffect(() => {
    if (data && data.factories.length > 0 && selectedId === null) {
      setSelectedId(data.factories[0]!.id);
    }
    if (data && data.locations.length > 0 && newLocId === 1) {
      setNewLocId(data.locations[0]!.id);
    }
    if (data && data.targetBusinesses.length > 0 && targetBizId === 0) {
      setTargetBizId(data.targetBusinesses[0]!.id);
    }
  }, [data, selectedId, newLocId, targetBizId]);

  if (loading && !data) {
    return (
      <GameLayout>
        <div className="h-64 animate-pulse rounded-2xl border border-[#49352A]/10 bg-white/70" />
      </GameLayout>
    );
  }

  if (!data) return null;

  const selectedFactory =
    data.factories.find((f) => f.id === selectedId) ?? data.factories[0] ?? null;

  return (
    <GameLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-[#49352A]">Food Processing Factories</h1>
            <p className="text-sm text-[#49352A]/70">
              Process raw crops into bulk ingredients & packaging, then supply your restaurants and
              supermarkets
            </p>
          </div>
          <button
            type="button"
            onClick={() => void dispatch(fetchFactories())}
            className="inline-flex items-center gap-2 rounded-xl bg-[#49352A] px-4 py-2 text-xs font-bold text-[#FFF7E8]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Factories
          </button>
        </div>

        {error && (
          <div className="flex items-center justify-between rounded-xl border border-[#E94B35]/40 bg-[#E94B35]/10 px-4 py-3 text-sm text-[#E94B35]">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => dispatch(clearFactoryError())}
              className="text-xs font-bold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Owned Factories Selector */}
        {data.factories.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.factories.map((fac) => (
              <div
                key={fac.id}
                onClick={() => setSelectedId(fac.id)}
                className={`cursor-pointer rounded-2xl border p-4 transition ${
                  selectedFactory?.id === fac.id
                    ? 'border-[#E94B35] bg-white shadow-md'
                    : 'border-[#49352A]/10 bg-white/80 hover:border-[#F28C38]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Factory className="h-4 w-4 text-[#E94B35]" />
                    <span className="font-bold text-[#49352A]">{fac.name}</span>
                  </div>
                  <span className="text-xs font-bold text-[#F28C38]">{fac.speedMultiplier}x</span>
                </div>
                <p className="mt-1 text-xs text-[#49352A]/70">
                  {fac.typeLabel} · {fac.locationName}
                </p>
                <p className="mt-2 text-xs font-semibold text-[#49352A]/80">
                  Machines: {fac.machineCount} · Queue: {fac.activeOrders.length}/
                  {fac.queueCapacity}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Selected Factory Management */}
        {selectedFactory && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Machines & Speed"
                value={`${selectedFactory.machineCount} (${selectedFactory.speedMultiplier}x)`}
                subtitle={`Upkeep $${selectedFactory.hourlyUpkeep}/hr`}
                icon={Cog}
                accentColor="orange"
              />
              <StatCard
                label="Queue Capacity"
                value={`${selectedFactory.activeOrders.length} / ${selectedFactory.queueCapacity}`}
                icon={Gauge}
                accentColor="red"
              />
              <StatCard
                label="Warehouse Storage"
                value={`${selectedFactory.storageUsed} / ${selectedFactory.storageCapacity}`}
                icon={Boxes}
                accentColor="yellow"
              />
              <StatCard
                label="Assigned Staff"
                value={`${selectedFactory.employees.length}`}
                icon={Users}
                accentColor="green"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <SectionCard
                  title={`Production Line: ${selectedFactory.recipe?.name ?? 'Line'}`}
                  subtitle="Reserve raw inputs and run industrial batches"
                >
                  {selectedFactory.recipe && (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-[#49352A]/10 bg-[#FFF7E8]/60 p-4">
                        <p className="text-sm font-bold text-[#49352A]">
                          Output: {selectedFactory.recipe.outputQuantity}x{' '}
                          {selectedFactory.recipe.outputItemName} (In Stock:{' '}
                          {selectedFactory.recipe.outputStock})
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedFactory.recipe.ingredients.map((ing) => (
                            <span
                              key={ing.itemId}
                              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                ing.availableStock >= ing.quantityRequired * batchQty
                                  ? 'bg-[#58A66A]/15 text-[#347544]'
                                  : 'bg-[#E94B35]/15 text-[#E94B35]'
                              }`}
                            >
                              {ing.quantityRequired * batchQty}x {ing.name} (Avail:{' '}
                              {ing.availableStock})
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={batchQty}
                          onChange={(e) => setBatchQty(Math.max(1, Number(e.target.value)))}
                          className="w-24 rounded-xl border border-[#49352A]/20 bg-white px-3 py-2 text-sm font-bold"
                        />
                        <button
                          type="button"
                          disabled={acting}
                          onClick={() =>
                            void dispatch(
                              startFactoryBatch({
                                factoryId: selectedFactory.id,
                                quantity: batchQty,
                              })
                            )
                          }
                          className="rounded-xl bg-[#E94B35] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#d63e29]"
                        >
                          Start Factory Batch
                        </button>
                      </div>

                      {selectedFactory.activeOrders.length > 0 && (
                        <div className="space-y-2 pt-2">
                          {selectedFactory.activeOrders.map((o) => (
                            <div
                              key={o.id}
                              className="flex items-center justify-between rounded-xl bg-[#FFF7E8] px-3 py-2 text-xs"
                            >
                              <span className="font-bold text-[#49352A]">
                                {o.quantity}x {o.recipeName}
                              </span>
                              <span className="inline-flex items-center gap-1 font-semibold text-[#F28C38]">
                                <Clock className="h-3.5 w-3.5" />
                                {new Date(o.completesAt).toLocaleTimeString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </SectionCard>
              </div>

              <div className="space-y-6">
                <SectionCard title="Machines & Storage" subtitle="Expand factory throughput">
                  <div className="space-y-2.5">
                    <button
                      type="button"
                      disabled={acting}
                      onClick={() => void dispatch(purchaseFactoryMachine(selectedFactory.id))}
                      className="flex w-full items-center justify-between rounded-xl bg-[#F28C38] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#df7c2b]"
                    >
                      <span>Buy Machine (+1 Queue, +15% Spd)</span>
                      <span>${selectedFactory.nextMachineCost}</span>
                    </button>
                    <button
                      type="button"
                      disabled={acting}
                      onClick={() => void dispatch(upgradeFactoryStorage(selectedFactory.id))}
                      className="flex w-full items-center justify-between rounded-xl border border-[#49352A]/20 bg-[#FFF7E8] px-4 py-2.5 text-xs font-bold text-[#49352A]"
                    >
                      <span>Expand Storage (+250)</span>
                      <ArrowUpCircle className="h-4 w-4 text-[#E94B35]" />
                    </button>
                  </div>
                </SectionCard>

                {selectedFactory.recipe && data.targetBusinesses.length > 0 && (
                  <SectionCard
                    title="Supply Restaurants & Markets"
                    subtitle="Internal business-to-business transfer"
                  >
                    <div className="space-y-3 text-xs">
                      <select
                        value={targetBizId}
                        onChange={(e) => setTargetBizId(Number(e.target.value))}
                        className="w-full rounded-xl border border-[#49352A]/20 bg-[#FFF7E8] px-3 py-2 font-bold text-[#49352A]"
                      >
                        {data.targetBusinesses.map((tb) => (
                          <option key={tb.id} value={tb.id}>
                            {tb.name} ({tb.businessType})
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min={1}
                          value={transferQty}
                          onChange={(e) => setTransferQty(Math.max(1, Number(e.target.value)))}
                          className="w-24 rounded-xl border border-[#49352A]/20 bg-white px-3 py-2 font-bold"
                        />
                        <button
                          type="button"
                          disabled={acting || selectedFactory.recipe.outputStock < 1}
                          onClick={() =>
                            selectedFactory.recipe &&
                            void dispatch(
                              transferFactoryOutput({
                                factoryId: selectedFactory.id,
                                toBusinessId: targetBizId,
                                itemId: selectedFactory.recipe.outputItemId,
                                quantity: transferQty,
                              })
                            )
                          }
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#58A66A] py-2 font-bold text-white disabled:opacity-40"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Transfer Output
                        </button>
                      </div>
                    </div>
                  </SectionCard>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Construct Factory */}
        <SectionCard
          title="Construct Food Processing Factory"
          subtitle={`Available Cash: $${data.cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
                <p className="text-sm font-bold text-[#49352A]">{bp.label}</p>
                <p className="mt-1 text-xs font-extrabold text-[#58A66A]">
                  ${bp.constructionCost.toLocaleString()}
                </p>
                <p className="mt-1 text-[11px] text-[#49352A]/70">
                  Storage {bp.storageCapacity} · Upkeep ${bp.hourlyUpkeep}/hr
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <label className="mb-1 block text-xs font-bold text-[#49352A]">Factory Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded-xl border border-[#49352A]/20 bg-[#FFF7E8]/50 px-3 py-2 text-sm"
              />
            </div>
            <div className="min-w-[180px]">
              <label className="mb-1 block text-xs font-bold text-[#49352A]">Location</label>
              <select
                value={newLocId}
                onChange={(e) => setNewLocId(Number(e.target.value))}
                className="w-full rounded-xl border border-[#49352A]/20 bg-[#FFF7E8]/50 px-3 py-2 text-sm"
              >
                {data.locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              disabled={acting || newName.trim().length < 2}
              onClick={() =>
                void dispatch(
                  constructFactory({ name: newName, factoryType: newType, locationId: newLocId })
                )
              }
              className="inline-flex items-center gap-2 rounded-xl bg-[#58A66A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#498f59]"
            >
              <PlusCircle className="h-4 w-4" />
              Construct Factory
            </button>
          </div>
        </SectionCard>
      </div>
    </GameLayout>
  );
}
