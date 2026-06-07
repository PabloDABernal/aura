import { split } from '../../character/attributeSplit.js';

/** Inspirador: cuando entra un aliado a la zona, gana +level Aura (split por color). */
export function applyInspirador({ state, allySlot, allyColorId, level = 1 }) {
  if (!allySlot) return state;
  const gain = split(level, allyColorId ?? 'verde');
  const upd  = s => s.characterId === allySlot.characterId
    ? { ...s, presencia: s.presencia + gain.presencia, influencia: s.influencia + gain.influencia, temple: s.temple + gain.temple }
    : s;
  return {
    ...state,
    hq:     state.hq.map(upd),
    pit:    state.pit.map(upd),
    places: state.places.map(p => ({ ...p, occupants: p.occupants.map(upd) })),
  };
}
