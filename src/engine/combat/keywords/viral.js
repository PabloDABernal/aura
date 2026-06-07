/**
 * Viral — keyword activa roja.
 * Efecto: +X Presencia por aliado en zona (Foso o Lugar, no HQ).
 * Hook: onActivate
 */
export function applyViral(ctx) {
  const { state, slot, zone, zoneIndex, level } = ctx;

  let allies = 0;
  if (zone === 'pit') {
    allies = state.pit.filter(c => c.characterId !== slot.characterId).length;
  } else if (zone === 'place') {
    allies = (state.places[zoneIndex]?.occupants ?? [])
      .filter(c => c.characterId !== slot.characterId).length;
  }

  const bonus = allies * level;
  if (bonus === 0) return state;

  const updateSlot = s =>
    s.characterId === slot.characterId
      ? { ...s, presencia: s.presencia + bonus }
      : s;

  return {
    ...state,
    pit:    zone === 'pit' ? state.pit.map(updateSlot) : state.pit,
    places: state.places.map((p, i) =>
      zone === 'place' && i === zoneIndex
        ? { ...p, occupants: p.occupants.map(updateSlot) }
        : p
    ),
  };
}
