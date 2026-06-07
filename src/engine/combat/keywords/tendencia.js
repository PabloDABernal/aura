/**
 * Tendencia — keyword pasiva verde.
 * Efecto: al Descansar +X Temple.
 * Hook: onRest
 */
export function applyTendencia(ctx) {
  const { state, slot, level } = ctx;
  const bonus = level;

  const updateSlot = s =>
    s.characterId === slot.characterId
      ? { ...s, temple: s.temple + bonus }
      : s;

  return {
    ...state,
    hq:     state.hq.map(updateSlot),
    pit:    state.pit.map(updateSlot),
    places: state.places.map(p => ({
      ...p,
      occupants: p.occupants.map(updateSlot),
    })),
  };
}
