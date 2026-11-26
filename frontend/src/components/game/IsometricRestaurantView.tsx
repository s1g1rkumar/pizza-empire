import {
  ChefHat,
  Clock,
  Coins,
  FastForward,
  Flame,
  Pause,
  Play,
  Star,
  UserPlus,
  UtensilsCrossed,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RestaurantDetail } from '@/types/restaurant.types';

interface IsometricRestaurantViewProps {
  restaurant: RestaurantDetail;
  cashBalance: number;
  acting: boolean;
  onServeCustomers: () => void;
}

export function IsometricRestaurantView({
  restaurant,
  cashBalance,
  acting,
  onServeCustomers,
}: IsometricRestaurantViewProps) {
  const [speed, setSpeed] = useState<0 | 1 | 2 | 3>(1);
  const [simMinutes, setSimMinutes] = useState(520); // 08:40 AM start
  const [day, setDay] = useState(1);

  useEffect(() => {
    if (speed === 0) return;
    const intervalMs = speed === 1 ? 1500 : speed === 2 ? 750 : 400;
    const timer = window.setInterval(() => {
      setSimMinutes((prev) => {
        const next = prev + 5;
        if (next >= 1440) {
          setDay((d) => d + 1);
          return 0;
        }
        return next;
      });
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [speed]);

  const hours = Math.floor(simMinutes / 60);
  const mins = simMinutes % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  const timeLabel = `${ampm} ${String(displayHour).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

  const visibleTables = Math.min(8, Math.max(2, restaurant.diningTablesCount));
  const visibleOvens = Math.min(4, Math.max(1, restaurant.ovenCount));

  return (
    <div className="overflow-hidden rounded-3xl border-2 border-[#49352A]/25 bg-[#1E2026] text-white shadow-xl">
      {/* Top Tycoon HUD Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#14161A] px-4 py-2.5 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-lg bg-[#2E8B57]/20 px-2.5 py-1 font-extrabold text-[#7CE3A6]">
            <Coins className="h-3.5 w-3.5" />
            <span className="tabular-nums">${cashBalance.toLocaleString()}</span>
          </div>
          <span className="hidden font-bold text-white/80 sm:inline">
            {restaurant.name} · {restaurant.locationName}
          </span>
        </div>

        {/* Speed Controls (Pause, 1x, 2x, 3x) */}
        <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setSpeed(0)}
            aria-label="Pause simulation"
            className={`rounded px-2 py-1 ${speed === 0 ? 'bg-[#E94B35] text-white' : 'text-white/60 hover:text-white'}`}
          >
            <Pause className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setSpeed(1)}
            aria-label="Normal speed 1x"
            className={`inline-flex items-center gap-0.5 rounded px-2 py-1 font-bold ${speed === 1 ? 'bg-[#FFC857] text-[#14161A]' : 'text-white/60 hover:text-white'}`}
          >
            <Play className="h-3 w-3" /> 1x
          </button>
          <button
            type="button"
            onClick={() => setSpeed(2)}
            aria-label="Fast speed 2x"
            className={`inline-flex items-center gap-0.5 rounded px-2 py-1 font-bold ${speed === 2 ? 'bg-[#FFC857] text-[#14161A]' : 'text-white/60 hover:text-white'}`}
          >
            <FastForward className="h-3 w-3" /> 2x
          </button>
          <button
            type="button"
            onClick={() => setSpeed(3)}
            aria-label="Ultra speed 3x"
            className={`rounded px-2 py-1 font-bold ${speed === 3 ? 'bg-[#FFC857] text-[#14161A]' : 'text-white/60 hover:text-white'}`}
          >
            3x
          </button>
        </div>

        <div className="flex items-center gap-2 font-bold text-white/80">
          <Clock className="h-3.5 w-3.5 text-[#FFC857]" />
          <span>
            {timeLabel} · DAY {day}
          </span>
        </div>
      </div>

      {/* Main Cutaway Floor + Right Staff Drawer */}
      <div className="grid lg:grid-cols-12">
        {/* Street + Pizzeria Floor Cutaway */}
        <div className="relative p-4 sm:p-6 lg:col-span-8">
          {/* Left Event Feed Badges */}
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-lg bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white/80">
              Rating: {restaurant.avgRating.toFixed(1)} ★
            </span>
            <span className="rounded-lg bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-[#FFC857]">
              Demand: {restaurant.estimatedDemand} orders
            </span>
            <span className="rounded-lg bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-[#7CE3A6]">
              Net Profit: ${restaurant.netProfit.toFixed(2)}
            </span>
          </div>

          {/* Building Cutaway */}
          <div className="relative mx-auto max-w-2xl rounded-2xl border-4 border-[#6D4C3D] bg-[#D99B66] p-3 shadow-2xl">
            {/* Back Kitchen Room */}
            <div className="mb-3 rounded-xl border-2 border-[#49352A] bg-[#D8E2E8] p-3 text-[#49352A]">
              <div className="mb-2 flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-[#49352A]/70">
                <span className="flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-[#E94B35]" />
                  Pizza Kitchen ({restaurant.ovenCount} Ovens)
                </span>
                <span>Decor Lv {restaurant.decorLevel}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                {Array.from({ length: visibleOvens }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-lg border border-[#49352A]/25 bg-white px-2.5 py-1.5 shadow-sm"
                  >
                    <div
                      className={`h-4 w-4 rounded-full bg-[#E94B35] ${speed > 0 ? 'animate-pulse' : ''}`}
                    />
                    <span className="text-[11px] font-bold">Oven #{idx + 1}</span>
                  </div>
                ))}
                {restaurant.employees
                  .filter((e) => e.role.includes('CHEF'))
                  .slice(0, 3)
                  .map((chef) => (
                    <div
                      key={chef.id}
                      className="flex items-center gap-1 rounded-full bg-[#49352A] px-2.5 py-1 text-[10px] font-bold text-[#FFF7E8]"
                    >
                      <ChefHat className="h-3 w-3 text-[#FFC857]" />
                      {chef.fullName.split(' ')[0]}
                    </div>
                  ))}
              </div>
            </div>

            {/* Hardwood Dining Floor with Checkered Tables */}
            <div className="rounded-xl border-2 border-[#49352A] bg-gradient-to-br from-[#C8844E] to-[#B06F3C] p-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: visibleTables }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center justify-center rounded-xl border border-[#49352A]/30 bg-[#8C5229]/40 p-2.5"
                  >
                    {/* Checkered Tablecloth */}
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#49352A] shadow-md"
                      style={{
                        backgroundImage: 'repeating-conic-gradient(#FFF7E8 0% 25%, #E94B35 0% 50%)',
                        backgroundSize: '12px 12px',
                      }}
                    >
                      <UtensilsCrossed className="h-4 w-4 text-[#49352A] drop-shadow" />
                    </div>
                    <span className="mt-1.5 text-[10px] font-bold text-[#FFF7E8]">
                      Table #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>

              {/* Front Counter & Awning Entrance */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#49352A]/30 pt-3">
                <div className="flex items-center gap-2">
                  <div
                    className="h-5 w-14 rounded-b-lg border-2 border-[#49352A]"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(90deg, #E94B35 0 8px, #FFFFFF 8px 16px)',
                    }}
                  />
                  <span className="text-[11px] font-extrabold text-[#FFF7E8]">
                    Main Entrance & Counter
                  </span>
                </div>
                <button
                  type="button"
                  disabled={acting}
                  onClick={onServeCustomers}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#E94B35] px-4 py-2 text-xs font-extrabold text-white shadow-md transition hover:bg-[#d63e29] disabled:opacity-50"
                >
                  <Flame className="h-3.5 w-3.5" />
                  {acting ? 'Serving...' : 'Bake & Serve Customers'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Staff Drawer (Pizza Empire Style) */}
        <div className="border-t border-white/10 bg-[#14161A] p-4 lg:col-span-4 lg:border-t-0 lg:border-l">
          <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="text-xs font-extrabold tracking-wider text-[#62B6FF] uppercase">
              Staff ({restaurant.employees.length})
            </h3>
            <Link
              to="/game/employees"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FFC857] hover:underline"
            >
              <UserPlus className="h-3 w-3" />
              Hire / Assign
            </Link>
          </div>

          {restaurant.employees.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/15 p-4 text-center text-xs text-white/60">
              No staff assigned yet. Assign chefs and cashiers from the Employees page to speed up
              service!
            </div>
          ) : (
            <div className="max-h-72 space-y-2.5 overflow-y-auto pr-1">
              {restaurant.employees.map((emp) => (
                <div
                  key={emp.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{emp.fullName}</span>
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-[#FFC857]">
                      {Array.from({ length: Math.min(5, Math.max(1, emp.skillLevel)) }).map(
                        (_, i) => (
                          <Star key={i} className="h-2.5 w-2.5 fill-[#FFC857]" />
                        )
                      )}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/60">
                    {emp.role.replace(/_/g, ' ')} · {emp.productivity.toFixed(2)}x output
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[10px] text-[#E94B35]">♥</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-[#58A66A]"
                        style={{ width: `${Math.min(100, emp.happiness)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
