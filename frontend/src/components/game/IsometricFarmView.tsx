import { Coins, Leaf, Sprout } from 'lucide-react';
import { CropInfo, FarmDashboardData, FarmPlot } from '@/types/farm.types';

interface IsometricFarmViewProps {
  data: FarmDashboardData;
  selectedCrop: CropInfo | undefined;
  nowMs: number;
  acting: boolean;
  onUnlockPlot: (plotId: number) => void;
  onPlantPlot: (plotId: number) => void;
  onHarvestPlot: (plotId: number) => void;
}

function getPlotProgress(plot: FarmPlot, nowMs: number): { percent: number; ready: boolean } {
  if (!plot.isUnlocked || plot.status === 'EMPTY') return { percent: 0, ready: false };
  if (plot.status === 'READY') return { percent: 100, ready: true };
  if (!plot.plantedAt || !plot.readyAt) return { percent: 0, ready: false };

  const start = new Date(plot.plantedAt).getTime();
  const end = new Date(plot.readyAt).getTime();
  if (nowMs >= end) return { percent: 100, ready: true };
  const pct = Math.max(
    4,
    Math.min(99, Math.round(((nowMs - start) / Math.max(1, end - start)) * 100))
  );
  return { percent: pct, ready: false };
}

function CropIllustration({ code, ready }: { code: string | null; ready: boolean }) {
  const c = (code ?? '').toUpperCase();
  if (c.includes('TOMATO')) {
    return (
      <svg viewBox="0 0 64 64" className={`h-11 w-11 drop-shadow ${ready ? 'animate-bounce' : ''}`}>
        <path d="M32 54 V24" stroke="#2E8B57" strokeWidth="4" strokeLinecap="round" />
        <path d="M32 36 Q20 30 16 22" stroke="#2E8B57" strokeWidth="3" fill="none" />
        <path d="M32 32 Q44 26 48 18" stroke="#2E8B57" strokeWidth="3" fill="none" />
        <circle cx="18" cy="24" r="7" fill="#E94B35" stroke="#49352A" strokeWidth="1.5" />
        <circle cx="45" cy="22" r="7" fill="#E94B35" stroke="#49352A" strokeWidth="1.5" />
        <circle cx="32" cy="18" r="8" fill="#FF5A42" stroke="#49352A" strokeWidth="1.5" />
        <path d="M29 11 L32 14 L35 11" stroke="#2E8B57" strokeWidth="2" fill="none" />
      </svg>
    );
  }
  if (c.includes('WHEAT')) {
    return (
      <svg viewBox="0 0 64 64" className={`h-11 w-11 drop-shadow ${ready ? 'animate-bounce' : ''}`}>
        <path d="M22 54 Q20 34 18 16" stroke="#C98A1A" strokeWidth="3" fill="none" />
        <path d="M32 54 V12" stroke="#D99B26" strokeWidth="3.5" fill="none" />
        <path d="M42 54 Q44 34 46 16" stroke="#C98A1A" strokeWidth="3" fill="none" />
        <ellipse cx="32" cy="16" rx="4" ry="7" fill="#FFC857" stroke="#8C5B0E" strokeWidth="1.2" />
        <ellipse
          cx="18"
          cy="20"
          rx="3.5"
          ry="6"
          fill="#FFC857"
          stroke="#8C5B0E"
          strokeWidth="1.2"
        />
        <ellipse
          cx="46"
          cy="20"
          rx="3.5"
          ry="6"
          fill="#FFC857"
          stroke="#8C5B0E"
          strokeWidth="1.2"
        />
        <ellipse cx="28" cy="26" rx="3" ry="5" fill="#F2B138" stroke="#8C5B0E" strokeWidth="1.2" />
        <ellipse cx="36" cy="26" rx="3" ry="5" fill="#F2B138" stroke="#8C5B0E" strokeWidth="1.2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" className={`h-10 w-10 drop-shadow ${ready ? 'animate-bounce' : ''}`}>
      <path d="M32 52 V24" stroke="#2E8B57" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="23" cy="28" rx="9" ry="6" fill="#58A66A" stroke="#255E35" strokeWidth="1.5" />
      <ellipse cx="41" cy="26" rx="9" ry="6" fill="#58A66A" stroke="#255E35" strokeWidth="1.5" />
      <ellipse cx="32" cy="18" rx="7" ry="9" fill="#6EC282" stroke="#255E35" strokeWidth="1.5" />
    </svg>
  );
}

export function IsometricFarmView({
  data,
  selectedCrop,
  nowMs,
  acting,
  onUnlockPlot,
  onPlantPlot,
  onHarvestPlot,
}: IsometricFarmViewProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-[#49352A]/15 bg-gradient-to-b from-[#98DE7B] via-[#8AD46C] to-[#7CC45E] p-4 shadow-lg sm:p-6">
      {/* Top-Left Pill HUD (Idle Farming Style) */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border-2 border-[#49352A] bg-white px-3.5 py-1 text-xs font-extrabold text-[#49352A] shadow-sm">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FFC857] text-[#49352A]">
              <Coins className="h-3.5 w-3.5" />
            </span>
            <span className="tabular-nums">${data.player.cashBalance.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border-2 border-[#49352A] bg-white px-3.5 py-1 text-xs font-extrabold text-[#49352A] shadow-sm">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#58A66A] text-white">
              <Leaf className="h-3.5 w-3.5" />
            </span>
            <span>
              Lv {data.player.xpLevel} · Barn {data.farm.barnUsed}/{data.farm.barnCapacity}
            </span>
          </div>
        </div>

        <div className="rounded-full border-2 border-[#49352A] bg-[#FFF7E8] px-3.5 py-1 text-xs font-extrabold text-[#49352A] shadow-sm">
          Active Seed: {selectedCrop ? selectedCrop.name : 'None'}
        </div>
      </div>

      {/* Scenic Sky & Barn Header */}
      <div className="relative mt-4 flex items-center justify-between px-2 sm:px-8">
        {/* Red Barn SVG */}
        <svg viewBox="0 0 180 125" className="h-24 w-36 shrink-0 drop-shadow-md sm:h-28 sm:w-44">
          <polygon
            points="15,58 70,20 125,58 125,115 15,115"
            fill="#E94B35"
            stroke="#49352A"
            strokeWidth="3"
          />
          <polygon
            points="70,20 160,36 172,72 125,58"
            fill="#3B6EA5"
            stroke="#49352A"
            strokeWidth="3"
          />
          <polygon
            points="125,58 172,72 172,115 125,115"
            fill="#C93B28"
            stroke="#49352A"
            strokeWidth="3"
          />
          <polygon
            points="8,62 70,15 130,62 122,68 70,26 16,68"
            fill="#2B5480"
            stroke="#49352A"
            strokeWidth="2.5"
          />
          {/* Barn Door */}
          <rect
            x="44"
            y="70"
            width="42"
            height="45"
            fill="#D9A773"
            stroke="#49352A"
            strokeWidth="2.5"
          />
          <line x1="44" y1="70" x2="86" y2="115" stroke="#49352A" strokeWidth="2" />
          <line x1="86" y1="70" x2="44" y2="115" stroke="#49352A" strokeWidth="2" />
          {/* Side Windows */}
          <rect
            x="136"
            y="74"
            width="14"
            height="18"
            fill="#BDE0FE"
            stroke="#49352A"
            strokeWidth="2"
          />
          <rect
            x="154"
            y="78"
            width="12"
            height="18"
            fill="#BDE0FE"
            stroke="#49352A"
            strokeWidth="2"
          />
        </svg>

        {/* Smiling Sun & Cute Cloud */}
        <div className="flex items-center gap-4">
          <svg viewBox="0 0 80 80" className="h-16 w-16 drop-shadow sm:h-20 sm:w-20">
            <circle cx="40" cy="40" r="22" fill="#FFE066" stroke="#F4A261" strokeWidth="3" />
            <circle cx="33" cy="37" r="2.5" fill="#49352A" />
            <circle cx="47" cy="37" r="2.5" fill="#49352A" />
            <path
              d="M34 45 Q40 50 46 45"
              stroke="#49352A"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
          <svg viewBox="0 0 100 64" className="hidden h-14 w-24 drop-shadow sm:block">
            <path
              d="M24 50 H78 A14 14 0 0 0 80 22 A18 18 0 0 0 46 14 A15 15 0 0 0 20 26 A12 12 0 0 0 24 50 Z"
              fill="#FFFFFF"
              stroke="#A8DADC"
              strokeWidth="2.5"
            />
            <circle cx="45" cy="34" r="2" fill="#49352A" />
            <circle cx="57" cy="34" r="2" fill="#49352A" />
            <path
              d="M48 39 Q51 42 54 39"
              stroke="#49352A"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* Isometric Plot Yard */}
      <div className="relative mx-auto mt-2 max-w-4xl rounded-3xl border-4 border-[#A47148]/60 bg-[#9C6644]/20 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {data.plots.map((plot) => {
            const { percent, ready } = getPlotProgress(plot, nowMs);

            if (!plot.isUnlocked) {
              return (
                <button
                  key={plot.id}
                  type="button"
                  disabled={acting}
                  onClick={() => onUnlockPlot(plot.id)}
                  aria-label={`Unlock plot ${plot.plotIndex} for $${plot.unlockCost}`}
                  className="group relative flex h-28 flex-col items-center justify-center rounded-2xl border-2 border-[#49352A]/35 bg-[#D8D8DC] shadow-[0_5px_0_#9E9EA8] transition hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#49352A] bg-[#FFC857] text-[#49352A] shadow">
                    <Coins className="h-4 w-4" />
                  </div>
                  <span className="mt-1.5 rounded-full bg-[#49352A] px-2.5 py-0.5 text-[11px] font-extrabold text-[#FFF7E8]">
                    ${plot.unlockCost.toLocaleString()}
                  </span>
                  <span className="mt-0.5 text-[10px] font-bold text-[#49352A]/60">
                    Plot #{plot.plotIndex}
                  </span>
                </button>
              );
            }

            if (plot.status === 'EMPTY') {
              return (
                <button
                  key={plot.id}
                  type="button"
                  disabled={acting || !selectedCrop}
                  onClick={() => onPlantPlot(plot.id)}
                  aria-label={`Plant ${selectedCrop?.name ?? 'crop'} on plot ${plot.plotIndex}`}
                  className="group flex h-28 flex-col items-center justify-center rounded-2xl border-2 border-[#6B4423] bg-[#A66E38] shadow-[0_5px_0_#6B4423] transition hover:-translate-y-0.5 hover:bg-[#B2773F] active:translate-y-0 disabled:opacity-50"
                >
                  <Sprout className="h-6 w-6 text-[#FFE8B6]/80 transition group-hover:scale-110" />
                  <span className="mt-1 text-xs font-extrabold text-[#FFF7E8]">
                    + Plant {selectedCrop?.name ?? ''}
                  </span>
                  <span className="text-[10px] font-semibold text-[#FFF7E8]/70">
                    Plot #{plot.plotIndex}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={plot.id}
                type="button"
                disabled={acting || !ready}
                onClick={() => ready && onHarvestPlot(plot.id)}
                aria-label={
                  ready
                    ? `Harvest ${plot.cropName ?? 'crop'} from plot ${plot.plotIndex}`
                    : `${plot.cropName ?? 'Crop'} growing ${percent}% on plot ${plot.plotIndex}`
                }
                className={`relative flex h-28 flex-col items-center justify-between rounded-2xl border-2 p-2.5 shadow-[0_5px_0_#5C3A1E] transition ${
                  ready
                    ? 'cursor-pointer border-[#FFC857] bg-[#8D5B2C] ring-2 ring-[#FFC857]/60 hover:-translate-y-0.5'
                    : 'cursor-default border-[#6B4423] bg-[#9B6633]'
                }`}
              >
                <div className="flex w-full items-center justify-between text-[10px] font-extrabold text-[#FFF7E8]">
                  <span className="truncate">{plot.cropName}</span>
                  {ready && (
                    <span className="rounded-full bg-[#FFC857] px-1.5 py-0.5 text-[#49352A]">
                      HARVEST
                    </span>
                  )}
                </div>

                <CropIllustration code={plot.cropCode} ready={ready} />

                <div className="w-full">
                  <div className="h-2 w-full overflow-hidden rounded-full border border-[#49352A] bg-[#49352A]/60">
                    <div
                      className={`h-full transition-all duration-500 ${
                        ready ? 'bg-[#FFC857]' : 'bg-[#58A66A]'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
