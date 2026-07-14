/**
 * Economy slice — lereles, aura fragments, extra eco slots.
 * GDD v4.0 §9.
 */
import { EXTRA_ECO_SLOT_COST } from '../data/economyConfig.js';

export function createEconomySlice(set, get) {
  return {
    lereles:       100,
    auraFragments: 0,
    extraEcoSlots: 0,

    addLereles: (amount) =>
      set(s => ({ lereles: (s.lereles ?? 100) + amount })),

    spendLereles: (amount) => {
      if ((get().lereles ?? 0) < amount) return false;
      set(s => ({ lereles: (s.lereles ?? 0) - amount }));
      return true;
    },

    addAuraFragments: (amount) =>
      set(s => ({ auraFragments: (s.auraFragments ?? 0) + amount })),

    buyExtraEcoSlot: () => {
      if ((get().auraFragments ?? 0) < EXTRA_ECO_SLOT_COST) return false;
      set(s => ({
        auraFragments: (s.auraFragments ?? 0) - EXTRA_ECO_SLOT_COST,
        extraEcoSlots: (s.extraEcoSlots ?? 0) + 1,
      }));
      return true;
    },
  };
}
