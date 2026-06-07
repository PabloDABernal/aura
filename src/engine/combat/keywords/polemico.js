/** Polémico: al intervenir, +level de influencia por aliado en el mismo lugar. */
export function applyPolemico({ state, slot, zone, zoneIndex, level = 1 }) {
  if (zone !== 'place') return state;
  const place    = state.places[zoneIndex];
  const allies   = (place?.occupants ?? []).filter(s => s.characterId !== slot.characterId);
  const bonus    = allies.length * level;
  if (bonus <= 0) return state;
  const upd = s => s.characterId === slot.characterId
    ? { ...s, influencia: s.influencia + bonus }
    : s;
  return {
    ...state,
    places: state.places.map((p, i) => i === zoneIndex
      ? { ...p, occupants: p.occupants.map(upd) }
      : p),
  };
}
