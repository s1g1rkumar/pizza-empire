import { ArrowLeft, Layers } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GameLayout } from '@/components/GameLayout';
import { SectionCard } from '@/components/ui/SectionCard';
import { fetchDashboard } from '@/features/dashboard/dashboardSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';

interface ModulePageProps {
  title: string;
  description: string;
  requiredStage: number;
}

export function ModulePage({ title, description, requiredStage }: ModulePageProps) {
  const dispatch = useAppDispatch();
  const { data } = useAppSelector((state) => state.dashboard);

  useEffect(() => {
    if (!data) {
      void dispatch(fetchDashboard());
    }
  }, [data, dispatch]);

  const currentStage = data?.progression.currentLevelNumber ?? 1;
  const isUnlocked = currentStage >= requiredStage;

  return (
    <GameLayout>
      <SectionCard
        title={title}
        subtitle={`Stage ${requiredStage} Module`}
        action={
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#49352A] px-3.5 py-2 text-xs font-semibold text-[#FFF7E8] hover:bg-[#3a2a21]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </Link>
        }
      >
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#49352A]/20 bg-[#FFF7E8]/60 px-6 py-12 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F28C38]/20 text-[#E94B35]">
            <Layers className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-[#49352A]">{title}</h3>
          <p className="mt-1 max-w-md text-sm text-[#49352A]/75">{description}</p>
          <span
            className={`mt-4 rounded-full px-3 py-1 text-xs font-bold ${
              isUnlocked ? 'bg-[#58A66A]/20 text-[#347544]' : 'bg-[#FFC857]/40 text-[#49352A]'
            }`}
          >
            {isUnlocked
              ? 'Module Unlocked for Your Empire'
              : `Unlocks at Stage ${requiredStage} (Current Stage: ${currentStage})`}
          </span>
        </div>
      </SectionCard>
    </GameLayout>
  );
}
