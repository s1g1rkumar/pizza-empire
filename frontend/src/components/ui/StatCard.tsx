import { motion, useReducedMotion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  accentColor: 'red' | 'orange' | 'yellow' | 'green';
}

const ACCENT_MAP: Record<StatCardProps['accentColor'], { badge: string; bar: string }> = {
  red: { badge: 'bg-[#E94B35]/12 text-[#E94B35]', bar: 'bg-[#E94B35]' },
  orange: { badge: 'bg-[#F28C38]/14 text-[#D9721F]', bar: 'bg-[#F28C38]' },
  yellow: { badge: 'bg-[#FFC857]/28 text-[#7A5410]', bar: 'bg-[#FFC857]' },
  green: { badge: 'bg-[#58A66A]/15 text-[#2E8B57]', bar: 'bg-[#58A66A]' },
};

export function StatCard({ label, value, subtitle, icon: Icon, accentColor }: StatCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const accent = ACCENT_MAP[accentColor];

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={shouldReduceMotion ? undefined : { y: -2 }}
      transition={{ duration: 0.22 }}
      className="relative overflow-hidden rounded-2xl border border-[#49352A]/12 bg-white p-5 shadow-[0_2px_10px_-3px_rgba(73,53,42,0.07)] transition-shadow hover:shadow-[0_8px_20px_-6px_rgba(73,53,42,0.14)]"
    >
      <div className={`absolute inset-x-0 top-0 h-1 ${accent.bar}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-wider text-[#49352A]/60 uppercase">
            {label}
          </p>
          <p className="mt-1.5 truncate text-2xl font-extrabold tracking-tight text-[#49352A] tabular-nums">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 truncate text-xs font-medium text-[#49352A]/65">{subtitle}</p>
          )}
        </div>
        <div className={`shrink-0 rounded-xl p-2.5 ${accent.badge}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}
