/**
 * Grade configuration — GDD v4.0 §2.
 */

/**
 * Maps grade 1–10 to a tier index 0–3 used for probe config arrays.
 * Tiers: 0=grades 1-2, 1=grades 3-5, 2=grades 6-8, 3=grades 9-10.
 */
export function gradeIndex(grade) {
  if (grade <= 2) return 0;
  if (grade <= 5) return 1;
  if (grade <= 8) return 2;
  return 3;
}

/**
 * Returns the full grade config for a given grade.
 */
export function getGradeConfig(grade) {
  const g = Math.max(1, Math.min(10, grade ?? 1));
  return {
    baseMargin:          g <= 2 ? 10 : g <= 5 ? 7 : g <= 8 ? 5 : 3,
    speedFactor:         g <= 6 ? 1.0 : g <= 8 ? 1.1 : 1.2,
    startingLives:       g >= 9 ? 2 : 3,
    restrictEcosHealing: g >= 9,
  };
}
