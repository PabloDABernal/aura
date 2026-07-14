/**
 * Economy constants — GDD v4.0 §9 (D1), §8.1 (D2).
 */

// D1 — Lereles
export const BASE_LERELES_PER_PROBE  = 5;
export const GRADE_MULTIPLIER_STEP   = 0.2;
export const PERFECT_MULTIPLIER      = 1.5;
export const RUN_COMPLETE_BONUS      = (grade) => grade * 10;

export const CREATE_CHARACTER_COST   = 20;
export const ROUND_AURA_BONUS_COST   = 15;
export const REACTIVATE_COST         = 30;
export const EXTRA_ECO_SLOT_COST     = 10;
export const GRADE10_FRAGMENT_REWARD = 5;
export const RANGE_FRAGMENT_REWARD   = 3;

export function isRoundAuraNumber(n) {
  return Math.floor(n / 10) === n % 10;
}

export function getCreateCost(auraNumber) {
  return CREATE_CHARACTER_COST + (isRoundAuraNumber(auraNumber) ? ROUND_AURA_BONUS_COST : 0);
}

// D2 — Collector level
export const XP_PER_CHARACTER_CREATED = 10;
export const XP_PER_RUN_COMPLETED     = 5;
export const XP_PER_GRADE_UP          = 15;
export const XP_PER_GRADE10           = 50;
export const MAX_COLLECTOR_LEVEL      = 25;

/** XP acumulada para alcanzar el nivel n. Nivel 1=0, Nivel 2=100, Nivel n=(n-1)*100. */
export function XP_FOR_LEVEL(n) {
  return Math.max(0, (n - 1) * 100);
}

export function computeCollectorLevel(xp) {
  if (!xp || xp <= 0) return 1;
  return Math.min(Math.floor(xp / 100) + 1, MAX_COLLECTOR_LEVEL);
}
