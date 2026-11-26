import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#49352A]/20 bg-[#FFF7E8]/50 px-6 py-10 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFC857]/25 text-[#49352A]">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-extrabold text-[#49352A]">{title}</h3>
      <p className="mt-1 max-w-md text-xs leading-relaxed text-[#49352A]/70">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
