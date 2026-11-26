export interface ElapsedTimeResult {
  rawElapsedSeconds: number;
  effectiveSeconds: number;
  wasCapped: boolean;
}

/**
 * Computes elapsed seconds between two UTC timestamps, clamped to [0, maxCapSeconds].
 */
export function calculateElapsedSeconds(
  fromTime: Date,
  toTime: Date,
  maxCapSeconds: number
): ElapsedTimeResult {
  const diffMs = Math.max(0, toTime.getTime() - fromTime.getTime());
  const rawElapsedSeconds = Math.floor(diffMs / 1000);
  const effectiveSeconds = Math.min(rawElapsedSeconds, Math.max(0, maxCapSeconds));

  return {
    rawElapsedSeconds,
    effectiveSeconds,
    wasCapped: rawElapsedSeconds > maxCapSeconds,
  };
}

/**
 * Converts seconds into fractional hours for hourly wage/upkeep/revenue proration.
 */
export function secondsToHours(seconds: number): number {
  return Math.max(0, seconds) / 3600;
}

/**
 * XP required to advance from level L to L+1: floor(100 * L^1.85).
 */
export function xpRequiredForLevel(xpLevel: number): number {
  const safeLevel = Math.max(1, Math.floor(xpLevel));
  return Math.floor(100 * Math.pow(safeLevel, 1.85));
}

/**
 * Computes updated XP level and remaining XP after adding earnedXp.
 */
export function applyXpGain(
  currentLevel: number,
  currentXp: number,
  earnedXp: number
): { xpLevel: number; currentXp: number; levelsGained: number } {
  let level = Math.max(1, currentLevel);
  let xp = Math.max(0, currentXp) + Math.max(0, Math.floor(earnedXp));
  let levelsGained = 0;

  while (xp >= xpRequiredForLevel(level)) {
    xp -= xpRequiredForLevel(level);
    level += 1;
    levelsGained += 1;
  }

  return { xpLevel: level, currentXp: xp, levelsGained };
}
