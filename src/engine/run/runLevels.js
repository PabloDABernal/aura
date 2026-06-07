/**
 * Niveles de carta durante la run. GDD sección 5.
 * comun | infrecuente | rara | legendaria
 */
export const RUN_LEVELS = {
  comun:       { label: 'C', badge: 'C', statMult: 1.00, habilityMult: 1, border: '#555' },
  infrecuente: { label: 'I', badge: 'I', statMult: 1.25, habilityMult: 2, border: '#3BA84F' },
  rara:        { label: 'R', badge: 'R', statMult: 1.50, habilityMult: 3, border: '#4A90D9' },
  legendaria:  { label: 'L', badge: 'L', statMult: 2.00, habilityMult: 4, border: '#FFD700' },
};

/** Aplica el multiplicador de nivel a los atributos base. */
export function applyRunLevel(baseSlot, level = 'comun') {
  const mult = RUN_LEVELS[level]?.statMult ?? 1;
  if (mult === 1) return baseSlot;
  return {
    ...baseSlot,
    presencia:  Math.round(baseSlot.presencia  * mult),
    influencia: Math.round(baseSlot.influencia * mult),
    temple:     Math.round(baseSlot.temple     * mult),
    runLevel:   level,
  };
}
