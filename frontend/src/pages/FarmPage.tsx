import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpCircle,
  Coins,
  Droplets,
  Lock,
  Package,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Sprout,
  Wheat,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { GameLayout } from '@/components/GameLayout';
import { IsometricFarmView } from '@/components/game/IsometricFarmView';
import { SectionCard } from '@/components/ui/SectionCard';
import {
  buyFarmSeeds,
  clearFarmError,
  fetchFarm,
  fertilizeFarmPlot,
  harvestFarmPlot,
  plantFarmCrop,
  sellFarmCrops,
  unlockFarmPlot,
  upgradeFarm,
  waterFarmPlot,
} from '@/features/farm/farmSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';

export function FarmPage() {
  const dispatch = useAppDispatch();
  const { data, loading, acting, error } = useAppSelector((state) => state.farm);
  const [selectedCropId, setSelectedCropId] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [harvestBurstPlotId, setHarvestBurstPlotId] = useState<number | null>(null);

  useEffect(() => {
    void dispatch(fetchFarm());
  }, [dispatch]);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (data && selectedCropId === null && data.crops[0]) {
      setSelectedCropId(data.crops[0].id);
    }
  }, [data, selectedCropId]);

  const handleHarvest = async (plotId: number) => {
    setHarvestBurstPlotId(plotId);
    await dispatch(harvestFarmPlot(plotId));
    setTimeout(() => setHarvestBurstPlotId(null), 650);
  };

  if (loading && !data) {
    return (
      <GameLayout>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-2xl border border-[#49352A]/10 bg-white/70"
            />
          ))}
        </div>
      </GameLayout>
    );
  }

  if (!data) return null;

  const selectedCrop = data.crops.find((c) => c.id === selectedCropId) ?? data.crops[0];

  return (
    <GameLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-[#49352A]">{data.farm.name}</h1>
            <p className="text-sm text-[#49352A]/70">
              Plots: {data.farm.unlockedPlotsCount}/{data.farm.totalPlotsCapacity} · Barn:{' '}
              {data.farm.barnUsed}/{data.farm.barnCapacity} · Irrigation Lv{' '}
              {data.farm.irrigationLevel}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void dispatch(fetchFarm())}
            disabled={loading || acting}
            className="inline-flex items-center gap-2 rounded-xl bg-[#58A66A] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#498f59]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Farm
          </button>
        </div>

        {error && (
          <div className="flex items-center justify-between rounded-xl border border-[#E94B35]/40 bg-[#E94B35]/10 px-4 py-3 text-sm text-[#E94B35]">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => dispatch(clearFarmError())}
              className="text-xs font-bold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Interactive Isometric Farm Yard */}
        <IsometricFarmView
          data={data}
          selectedCrop={selectedCrop}
          nowMs={nowMs}
          acting={acting}
          onUnlockPlot={(plotId) => void dispatch(unlockFarmPlot(plotId))}
          onPlantPlot={(plotId) =>
            selectedCrop && void dispatch(plantFarmCrop({ plotId, cropId: selectedCrop.id }))
          }
          onHarvestPlot={(plotId) => void handleHarvest(plotId)}
        />

        {/* Seed Selection & Seed Market */}
        <SectionCard
          title="Crop Catalog & Seed Shop"
          subtitle="Select a crop to plant on empty plots, or buy seeds in advance"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.crops.map((crop) => {
              const isSelected = selectedCrop?.id === crop.id;
              return (
                <div
                  key={crop.id}
                  onClick={() => crop.isUnlocked && setSelectedCropId(crop.id)}
                  className={`cursor-pointer rounded-xl border p-4 transition ${
                    !crop.isUnlocked
                      ? 'cursor-not-allowed border-[#49352A]/10 bg-slate-100/70 opacity-70'
                      : isSelected
                        ? 'border-[#E94B35] bg-[#FFC857]/20 shadow-sm'
                        : 'border-[#49352A]/10 bg-[#FFF7E8]/60 hover:border-[#F28C38]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wheat className="h-4 w-4 text-[#F28C38]" />
                      <span className="font-bold text-[#49352A]">{crop.name}</span>
                    </div>
                    {crop.isUnlocked ? (
                      <span className="rounded-full bg-[#58A66A]/15 px-2 py-0.5 text-[11px] font-bold text-[#347544]">
                        {crop.seedsOwned} seeds
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#49352A]/10 px-2 py-0.5 text-[11px] font-bold text-[#49352A]">
                        Lv {crop.unlockXpLevel}
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-xs text-[#49352A]/70">
                    Seed: ${crop.seedCost} · Grow: {crop.growthSeconds}s · Yield: {crop.baseYield} ·
                    Sell: ${crop.marketSellPrice}
                  </p>

                  {crop.isUnlocked && (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        disabled={acting}
                        onClick={(e) => {
                          e.stopPropagation();
                          void dispatch(buyFarmSeeds({ cropId: crop.id, quantity: 5 }));
                        }}
                        className="rounded-lg bg-[#49352A] px-2.5 py-1 text-[11px] font-bold text-[#FFF7E8] hover:bg-[#3a2a21]"
                      >
                        Buy 5 (${(crop.seedCost * 5).toFixed(0)})
                      </button>
                      <button
                        type="button"
                        disabled={acting}
                        onClick={(e) => {
                          e.stopPropagation();
                          void dispatch(buyFarmSeeds({ cropId: crop.id, quantity: 10 }));
                        }}
                        className="rounded-lg border border-[#49352A]/20 bg-white px-2.5 py-1 text-[11px] font-bold text-[#49352A] hover:bg-[#FFF7E8]"
                      >
                        Buy 10
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* Interactive 12-Plot Farm Grid */}
        <SectionCard
          title="Farm Plots"
          subtitle={
            selectedCrop
              ? `Selected Crop: ${selectedCrop.name} ($${selectedCrop.seedCost}/seed)`
              : 'Manage your land'
          }
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.plots.map((plot) => {
              const plantedMs = plot.plantedAt ? new Date(plot.plantedAt).getTime() : 0;
              const readyMs = plot.readyAt ? new Date(plot.readyAt).getTime() : 0;
              const totalMs = Math.max(1000, readyMs - plantedMs);
              const elapsedMs = Math.max(0, nowMs - plantedMs);
              const progressPct =
                plot.status === 'READY' || (plot.status === 'GROWING' && nowMs >= readyMs)
                  ? 100
                  : Math.min(99, Math.round((elapsedMs / totalMs) * 100));
              const remainingSec = Math.max(0, Math.ceil((readyMs - nowMs) / 1000));
              const isReadyNow =
                plot.status === 'READY' || (plot.status === 'GROWING' && nowMs >= readyMs);

              return (
                <motion.div
                  key={plot.id}
                  layout
                  animate={harvestBurstPlotId === plot.id ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                  transition={{ duration: 0.35 }}
                  className={`relative rounded-2xl border p-4 ${
                    !plot.isUnlocked
                      ? 'border-dashed border-[#49352A]/20 bg-[#FFF7E8]/40'
                      : isReadyNow
                        ? 'border-[#58A66A] bg-[#58A66A]/10 shadow-md'
                        : 'border-[#49352A]/15 bg-white shadow-sm'
                  }`}
                >
                  <AnimatePresence>
                    {harvestBurstPlotId === plot.id && (
                      <motion.div
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 0, y: -24 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-2 right-3 text-xs font-extrabold text-[#58A66A]"
                      >
                        +Harvested!
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center justify-between text-xs font-bold text-[#49352A]">
                    <span>Plot #{plot.plotIndex}</span>
                    {plot.isUnlocked && (
                      <span className="flex items-center gap-1 text-[#3b82f6]">
                        <Droplets className="h-3.5 w-3.5" />
                        {plot.hydrationPct}%
                      </span>
                    )}
                  </div>

                  {!plot.isUnlocked ? (
                    <div className="mt-6 flex flex-col items-center text-center">
                      <Lock className="h-6 w-6 text-[#49352A]/40" />
                      <p className="mt-2 text-xs text-[#49352A]/70">Locked Acreage</p>
                      <button
                        type="button"
                        disabled={acting}
                        onClick={() => void dispatch(unlockFarmPlot(plot.id))}
                        className="mt-3 rounded-xl bg-[#F28C38] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#df7c2b]"
                      >
                        Unlock (${plot.unlockCost})
                      </button>
                    </div>
                  ) : plot.status === 'EMPTY' ? (
                    <div className="mt-4 space-y-2.5">
                      <p className="text-xs text-[#49352A]/65">
                        Fertilizer: <span className="font-bold">{plot.fertilizerType}</span>
                      </p>
                      <button
                        type="button"
                        disabled={acting || !selectedCrop}
                        onClick={() =>
                          selectedCrop &&
                          void dispatch(plantFarmCrop({ plotId: plot.id, cropId: selectedCrop.id }))
                        }
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#58A66A] py-2 text-xs font-bold text-white hover:bg-[#498f59]"
                      >
                        <Sprout className="h-3.5 w-3.5" />
                        Plant {selectedCrop?.name}
                      </button>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          disabled={acting || plot.hydrationPct >= 100}
                          onClick={() => void dispatch(waterFarmPlot(plot.id))}
                          className="flex-1 rounded-lg border border-[#49352A]/15 py-1 text-[11px] font-bold text-[#49352A] disabled:opacity-40"
                        >
                          Water
                        </button>
                        <button
                          type="button"
                          disabled={acting || plot.fertilizerType === 'COMPOST'}
                          onClick={() =>
                            void dispatch(
                              fertilizeFarmPlot({ plotId: plot.id, fertilizerType: 'COMPOST' })
                            )
                          }
                          className="flex-1 rounded-lg border border-[#49352A]/15 py-1 text-[11px] font-bold text-[#49352A] disabled:opacity-40"
                        >
                          Compost $15
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-extrabold text-[#49352A]">
                          {plot.cropName}
                        </span>
                        <span className="text-[11px] font-bold text-[#49352A]/70">
                          {isReadyNow ? 'Ready!' : `${remainingSec}s`}
                        </span>
                      </div>

                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#49352A]/10">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isReadyNow ? 'bg-[#58A66A]' : 'bg-[#F28C38]'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      {isReadyNow ? (
                        <button
                          type="button"
                          disabled={acting}
                          onClick={() => void handleHarvest(plot.id)}
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#E94B35] py-2 text-xs font-bold text-white shadow hover:bg-[#d63e29]"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Harvest Crop
                        </button>
                      ) : (
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            disabled={acting || plot.hydrationPct >= 100}
                            onClick={() => void dispatch(waterFarmPlot(plot.id))}
                            className="flex-1 rounded-lg border border-[#49352A]/15 py-1 text-[11px] font-bold text-[#49352A] disabled:opacity-40"
                          >
                            Water (+25% Spd)
                          </button>
                          <button
                            type="button"
                            disabled={acting || plot.fertilizerType === 'BIO_NUTRIENT'}
                            onClick={() =>
                              void dispatch(
                                fertilizeFarmPlot({
                                  plotId: plot.id,
                                  fertilizerType: 'BIO_NUTRIENT',
                                })
                              )
                            }
                            className="flex-1 rounded-lg border border-[#49352A]/15 py-1 text-[11px] font-bold text-[#49352A] disabled:opacity-40"
                          >
                            Bio-Mix $40
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </SectionCard>

        {/* Barn Inventory & Farm Upgrades */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard
            title="Barn Inventory & Farmers' Market"
            subtitle={`Storage Used: ${data.farm.barnUsed} / ${data.farm.barnCapacity} units`}
          >
            <div className="space-y-2.5">
              {data.barnInventory.map((item) => (
                <div
                  key={item.itemId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#49352A]/10 bg-[#FFF7E8]/50 p-3"
                >
                  <div className="flex items-center gap-2.5">
                    <Package className="h-4 w-4 text-[#F28C38]" />
                    <div>
                      <p className="text-sm font-bold text-[#49352A]">{item.name}</p>
                      <p className="text-xs text-[#49352A]/65">
                        In Barn: <span className="font-bold">{item.quantity}</span> · $
                        {item.sellPrice}/unit
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={acting || item.quantity < 1}
                      onClick={() =>
                        void dispatch(sellFarmCrops({ itemId: item.itemId, quantity: 1 }))
                      }
                      className="inline-flex items-center gap-1 rounded-lg bg-[#58A66A] px-2.5 py-1 text-xs font-bold text-white disabled:opacity-40"
                    >
                      <Coins className="h-3 w-3" />
                      Sell 1
                    </button>
                    <button
                      type="button"
                      disabled={acting || item.quantity < 1}
                      onClick={() =>
                        void dispatch(
                          sellFarmCrops({ itemId: item.itemId, quantity: item.quantity })
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-lg bg-[#49352A] px-2.5 py-1 text-xs font-bold text-[#FFF7E8] disabled:opacity-40"
                    >
                      <ShoppingBag className="h-3 w-3" />
                      Sell All
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Farm Upgrades" subtitle="Improve irrigation speed and Barn capacity">
            <div className="space-y-3">
              {data.upgrades.map((upg) => (
                <div
                  key={upg.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#49352A]/10 bg-[#FFF7E8]/50 p-4"
                >
                  <div>
                    <p className="text-sm font-bold text-[#49352A]">
                      {upg.name} (Lv {upg.currentLevel}/{upg.maxLevel})
                    </p>
                    <p className="mt-0.5 text-xs text-[#49352A]/70">{upg.description}</p>
                  </div>
                  <button
                    type="button"
                    disabled={acting || upg.currentLevel >= upg.maxLevel}
                    onClick={() => void dispatch(upgradeFarm(upg.code))}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#F28C38] px-3 py-2 text-xs font-bold text-white hover:bg-[#df7c2b] disabled:opacity-40"
                  >
                    <ArrowUpCircle className="h-4 w-4" />
                    {upg.currentLevel >= upg.maxLevel ? 'Maxed' : `$${upg.nextCost}`}
                  </button>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </GameLayout>
  );
}
