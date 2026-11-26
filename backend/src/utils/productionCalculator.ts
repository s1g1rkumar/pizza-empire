/**
 * Computes effective production efficiency multiplier from assigned employees.
 * Base efficiency is 1.0x when no employees are assigned (manual owner operation);
 * each active employee adds productivity, capped at 4.0x.
 */
export function calculateProductionEfficiency(employeeProductivities: number[]): number {
  if (employeeProductivities.length === 0) {
    return 1.0;
  }
  const bonus = employeeProductivities.reduce((sum, p) => sum + Math.max(0, p) * 0.25, 0);
  return Number(Math.min(4.0, 1.0 + bonus).toFixed(2));
}

/**
 * Computes total production duration in seconds for a batch order,
 * scaled by production efficiency and clamped to a minimum of 5 seconds.
 */
export function calculateProductionDurationSeconds(
  baseDurationSeconds: number,
  quantity: number,
  efficiencyMultiplier: number
): number {
  const safeQty = Math.max(1, Math.floor(quantity));
  const safeEff = Math.max(0.5, efficiencyMultiplier);
  const raw = Math.round((baseDurationSeconds * safeQty) / safeEff);
  return Math.max(5, raw);
}
