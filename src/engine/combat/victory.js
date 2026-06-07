/**
 * Condiciones de victoria y derrota. SDD sección 4 / GDD sección 4.
 * Funciones puras - sin side effects.
 */

function allCharSlots(state) {
  return [
    ...state.hq,
    ...state.pit,
    ...state.places.flatMap(p => p.occupants),
  ];
}

/** Comprueba condiciones de victoria o derrota. Devuelve 'win'|'lose'|null. */
export function checkVictory(state) {
  // Ganar: todos los enemigos a 0 Aura
  if (state.enemies.every(e => e.auraCurrent <= 0)) return 'win';

  // Perder: 10 min de Vibración acumulados
  if (state.vibrationTime >= 600000) return 'lose';

  // Perder: mazo vacío + todos los líderes KO + sin Lereles para reanimar
  const chars  = allCharSlots(state);
  const leaders = chars.filter(c => c.isLeader);
  if (
    state.deck.length === 0 &&
    leaders.length > 0 &&
    leaders.every(c => c.isKO) &&
    state.lereles < 5
  ) return 'lose';

  return null;
}

/** Comprueba si un lugar ha sido conquistado (resonancia <= 0). */
export function checkPlaceConquered(place) {
  return place.resonanceCurrent <= 0;
}
