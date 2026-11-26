import { Award, CheckCircle2, Crown, Gem, Lock, RefreshCw, Target, Unlock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { GameLayout } from '@/components/GameLayout';
import { SectionCard } from '@/components/ui/SectionCard';
import {
  claimAchievementReward,
  claimMissionReward,
  clearProgressionError,
  fetchProgression,
  unlockNextStage,
} from '@/features/progression/progressionSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';

export function MissionsPage() {
  const dispatch = useAppDispatch();
  const { data, loading, acting, error } = useAppSelector((state) => state.progression);
  const [tab, setTab] = useState<'MISSIONS' | 'DAILY' | 'ACHIEVEMENTS'>('MISSIONS');

  useEffect(() => {
    void dispatch(fetchProgression());
  }, [dispatch]);

  if (loading && !data) {
    return (
      <GameLayout>
        <div className="h-64 animate-pulse rounded-2xl border border-[#49352A]/10 bg-white/70" />
      </GameLayout>
    );
  }

  if (!data) return null;

  const xpPct = Math.min(
    100,
    Math.round((data.summary.currentXp / Math.max(1, data.summary.nextLevelXp)) * 100)
  );

  const visibleMissions =
    tab === 'DAILY'
      ? data.missions.filter((m) => m.missionType === 'DAILY')
      : data.missions.filter((m) => m.missionType !== 'DAILY');

  return (
    <GameLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-[#49352A]">
              Empire Progression, Missions & Achievements
            </h1>
            <p className="text-sm text-[#49352A]/70">
              Advance through 8 Business Stages and claim Cash, XP, and Gem rewards
            </p>
          </div>
          <button
            type="button"
            onClick={() => void dispatch(fetchProgression())}
            className="inline-flex items-center gap-2 rounded-xl bg-[#49352A] px-4 py-2 text-xs font-bold text-[#FFF7E8]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Progress
          </button>
        </div>

        {error && (
          <div className="flex items-center justify-between rounded-xl border border-[#E94B35]/40 bg-[#E94B35]/10 px-4 py-3 text-sm text-[#E94B35]">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => dispatch(clearProgressionError())}
              className="text-xs font-bold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* XP & Stage Summary Banner */}
        <div className="rounded-2xl border border-[#49352A]/10 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFC857]/30 text-[#E94B35]">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-[#49352A]">
                  Stage {data.summary.currentLevelNumber}: {data.summary.currentLevelName}
                </p>
                <p className="text-xs text-[#49352A]/70">
                  XP Level {data.summary.xpLevel} · {data.summary.currentXp} /{' '}
                  {data.summary.nextLevelXp} XP
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-[#49352A] px-4 py-2 text-xs font-bold text-[#FFC857]">
              <Gem className="h-4 w-4" />
              <span>{data.summary.gemsBalance} Empire Gems</span>
            </div>
          </div>
          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-[#49352A]/10">
            <div
              className="h-full rounded-full bg-[#F28C38] transition-all"
              style={{ width: `${xpPct}%` }}
            />
          </div>
        </div>

        {/* 8 Business Progression Levels */}
        <SectionCard
          title="8 Business Progression Levels"
          subtitle="Locked businesses and their unlock requirements"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.levels.map((lvl) => (
              <div
                key={lvl.id}
                className={`flex flex-col justify-between rounded-xl border p-4 ${
                  lvl.isCurrent
                    ? 'border-[#E94B35] bg-[#FFC857]/20 shadow-sm'
                    : lvl.isUnlocked
                      ? 'border-[#58A66A]/35 bg-[#58A66A]/10'
                      : 'border-[#49352A]/10 bg-[#FFF7E8]/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#F28C38]">
                      Level {lvl.levelNumber}
                    </span>
                    {lvl.isUnlocked ? (
                      <Unlock className="h-4 w-4 text-[#58A66A]" />
                    ) : (
                      <Lock className="h-4 w-4 text-[#49352A]/45" />
                    )}
                  </div>
                  <p className="mt-1 font-bold text-[#49352A]">{lvl.name}</p>
                  <p className="mt-1 text-[11px] text-[#49352A]/70">{lvl.description}</p>
                </div>

                <div className="mt-3 border-t border-[#49352A]/10 pt-2 text-[11px]">
                  {lvl.isUnlocked ? (
                    <span className="font-bold text-[#347544]">
                      {lvl.isCurrent ? 'Current Stage' : 'Unlocked'} · Max Staff:{' '}
                      {lvl.maxEmployeesCap}
                    </span>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-[#49352A]/75">
                        Req: {lvl.minXp.toLocaleString()} XP · ${lvl.minCash.toLocaleString()}
                      </p>
                      {lvl.isNextTarget && (
                        <button
                          type="button"
                          disabled={acting || !lvl.eligibleToUnlock}
                          onClick={() => void dispatch(unlockNextStage())}
                          className="mt-1 w-full rounded-lg bg-[#E94B35] py-1.5 text-center font-bold text-white disabled:opacity-45"
                        >
                          {lvl.eligibleToUnlock
                            ? 'Unlock Stage!'
                            : (lvl.missingReasons[0] ?? 'Locked')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Tabs for Missions, Daily Missions, Achievements */}
        <div className="flex flex-wrap gap-2">
          {(
            [
              {
                key: 'MISSIONS',
                label: `Missions (${data.missions.filter((m) => m.missionType !== 'DAILY').length})`,
              },
              {
                key: 'DAILY',
                label: `Daily Missions (${data.missions.filter((m) => m.missionType === 'DAILY').length})`,
              },
              { key: 'ACHIEVEMENTS', label: `Achievements (${data.achievements.length})` },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                tab === t.key
                  ? 'bg-[#E94B35] text-white'
                  : 'bg-white text-[#49352A] hover:bg-[#FFC857]/30'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab !== 'ACHIEVEMENTS' ? (
          <SectionCard
            title={tab === 'DAILY' ? 'Daily Missions' : 'Progression Missions'}
            subtitle="Progress updates automatically from real gameplay"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {visibleMissions.map((m) => {
                const pct = Math.min(
                  100,
                  Math.round((m.progressValue / Math.max(1, m.targetValue)) * 100)
                );
                return (
                  <div
                    key={m.id}
                    className="flex flex-col justify-between rounded-xl border border-[#49352A]/10 bg-[#FFF7E8]/60 p-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-[#E94B35]" />
                          <span className="text-sm font-bold text-[#49352A]">{m.title}</span>
                        </div>
                        <span className="text-xs font-bold text-[#58A66A]">
                          +${m.rewardCash} · +{m.rewardXp} XP
                        </span>
                      </div>
                      <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[#49352A]/10">
                        <div
                          className="h-full rounded-full bg-[#F28C38]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-[#49352A]/70">
                        {m.progressValue.toLocaleString()} / {m.targetValue.toLocaleString()}
                      </p>
                    </div>
                    <div className="mt-3">
                      {m.status === 'CLAIMED' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#58A66A]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Claimed
                        </span>
                      ) : m.status === 'COMPLETED' ? (
                        <button
                          type="button"
                          disabled={acting}
                          onClick={() => void dispatch(claimMissionReward(m.id))}
                          className="rounded-lg bg-[#58A66A] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#498f59]"
                        >
                          Claim Reward
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-[#49352A]/50">In Progress</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        ) : (
          <SectionCard title="Achievements (24)" subtitle="Lifetime empire milestones">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.achievements.map((a) => (
                <div
                  key={a.id}
                  className={`flex flex-col justify-between rounded-xl border p-4 ${
                    a.isUnlocked
                      ? 'border-[#58A66A]/40 bg-[#58A66A]/10'
                      : 'border-[#49352A]/10 bg-[#FFF7E8]/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Award
                          className={`h-4 w-4 ${
                            a.isUnlocked ? 'text-[#E94B35]' : 'text-[#49352A]/40'
                          }`}
                        />
                        <span className="text-sm font-bold text-[#49352A]">{a.name}</span>
                      </div>
                      <span className="text-[11px] font-bold text-[#F28C38]">
                        +{a.rewardGems} Gems
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#49352A]/70">{a.description}</p>
                    <p className="mt-2 text-[11px] font-semibold text-[#49352A]/65">
                      Progress: {a.progressValue.toLocaleString()} /{' '}
                      {a.targetValue.toLocaleString()}
                    </p>
                  </div>
                  <div className="mt-3">
                    {a.isClaimed ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#58A66A]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Claimed
                      </span>
                    ) : a.isUnlocked ? (
                      <button
                        type="button"
                        disabled={acting}
                        onClick={() => void dispatch(claimAchievementReward(a.id))}
                        className="rounded-lg bg-[#E94B35] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#d63e29]"
                      >
                        Claim (+${a.rewardCash})
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-[#49352A]/50">Locked</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    </GameLayout>
  );
}
