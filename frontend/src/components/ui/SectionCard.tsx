import { motion, useReducedMotion } from 'framer-motion';
import { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function SectionCard({ title, subtitle, action, children }: SectionCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="rounded-2xl border border-[#49352A]/12 bg-white/95 p-5 shadow-[0_2px_10px_-3px_rgba(73,53,42,0.07)] backdrop-blur-sm transition-shadow hover:shadow-[0_6px_20px_-6px_rgba(73,53,42,0.12)] sm:p-6"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#49352A]/8 pb-3.5">
        <div className="min-w-0">
          <h2 className="text-base font-extrabold tracking-tight text-[#49352A] sm:text-lg">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-xs leading-relaxed text-[#49352A]/65">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </motion.section>
  );
}
