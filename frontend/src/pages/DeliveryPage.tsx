import {
  ArrowUpCircle,
  Bike,
  CheckCircle2,
  Clock,
  Coins,
  MapPin,
  PlusCircle,
  RefreshCw,
  Send,
  Star,
  Truck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { GameLayout } from '@/components/GameLayout';
import { SectionCard } from '@/components/ui/SectionCard';
import { StatCard } from '@/components/ui/StatCard';
import {
  buyDeliveryVehicle,
  clearDeliveryError,
  dispatchDeliveryOrder,
  fetchDelivery,
  upgradeDeliveryVehicle,
} from '@/features/delivery/deliverySlice';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { VehicleType } from '@/types/delivery.types';

export function DeliveryPage() {
  const dispatch = useAppDispatch();
  const { data, loading, acting, error } = useAppSelector((state) => state.delivery);

  const [newVehicleType, setNewVehicleType] = useState<VehicleType>('BICYCLE');
  const [newVehicleName, setNewVehicleName] = useState('Express Unit #1');
  const [restId, setRestId] = useState<number>(0);
  const [pizzaItemId, setPizzaItemId] = useState<number>(0);
  const [zoneId, setZoneId] = useState<number>(0);
  const [vehicleId, setVehicleId] = useState<number>(0);
  const [driverId, setDriverId] = useState<number>(0);
  const [qty, setQty] = useState<number>(1);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    void dispatch(fetchDelivery());
  }, [dispatch]);

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!data) return;
    if (restId === 0 && data.restaurants[0]) {
      setRestId(data.restaurants[0].id);
      if (data.restaurants[0].pizzas[0]) {
        setPizzaItemId(data.restaurants[0].pizzas[0].itemId);
      }
    }
    if (zoneId === 0 && data.zones[0]) setZoneId(data.zones[0].id);
    const idleVeh = data.vehicles.find((v) => v.status === 'IDLE');
    if (vehicleId === 0 && idleVeh) setVehicleId(idleVeh.id);
    if (driverId === 0 && data.drivers[0]) setDriverId(data.drivers[0].id);
  }, [data, restId, zoneId, vehicleId, driverId]);

  if (loading && !data) {
    return (
      <GameLayout>
        <div className="h-64 animate-pulse rounded-2xl border border-[#49352A]/10 bg-white/70" />
      </GameLayout>
    );
  }

  if (!data) return null;

  const selectedRest = data.restaurants.find((r) => r.id === restId) ?? data.restaurants[0];

  return (
    <GameLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-[#49352A]">Pizza Delivery Fleet</h1>
            <p className="text-sm text-[#49352A]/70">
              Manage vehicles, drivers, delivery zones, active dispatches, and customer satisfaction
            </p>
          </div>
          <button
            type="button"
            onClick={() => void dispatch(fetchDelivery())}
            className="inline-flex items-center gap-2 rounded-xl bg-[#49352A] px-4 py-2 text-xs font-bold text-[#FFF7E8]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Fleet
          </button>
        </div>

        {error && (
          <div className="flex items-center justify-between rounded-xl border border-[#E94B35]/40 bg-[#E94B35]/10 px-4 py-3 text-sm text-[#E94B35]">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => dispatch(clearDeliveryError())}
              className="text-xs font-bold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Performance KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Completed Deliveries"
            value={`${data.performance.totalDeliveries}`}
            subtitle={`${data.activeDeliveries.length} currently on route`}
            icon={Truck}
            accentColor="orange"
          />
          <StatCard
            label="On-Time Efficiency"
            value={`${data.performance.onTimeRatePct}%`}
            subtitle="Target >= 90%"
            icon={CheckCircle2}
            accentColor="green"
          />
          <StatCard
            label="Customer Rating"
            value={`${data.performance.avgSatisfaction.toFixed(2)}★`}
            subtitle="Delivery satisfaction"
            icon={Star}
            accentColor="yellow"
          />
          <StatCard
            label="Fees & Tips Earned"
            value={`$${(data.performance.totalDeliveryRevenue + data.performance.totalTipsEarned).toFixed(2)}`}
            subtitle={`Tips: $${data.performance.totalTipsEarned.toFixed(2)}`}
            icon={Coins}
            accentColor="red"
          />
        </div>

        {/* Dispatch Order + Active Deliveries */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard
            title="Dispatch Pizza Delivery"
            subtitle="Order -> Packaging -> Vehicle & Driver Assignment"
          >
            {data.restaurants.length === 0 || data.vehicles.length === 0 ? (
              <p className="py-6 text-center text-xs text-[#49352A]/65">
                You need at least 1 Restaurant with pizza stock and 1 Delivery Vehicle to dispatch
                orders.
              </p>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-bold text-[#49352A]">Restaurant</label>
                    <select
                      value={restId}
                      onChange={(e) => setRestId(Number(e.target.value))}
                      className="w-full rounded-xl border border-[#49352A]/20 bg-[#FFF7E8] px-3 py-2 font-semibold"
                    >
                      {data.restaurants.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block font-bold text-[#49352A]">Pizza</label>
                    <select
                      value={pizzaItemId}
                      onChange={(e) => setPizzaItemId(Number(e.target.value))}
                      className="w-full rounded-xl border border-[#49352A]/20 bg-[#FFF7E8] px-3 py-2 font-semibold"
                    >
                      {(selectedRest?.pizzas ?? []).map((p) => (
                        <option key={p.itemId} value={p.itemId}>
                          {p.name} (Stock: {p.availableStock})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-bold text-[#49352A]">Delivery Zone</label>
                    <select
                      value={zoneId}
                      onChange={(e) => setZoneId(Number(e.target.value))}
                      className="w-full rounded-xl border border-[#49352A]/20 bg-[#FFF7E8] px-3 py-2 font-semibold"
                    >
                      {data.zones.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name} ({z.distanceKm}km · +${z.baseDeliveryCharge})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block font-bold text-[#49352A]">Vehicle</label>
                    <select
                      value={vehicleId}
                      onChange={(e) => setVehicleId(Number(e.target.value))}
                      className="w-full rounded-xl border border-[#49352A]/20 bg-[#FFF7E8] px-3 py-2 font-semibold"
                    >
                      {data.vehicles.map((v) => (
                        <option key={v.id} value={v.id} disabled={v.status !== 'IDLE'}>
                          {v.name} ({v.typeLabel}, Cap {v.capacity}) [{v.status}]
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-bold text-[#49352A]">Driver (Optional)</label>
                    <select
                      value={driverId}
                      onChange={(e) => setDriverId(Number(e.target.value))}
                      className="w-full rounded-xl border border-[#49352A]/20 bg-[#FFF7E8] px-3 py-2 font-semibold"
                    >
                      <option value={0}>Automated / Self-Dispatch</option>
                      {data.drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.fullName} ({d.productivity}x)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block font-bold text-[#49352A]">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={qty}
                      onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                      className="w-full rounded-xl border border-[#49352A]/20 bg-white px-3 py-2 font-bold"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={acting || !vehicleId || !pizzaItemId}
                  onClick={() =>
                    void dispatch(
                      dispatchDeliveryOrder({
                        restaurantId: restId,
                        itemId: pizzaItemId,
                        quantity: qty,
                        zoneId,
                        vehicleId,
                        driverEmployeeId: driverId > 0 ? driverId : undefined,
                      })
                    )
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#E94B35] py-2.5 text-xs font-bold text-white hover:bg-[#d63e29] disabled:opacity-45"
                >
                  <Send className="h-4 w-4" />
                  Dispatch Delivery
                </button>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Active Deliveries" subtitle="Live transit countdowns">
            {data.activeDeliveries.length === 0 ? (
              <p className="py-10 text-center text-xs text-[#49352A]/60">
                No vehicles currently on route.
              </p>
            ) : (
              <div className="space-y-2.5">
                {data.activeDeliveries.map((d) => {
                  const etaMs = new Date(d.etaAt).getTime();
                  const remSec = Math.max(0, Math.ceil((etaMs - nowMs) / 1000));
                  return (
                    <div
                      key={d.id}
                      className="flex items-center justify-between rounded-xl border border-[#49352A]/10 bg-[#FFF7E8]/60 p-3 text-xs"
                    >
                      <div>
                        <p className="font-bold text-[#49352A]">
                          {d.quantity}x {d.pizzaName} → {d.zoneName}
                        </p>
                        <p className="text-[#49352A]/65">
                          {d.vehicleName} {d.driverName ? `· ${d.driverName}` : ''} · Fee $
                          {d.deliveryFee}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 font-bold text-[#F28C38]">
                        <Clock className="h-3.5 w-3.5" />
                        {remSec === 0 ? 'Arrived!' : `${remSec}s`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Fleet Management & Purchase Vehicle */}
        <SectionCard
          title="Vehicle Fleet & Purchasing"
          subtitle={`Cash Available: $${data.cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
        >
          {data.vehicles.length > 0 && (
            <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.vehicles.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between rounded-xl border border-[#49352A]/10 bg-[#FFF7E8]/60 p-4 text-xs"
                >
                  <div>
                    <p className="font-bold text-[#49352A]">
                      {v.name} (Lv {v.upgradeLevel})
                    </p>
                    <p className="text-[#49352A]/70">
                      {v.typeLabel} · Cap {v.capacity} · {v.speedMultiplier}x ·{' '}
                      <span className="font-bold text-[#58A66A]">{v.status}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => void dispatch(upgradeDeliveryVehicle(v.id))}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#F28C38] px-2.5 py-1.5 font-bold text-white"
                  >
                    <ArrowUpCircle className="h-3.5 w-3.5" />${v.nextUpgradeCost}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {data.blueprints.map((bp) => (
              <div
                key={bp.type}
                onClick={() => setNewVehicleType(bp.type)}
                className={`cursor-pointer rounded-xl border p-3.5 transition ${
                  newVehicleType === bp.type
                    ? 'border-[#E94B35] bg-[#FFC857]/20'
                    : 'border-[#49352A]/10 bg-[#FFF7E8]/40'
                }`}
              >
                <div className="flex items-center gap-1.5 text-sm font-bold text-[#49352A]">
                  <Bike className="h-4 w-4 text-[#E94B35]" />
                  <span>{bp.label}</span>
                </div>
                <p className="mt-1 text-xs font-extrabold text-[#58A66A]">${bp.purchaseCost}</p>
                <p className="mt-1 text-[11px] text-[#49352A]/70">
                  Cap {bp.capacity} · {bp.speedMultiplier}x Speed
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <label className="mb-1 block text-xs font-bold text-[#49352A]">Vehicle Name</label>
              <input
                type="text"
                value={newVehicleName}
                onChange={(e) => setNewVehicleName(e.target.value)}
                className="w-full rounded-xl border border-[#49352A]/20 bg-[#FFF7E8]/50 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              disabled={acting || newVehicleName.trim().length < 2}
              onClick={() =>
                void dispatch(
                  buyDeliveryVehicle({ vehicleType: newVehicleType, name: newVehicleName })
                )
              }
              className="inline-flex items-center gap-2 rounded-xl bg-[#58A66A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#498f59]"
            >
              <PlusCircle className="h-4 w-4" />
              Buy Vehicle
            </button>
          </div>
        </SectionCard>

        {/* Delivery Zones */}
        <SectionCard title="Delivery Zones" subtitle="Coverage areas and delivery charges">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {data.zones.map((z) => (
              <div
                key={z.id}
                className="rounded-xl border border-[#49352A]/10 bg-[#FFF7E8]/50 p-3 text-xs"
              >
                <div className="flex items-center gap-1.5 font-bold text-[#49352A]">
                  <MapPin className="h-3.5 w-3.5 text-[#E94B35]" />
                  <span>{z.name}</span>
                </div>
                <p className="mt-1 text-[#49352A]/70">
                  {z.distanceKm} km · Charge: ${z.baseDeliveryCharge}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </GameLayout>
  );
}
