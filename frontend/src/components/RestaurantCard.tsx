import { motion, useReducedMotion } from 'framer-motion';
import { MapPin, Star, TrendingUp, Users, UtensilsCrossed } from 'lucide-react';
import { RestaurantDetail } from '@/types/restaurant.types';

interface RestaurantCardProps {
  restaurant: RestaurantDetail;
  selected: boolean;
  onSelect: () => void;
}

export function RestaurantCard({ restaurant, selected, onSelect }: RestaurantCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={shouldReduceMotion ? undefined : { y: -2 }}
      transition={{ duration: 0.16 }}
      className={`w-full rounded-2xl border p-4 text-left transition ${
        selected
          ? 'border-[#E94B35] bg-white shadow-[0_6px_18px_-4px_rgba(233,75,53,0.22)] ring-2 ring-[#E94B35]/20'
          : 'border-[#49352A]/12 bg-white/90 hover:border-[#F28C38] hover:bg-white hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-base font-extrabold tracking-tight text-[#49352A]">
            {restaurant.name}
          </p>
          <span className="mt-0.5 inline-block rounded-md bg-[#F28C38]/12 px-2 py-0.5 text-[11px] font-bold text-[#D9721F]">
            {restaurant.typeLabel}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded-full bg-[#FFC857]/30 px-2.5 py-0.5 text-xs font-extrabold text-[#49352A]">
          <Star className="h-3.5 w-3.5 fill-[#FFC857] text-[#E94B35]" />
          <span>{restaurant.avgRating.toFixed(1)}</span>
        </div>
      </div>

      <div className="mt-3.5 flex flex-wrap items-center gap-3 text-xs font-medium text-[#49352A]/75">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-[#E94B35]/80" />
          {restaurant.locationName}
        </span>
        <span className="inline-flex items-center gap-1">
          <UtensilsCrossed className="h-3.5 w-3.5 text-[#49352A]/60" />
          {restaurant.diningTablesCount} Tables · {restaurant.ovenCount} Ovens
        </span>
        <span className="inline-flex items-center gap-1">
          <Users className="h-3.5 w-3.5 text-[#49352A]/60" />
          {restaurant.employees.length} Staff
        </span>
      </div>

      <div className="mt-3.5 flex items-center justify-between border-t border-[#49352A]/10 pt-2.5 text-xs">
        <span
          className={`inline-flex items-center gap-1 font-extrabold tabular-nums ${
            restaurant.netProfit >= 0 ? 'text-[#2E8B57]' : 'text-[#E94B35]'
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          Net: ${restaurant.netProfit.toFixed(2)}
        </span>
        <span className="font-semibold text-[#49352A]/65 tabular-nums">
          Est. Demand: {restaurant.estimatedDemand} orders
        </span>
      </div>
    </motion.button>
  );
}
