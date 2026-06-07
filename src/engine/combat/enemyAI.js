/**
 * IA del corrupto. SDD sección 4.7 / GDD v1.1.
 * Funciones puras - sin side effects.
 */

function applyDamageToSlot(slot, damage) {
  let { temple, presencia, influencia } = slot;
  let rem = damage;
  while (rem > 0 && temple > 0) { temple--; rem--; }
  while (rem > 0 && (presencia + influencia) > 0) {
    if (presencia > 0 && influencia > 0) {
      if (Math.random() < 0.5) presencia--; else influencia--;
    } else if (presencia > 0) { presencia--; } else { influencia--; }
    rem--;
  }
  return { ...slot, presencia: Math.max(0, presencia), influencia: Math.max(0, influencia), temple: Math.max(0, temple) };
}

function applyDamageToChar(state, characterId, damage) {
  if (damage <= 0) return state;
  const upd = s => s.characterId === characterId ? applyDamageToSlot(s, damage) : s;
  return {
    ...state,
    hq:     state.hq.map(upd),
    pit:    state.pit.map(upd),
    places: state.places.map(p => ({ ...p, occupants: p.occupants.map(upd) })),
  };
}

function nextToggle(enemy) {
  return ((enemy.actionToggle ?? 0) + 1) % 4;
}

/**
 * Calcula la intención del próximo turno del rival (GDD v1.1 Sección 3).
 *
 * Prioridades:
 * 1. Nadie en Foso NI en Lugar            → atributo aleatorio up
 * 2. Nadie en Foso, hay alguien en Lugar  → attack_place (siempre)
 * 3. Nadie en Lugar, hay alguien en Foso  → presencia_up
 * 4. Hay alguien en Foso Y en Lugar       → ciclo: rest(0)→attack_place(1)→temple_up(2)→attack_place(3)
 * 5. Solo Foso (Lugar conquistado/no existe) → rest(par) / temple_up(impar)
 *
 * actionToggle es un contador numérico 0-3 (mod 4) que avanza en rest, temple_up, attack_place.
 */
export function calculateIntention(state) {
  const enemy          = state.enemies[0];
  const place          = state.places[0];
  const pitChars       = state.pit.filter(c => !c.isKO);
  const placeOccupants = (place?.occupants ?? []).filter(c => !c.isKO);
  const canIntervene   = place && !place.conquered;
  const toggle         = enemy.actionToggle ?? 0;

  let action;

  if (pitChars.length === 0 && placeOccupants.length === 0) {
    // P1: nadie en ninguna zona → atributo aleatorio
    const attrs = ['presencia_up', 'influencia_up', 'temple_up'];
    action = attrs[Math.floor(Math.random() * 3)];
  } else if (pitChars.length === 0) {
    // P2: no hay Foso, sí hay Lugar → attack_place
    action = 'attack_place';
  } else if (placeOccupants.length === 0 && canIntervene) {
    // P3: Lugar vacío (activo) y hay Foso → presencia_up
    action = 'presencia_up';
  } else if (placeOccupants.length > 0) {
    // P4: hay Foso Y hay Lugar → ciclo por toggle
    const phase = toggle % 4;
    if      (phase === 0) action = 'rest';
    else if (phase === 1) action = 'attack_place';
    else if (phase === 2) action = 'temple_up';
    else                  action = 'attack_place';
  } else {
    // P5: solo Foso (Lugar conquistado o inexistente) → rest/temple_up alternando
    action = (toggle % 2 === 0) ? 'rest' : 'temple_up';
  }

  const value =
    action === 'rest'            ? (enemy.temple ?? 2) :
    action === 'attack_place'    ? (enemy.presencia ?? 1) :
    action === 'intervene_place' ? (enemy.influencia ?? 1) : 1;

  return { action, value, targetId: null, placeIndex: 0, ambush: false };
}

/**
 * Ejecuta la intención ALMACENADA del rival (no recalcula).
 * rest/temple_up/attack_place avanzan actionToggle (mod 4).
 */
export function executeIntention(state) {
  const enemy     = state.enemies[0];
  const intention = enemy.intention;
  if (!intention) return state;

  switch (intention.action) {

    case 'rest': {
      const newAura = enemy.auraCurrent + (intention.value ?? enemy.temple ?? 2);
      return {
        ...state,
        enemies: state.enemies.map((e, i) =>
          i === 0 ? { ...e, auraCurrent: newAura, actionToggle: nextToggle(e) } : e
        ),
      };
    }

    case 'presencia_up': {
      return {
        ...state,
        enemies: state.enemies.map((e, i) =>
          i === 0 ? { ...e, presencia: (e.presencia ?? 1) + 1 } : e
        ),
      };
    }

    case 'influencia_up': {
      return {
        ...state,
        enemies: state.enemies.map((e, i) =>
          i === 0 ? { ...e, influencia: (e.influencia ?? 1) + 1 } : e
        ),
      };
    }

    case 'temple_up': {
      return {
        ...state,
        enemies: state.enemies.map((e, i) =>
          i === 0 ? { ...e, temple: (e.temple ?? 2) + 1, actionToggle: nextToggle(e) } : e
        ),
      };
    }

    case 'attack_place': {
      const placeIdx  = intention.placeIndex ?? 0;
      const occupants = (state.places[placeIdx]?.occupants ?? []).filter(c => !c.isKO);
      const enemy     = state.enemies[0];

      if (occupants.length === 0) {
        // fallback: descanso
        return {
          ...state,
          enemies: state.enemies.map((e, i) =>
            i === 0 ? { ...e, auraCurrent: e.auraCurrent + (e.temple ?? 2), actionToggle: nextToggle(e) } : e
          ),
        };
      }

      // Trigger dodge challenge — highest Temple char defends
      const defender = [...occupants].sort((a, b) => (b.temple ?? 0) - (a.temple ?? 0))[0];
      return {
        ...state,
        pendingDefensiveVibra: {
          type:        'place_attack',
          characterId: defender.characterId,
          attribute:   Math.max(defender.temple ?? 1, 1),
          value:       intention.value,
          vibraTarget: enemy.vibraTarget ?? 50,
          placeIndex:  placeIdx,
        },
        enemies: state.enemies.map((e, i) =>
          i === 0 ? { ...e, actionToggle: nextToggle(e) } : e
        ),
      };
    }

    case 'intervene_place': {
      // Mantenido para compatibilidad; ya no se genera en calculateIntention
      const placeIdx = intention.placeIndex ?? 0;
      const place    = state.places[placeIdx];
      if (!place || place.conquered) {
        return {
          ...state,
          enemies: state.enemies.map((e, i) =>
            i === 0 ? { ...e, auraCurrent: e.auraCurrent + (e.temple ?? 2) } : e
          ),
        };
      }
      return {
        ...state,
        places: state.places.map((p, i) =>
          i === placeIdx ? { ...p, resonanceCurrent: p.resonanceCurrent + intention.value } : p
        ),
      };
    }

    default:
      return state;
  }
}
