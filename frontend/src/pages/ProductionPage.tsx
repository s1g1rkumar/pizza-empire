import {
  CheckCircle2,
  ChefHat,
  Clock,
  Flame,
  Gauge,
  PackageCheck,
  Pizza,
  RefreshCw,
  Users,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { GameLayout } from '@/components/GameLayout';
import { SectionCard } from '@/components/ui/SectionCard';
import { StatCard } from '@/components/ui/StatCard';
import {
  cancelProductionOrder,
  clearProductionError,
  fetchProduction,
  startProductionOrder,
} from '@/features/production/productionSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';

export function ProductionPage() {
  const dispatch = useAppDispatch();
  const { data, loading, acting, error } = useAppSelector((state) => state.production);
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    void dispatch(fetchProduction());
  }, [dispatch]);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (data && selectedRecipeId === null && data.recipes[0]) {
      setSelectedRecipeId(data.recipes[0].id);
    }
  }, [data, selectedRecipeId]);

  if (loading && !data) {
    return (
      <GameLayout>
        <div className="h-64 animate-pulse rounded-2xl border border-[#49352A]/10 bg-white/70" />
      </GameLayout>
    );
  }

  if (!data) return null;

  const selectedRecipe = data.recipes.find((r) => r.id === selectedRecipeId) ?? data.recipes[0];
  const canAffordIngredients = selectedRecipe
    ? selectedRecipe.ingredients.every(
        (ing) => ing.availableStock >= ing.quantityRequired * quantity
      )
    : false;

  return (
    <GameLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-[#49352A]">Pizza Production & Kitchen</h1>
            <p className="text-sm text-[#49352A]/70">
              Facility: <span className="font-bold">{data.business.name}</span> · Reserve
              ingredients, bake pizzas, and manage production queues
            </p>
          </div>
          <button
            type="button"
            onClick={() => void dispatch(fetchProduction())}
            disabled={loading || acting}
            className="inline-flex items-center gap-2 rounded-xl bg-[#E94B35] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#d63e29]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Production
          </button>
        </div>

        {error && (
          <div className="flex items-center justify-between rounded-xl border border-[#E94B35]/40 bg-[#E94B35]/10 px-4 py-3 text-sm text-[#E94B35]">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => dispatch(clearProductionError())}
              className="text-xs font-bold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Production Capacity"
            value={`${data.business.activeOrdersCount} / ${data.business.productionCapacity}`}
            subtitle="Active queue slots"
            icon={Flame}
            accentColor="red"
          />
          <StatCard
            label="Production Efficiency"
            value={`${data.business.efficiencyMultiplier}x`}
            subtitle="Speed multiplier from staff"
            icon={Gauge}
            accentColor="orange"
          />
          <StatCard
            label="Assigned Staff"
            value={`${data.employees.length}`}
            subtitle="Bakers & factory workers"
            icon={Users}
            accentColor="green"
          />
          <StatCard
            label="Completed Batches"
            value={`${data.completedOrders.filter((o) => o.status === 'COMPLETED').length}`}
            subtitle="Recent finished orders"
            icon={PackageCheck}
            accentColor="yellow"
          />
        </div>

        {/* Start Production & Available Ingredients */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SectionCard
              title="Pizza Recipes & Order Builder"
              subtitle="Select a recipe and quantity; materials are reserved automatically"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {data.recipes.map((recipe) => {
                  const isSelected = selectedRecipe?.id === recipe.id;
                  return (
                    <div
                      key={recipe.id}
                      onClick={() => recipe.isUnlocked && setSelectedRecipeId(recipe.id)}
                      className={`cursor-pointer rounded-xl border p-4 transition ${
                        !recipe.isUnlocked
                          ? 'cursor-not-allowed border-[#49352A]/10 bg-slate-100/70 opacity-65'
                          : isSelected
                            ? 'border-[#E94B35] bg-[#FFC857]/20 shadow-sm'
                            : 'border-[#49352A]/10 bg-[#FFF7E8]/60 hover:border-[#F28C38]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Pizza className="h-4 w-4 text-[#E94B35]" />
                          <span className="font-bold text-[#49352A]">{recipe.name}</span>
                        </div>
                        <span className="text-xs font-bold text-[#49352A]/70">
                          {recipe.isUnlocked
                            ? `${recipe.durationSeconds}s`
                            : `Lv ${recipe.unlockXpLevel}`}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-[#49352A]/70">
                        Produces {recipe.outputQuantity}x {recipe.outputItemName}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {recipe.ingredients.map((ing) => (
                          <span
                            key={ing.itemId}
                            className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                              ing.availableStock >= ing.quantityRequired * quantity
                                ? 'bg-[#58A66A]/15 text-[#347544]'
                                : 'bg-[#E94B35]/15 text-[#E94B35]'
                            }`}
                          >
                            {ing.quantityRequired * quantity}x {ing.name} ({ing.availableStock})
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedRecipe && (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#49352A]/10 bg-[#FFF7E8] p-4">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-[#49352A]">Batch Quantity:</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(Math.max(1, Math.min(100, Number(e.target.value))))
                      }
                      className="w-20 rounded-lg border border-[#49352A]/20 bg-white px-2.5 py-1.5 text-sm font-bold text-[#49352A]"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={
                      acting ||
                      !selectedRecipe.isUnlocked ||
                      !canAffordIngredients ||
                      data.business.activeOrdersCount >= data.business.productionCapacity
                    }
                    onClick={() =>
                      void dispatch(startProductionOrder({ recipeId: selectedRecipe.id, quantity }))
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-[#E94B35] px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-[#d63e29] disabled:opacity-45"
                  >
                    <ChefHat className="h-4 w-4" />
                    {canAffordIngredients ? 'Start Production' : 'Insufficient Ingredients'}
                  </button>
                </div>
              )}
            </SectionCard>
          </div>

          <SectionCard title="Available Ingredients" subtitle="Available vs. reserved materials">
            <div className="space-y-2">
              {data.availableIngredients.map((ing) => (
                <div
                  key={ing.itemId}
                  className="flex items-center justify-between rounded-xl border border-[#49352A]/10 bg-[#FFF7E8]/50 px-3 py-2 text-xs"
                >
                  <span className="font-bold text-[#49352A]">{ing.name}</span>
                  <span className="font-semibold text-[#49352A]/75">
                    {ing.availableQuantity} avail ({ing.reservedQuantity} res)
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Active Production Queue, Completed Orders & Employee Assignments */}
        <div className="grid gap-6 lg:grid-cols-3">
          <SectionCard
            title="Active Production Queue"
            subtitle="Cancel anytime to recover reserved materials"
          >
            {data.activeOrders.length === 0 ? (
              <p className="py-6 text-center text-xs text-[#49352A]/60">
                No active production orders.
              </p>
            ) : (
              <div className="space-y-3">
                {data.activeOrders.map((order) => {
                  const startMs = new Date(order.startedAt).getTime();
                  const endMs = new Date(order.completesAt).getTime();
                  const totalMs = Math.max(1000, endMs - startMs);
                  const pct = Math.min(100, Math.round(((nowMs - startMs) / totalMs) * 100));
                  const remSec = Math.max(0, Math.ceil((endMs - nowMs) / 1000));

                  return (
                    <div
                      key={order.id}
                      className="rounded-xl border border-[#49352A]/10 bg-[#FFF7E8]/60 p-3"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-[#49352A]">
                        <span>
                          {order.quantity}x {order.recipeName}
                        </span>
                        <span className="flex items-center gap-1 text-[#F28C38]">
                          <Clock className="h-3.5 w-3.5" />
                          {remSec === 0 ? 'Completing...' : `${remSec}s`}
                        </span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#49352A]/10">
                        <div
                          className="h-full rounded-full bg-[#58A66A] transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <button
                        type="button"
                        disabled={acting}
                        onClick={() => void dispatch(cancelProductionOrder(order.id))}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#E94B35] hover:underline"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Cancel & Recover Stock
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Completed & Cancelled" subtitle="Recent kitchen batch outcomes">
            {data.completedOrders.length === 0 ? (
              <p className="py-6 text-center text-xs text-[#49352A]/60">No completed orders yet.</p>
            ) : (
              <div className="max-h-60 divide-y divide-[#49352A]/10 overflow-y-auto">
                {data.completedOrders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between py-2 text-xs">
                    <div>
                      <p className="font-bold text-[#49352A]">{o.recipeName}</p>
                      <p className="text-[#49352A]/60">Batch: {o.quantity}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 font-bold ${
                        o.status === 'COMPLETED' ? 'text-[#58A66A]' : 'text-[#E94B35]'
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {o.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Assigned Staff" subtitle="Employees boosting production speed">
            {data.employees.length === 0 ? (
              <p className="py-6 text-center text-xs text-[#49352A]/60">
                Owner operating manually (1.0x efficiency). Assign staff in Employees.
              </p>
            ) : (
              <div className="space-y-2">
                {data.employees.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between rounded-xl border border-[#49352A]/10 bg-[#FFF7E8]/50 px-3 py-2 text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#49352A]">{e.fullName}</p>
                      <p className="text-[#49352A]/60">
                        {e.role} · Skill Lv {e.skillLevel}
                      </p>
                    </div>
                    <span className="font-bold text-[#58A66A]">{e.productivity}x</span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </GameLayout>
  );
}
