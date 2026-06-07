/**
 * combatReducer — lógica pura de combate. SDD sección 4.
 * Recibe (state, action, dataCtx) → nuevo estado.
 * dataCtx: { characters: { id → charDef }, places: { id → placeDef } }
 */
import { checkVictory }                 from './victory.js';
import { calculateIntention, executeIntention } from './enemyAI.js';
import { KEYWORD_HANDLERS }             from './keywords/index.js';
import { split }                                   from '../character/attributeSplit.js';
import { guestAura, leaderAura }                   from '../character/auraCalculator.js';
import { applyEcos }                               from '../eco/ecoEngine.js';
import { ECO_HOOKS }                               from '../eco/ecoHooks.js';

// ─── helpers ────────────────────────────────────────────────────────────────

/** Añade entrada al log (mantiene máx 10). */
function addLog(state, msg) {
  const entry = { id: Date.now() + Math.random(), msg };
  return { ...state, log: [...state.log, entry].slice(-10) };
}

/** Localiza el slot de un personaje en cualquier zona. */
export function findCharSlot(state, characterId) {
  return (
    state.hq.find(c => c.characterId === characterId) ||
    state.pit.find(c => c.characterId === characterId) ||
    state.places.reduce((found, p) =>
      found || p.occupants.find(c => c.characterId === characterId), null)
  );
}

/** Localiza zona y índice de un personaje. Devuelve { zone, zoneIndex } o null. */
export function findCharLocation(state, characterId) {
  if (state.hq.some(c => c.characterId === characterId))
    return { zone: 'hq', zoneIndex: null };
  if (state.pit.some(c => c.characterId === characterId))
    return { zone: 'pit', zoneIndex: null };
  for (let i = 0; i < state.places.length; i++) {
    if (state.places[i].occupants.some(c => c.characterId === characterId))
      return { zone: 'place', zoneIndex: i };
  }
  return null;
}

/** Aplica daño a un slot: temple punto a punto primero, luego P o I aleatoriamente. */
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

/** Aplica daño a un personaje en cualquier zona. */
function applyDamageToChar(state, characterId, damage) {
  if (damage <= 0) return state;

  const updateSlot = s =>
    s.characterId === characterId ? applyDamageToSlot(s, damage) : s;

  return {
    ...state,
    hq:     state.hq.map(updateSlot),
    pit:    state.pit.map(updateSlot),
    places: state.places.map(p => ({ ...p, occupants: p.occupants.map(updateSlot) })),
  };
}

/** Marca un personaje como exhausted (o lo resetea). */
function setExhausted(state, characterId, val) {
  const upd = s => s.characterId === characterId ? { ...s, exhausted: val } : s;
  return {
    ...state,
    hq:     state.hq.map(upd),
    pit:    state.pit.map(upd),
    places: state.places.map(p => ({ ...p, occupants: p.occupants.map(upd) })),
  };
}

/** Maneja KO de un personaje (líder → HQ con isKO, invitado → descarte). */
function handleKO(state, characterId, dataCtx) {
  const slot = findCharSlot(state, characterId);
  if (!slot) return state;

  // Quitar de todas las zonas
  let s = {
    ...state,
    hq:     state.hq.filter(c => c.characterId !== characterId),
    pit:    state.pit.filter(c => c.characterId !== characterId),
    places: state.places.map(p => ({ ...p, occupants: p.occupants.filter(c => c.characterId !== characterId) })),
  };

  const name = dataCtx.characters[characterId]?.basics?.name ?? characterId;

  if (slot.isLeader) {
    const koSlot = { ...slot, presencia: 0, influencia: 0, temple: 0, isKO: true };
    s = { ...s, hq: [...s.hq, koSlot] };
    s = addLog(s, `${name} cae KO. Necesita 5L para reanimar.`);
  } else {
    s = { ...s, discardPile: [...s.discardPile, characterId] };
    s = addLog(s, `${name} es eliminado.`);
  }
  return s;
}

/** Actualiza tiempo de Vibración y flag de doble efecto. */
function addVibrationTime(state, ms) {
  const newTime = state.vibrationTime + ms;
  return {
    ...state,
    vibrationTime:       newTime,
    enemyDoubleEffect:   newTime >= 300000,
  };
}

/** Comprueba KO de todos los personajes del jugador y aplica handleKO si procede. */
function processAllKOs(state, dataCtx) {
  let s = state;
  const ids = [
    ...s.hq.map(sl => sl.characterId),
    ...s.pit.map(sl => sl.characterId),
    ...s.places.flatMap(p => p.occupants.map(sl => sl.characterId)),
  ];
  for (const characterId of ids) {
    const sl = findCharSlot(s, characterId);
    if (sl && !sl.isKO && (sl.presencia + sl.influencia + sl.temple) <= 0) {
      s = handleKO(s, characterId, dataCtx);
    }
  }
  return s;
}

/** Calcula intención y la asigna al primer enemigo. */
function refreshIntention(state) {
  const newIntention = calculateIntention(state);
  return {
    ...state,
    enemies: state.enemies.map((e, i) => i === 0 ? { ...e, intention: newIntention } : e),
  };
}

/** Conquista el lugar si resonancia <= 0 (aplica bonus y descuenta zoneTime). */
function checkPlaceConquest(state, placeIndex) {
  const place = state.places[placeIndex];
  if (!place || place.resonanceCurrent > 0 || place.conquered) return state;

  let s = {
    ...state,
    places: state.places.map((p, i) => i === placeIndex ? { ...p, conquered: true } : p),
    vibrationTime: Math.max(0, state.vibrationTime - place.zoneTime),
  };
  s = addLog(s, '¡Lugar conquistado! Tiempo de zona descontado.');
  return s;
}

// ─── reducer principal ───────────────────────────────────────────────────────

export function combatReducer(state, action, dataCtx = {}) {
  switch (action.type) {

    // ── Mover personaje ──────────────────────────────────────────────────────
    case 'MOVE_CHARACTER': {
      const { characterId, from, to, fromPlaceIndex = 0, toPlaceIndex = 0 } = action.payload;

      // Sacar el slot de la zona origen
      let slot = null;
      let s = { ...state };

      if (from === 'hq') {
        slot = s.hq.find(c => c.characterId === characterId);
        if (!slot) return state;
        s = { ...s, hq: s.hq.filter(c => c.characterId !== characterId) };
      } else if (from === 'pit') {
        slot = s.pit.find(c => c.characterId === characterId);
        if (!slot) return state;
        s = { ...s, pit: s.pit.filter(c => c.characterId !== characterId) };
      } else if (from === 'place') {
        slot = s.places[fromPlaceIndex]?.occupants.find(c => c.characterId === characterId);
        if (!slot) return state;
        s = { ...s, places: s.places.map((p, i) => i === fromPlaceIndex
          ? { ...p, occupants: p.occupants.filter(c => c.characterId !== characterId) }
          : p) };
      }

      if (!slot) return state;

      // Insertar en la zona destino
      if (to === 'hq') {
        if (s.hq.length >= 5) return state;
        s = { ...s, hq: [...s.hq, slot] };
      } else if (to === 'pit') {
        if (s.pit.length >= 5) return state;
        s = { ...s, pit: [...s.pit, slot] };
      } else if (to === 'place') {
        if ((s.places[toPlaceIndex]?.occupants.length ?? 5) >= 5) return state;
        s = { ...s, places: s.places.map((p, i) => i === toPlaceIndex
          ? { ...p, occupants: [...p.occupants, slot] }
          : p) };
      }

      const name = dataCtx.characters?.[characterId]?.basics?.name ?? characterId;
      s = addLog(s, `${name} se mueve al ${to === 'pit' ? 'Foso' : to === 'hq' ? 'HQ' : 'Lugar'}.`);

      const vic = checkVictory(s); if (vic) return { ...s, victory: vic };
      return { ...s, turn: 'enemy' };
    }

    // ── Robar carta ──────────────────────────────────────────────────────────
    case 'DRAW_CARD': {
      if (state.hq.length >= 5 || state.deck.length === 0) return state;

      const charId  = state.deck[0];
      const charDef = dataCtx.characters?.[charId];
      if (!charDef) return state;

      const aura  = guestAura(charDef);
      const attrs = split(aura, charDef.colorId);

      const newSlot = {
        characterId:      charId,
        ...attrs,
        exhausted:        false,
        isKO:             false,
        states:           [],
        cooldowns:        {},
        abilityCooldowns: {},
        activeAbilities:  [],
        isLeader:         false,
      };

      let s = { ...state, hq: [...state.hq, newSlot], deck: state.deck.slice(1) };
      s = addLog(s, `Robas a ${charDef.basics.name}.`);
      s = applyEcos(ECO_HOOKS.ON_DRAW, { state: s }, s.activeEcos ?? []).state;

      const vic = checkVictory(s); if (vic) return { ...s, victory: vic };
      return { ...s, turn: 'enemy' };
    }

    // ── Descansar ────────────────────────────────────────────────────────────
    case 'REST_CHARACTER': {
      const { characterId } = action.payload;
      // Solo desde HQ (GDD v1.1)
      const loc = findCharLocation(state, characterId);
      if (loc?.zone !== 'hq') return state;

      const slot = findCharSlot(state, characterId);
      if (!slot || slot.isKO) return state;

      const charDef = dataCtx.characters?.[characterId];
      const name = charDef?.basics?.name ?? characterId;

      const upd = s => s.characterId === characterId
        ? { ...s, exhausted: false, cooldowns: {} }
        : s;
      let s = {
        ...state,
        hq:     state.hq.map(upd),
        pit:    state.pit.map(upd),
        places: state.places.map(p => ({ ...p, occupants: p.occupants.map(upd) })),
      };

      s = addLog(s, `${name} descansa. Habilidades recargadas.`);
      s = applyEcos(ECO_HOOKS.ON_REST, { state: s, characterId }, s.activeEcos ?? []).state;

      const vic = checkVictory(s); if (vic) return { ...s, victory: vic };
      return { ...s, turn: 'enemy' };
    }

    // ── Descartar carta del mazo ─────────────────────────────────────────────
    case 'DISCARD_CARD': {
      if (state.deck.length === 0) return state;

      // Carta aleatoria del mazo (no siempre la primera)
      const rndIdx  = Math.floor(Math.random() * state.deck.length);
      const charId  = state.deck[rndIdx];
      const charDef = dataCtx.characters?.[charId];
      const newDeck = state.deck.filter((_, i) => i !== rndIdx);
      let s = {
        ...state,
        deck:        newDeck,
        discardPile: [...state.discardPile, charId],
        lereles:     state.lereles + 1,
      };
      s = addLog(s, `Descartas a ${charDef?.basics?.name ?? charId}. +1 Lerele.`);

      const vic = checkVictory(s); if (vic) return { ...s, victory: vic };
      return { ...s, turn: 'enemy' };
    }

    // ── Pasar turno ──────────────────────────────────────────────────────────
    case 'PASS_TURN': {
      let s = addLog(state, 'Pasas el turno.');
      const vic = checkVictory(s); if (vic) return { ...s, victory: vic };
      return { ...s, turn: 'enemy' };
    }

    // ── Activar keyword activa (viral, etc.) ─────────────────────────────────
    case 'USE_ACTIVE_KEYWORD': {
      const { characterId } = action.payload;
      const charDef = dataCtx.characters?.[characterId];
      const active  = charDef?.leader?.activeAbility;
      if (!active) return state;

      const kwId   = active.keywordIds?.[0];
      const handler = KEYWORD_HANDLERS[kwId];
      if (!handler) return state;

      const loc  = findCharLocation(state, characterId);
      const slot = findCharSlot(state, characterId);
      if (!loc || !slot) return state;

      let s = handler.apply({ state, slot, zone: loc.zone, zoneIndex: loc.zoneIndex, level: active.level ?? 1 });
      s = setExhausted(s, characterId, true);

      // Log específico por keyword
      let kwLog = `${charDef.basics.name} usa ${kwId}.`;
      if (kwId === 'viral') {
        const zone     = loc.zone;
        const zoneSlots = zone === 'pit' ? state.pit
          : zone === 'place' ? (state.places[loc.zoneIndex]?.occupants ?? [])
          : state.hq;
        const allies = zoneSlots.filter(sl => sl.characterId !== characterId);
        const bonus  = allies.length * (active.level ?? 1);
        kwLog = `Viral: +${bonus} presencia (${allies.length} aliados).`;
      }
      s = addLog(s, kwLog);

      const vic = checkVictory(s); if (vic) return { ...s, victory: vic };
      return { ...s, turn: 'enemy' };
    }

    // ── Iniciar vibra (abre TimingChallenge) ─────────────────────────────────
    case 'START_VIBRA': {
      return { ...state, pendingVibra: action.payload };
    }

    // ── Resolver vibra del jugador ───────────────────────────────────────────
    case 'RESOLVE_VIBRA': {
      const { result, context } = action.payload;
      const { type, characterId, characterIds, placeIndex = 0 } = context;

      let s = { ...state, pendingVibra: null };

      if (result.timeSpent) {
        s = addVibrationTime(s, result.timeSpent);
        if (type === 'confront') {
          s = { ...s, pitTime: (s.pitTime ?? 0) + result.timeSpent };
        } else if (type === 'intervene') {
          s = { ...s, places: s.places.map((p, i) => i === placeIndex
            ? { ...p, zoneTime: p.zoneTime + result.timeSpent }
            : p) };
        }
      }

      const name = dataCtx.characters?.[characterId]?.basics?.name ?? characterId;

      // Daño al objetivo (GDD v1.1)
      if (type === 'confront') {
        if (result.multiplier > 0 && result.finalValue > 0) {
          const enemy   = s.enemies[0];
          const newAura = Math.max(0, enemy.auraCurrent - result.finalValue);
          s = { ...s, enemies: [{ ...enemy, auraCurrent: newAura }] };
          s = addLog(s, `${result.result.toUpperCase()}! ${name} inflige ${result.finalValue} Aura al corrupto.`);
        }
      } else {
        if (result.multiplier > 0 && result.finalValue > 0) {
          const newRes = Math.max(0, s.places[placeIndex].resonanceCurrent - result.finalValue);
          s = { ...s, places: s.places.map((p, i) => i === placeIndex
            ? { ...p, resonanceCurrent: newRes }
            : p) };
          s = addLog(s, `${result.result.toUpperCase()}! ${name} reduce ${result.finalValue} resonancia.`);
          const preConquered = s.places[placeIndex]?.conquered;
          s = checkPlaceConquest(s, placeIndex);
          if (!preConquered && s.places[placeIndex]?.conquered) {
            s = applyEcos(ECO_HOOKS.ON_PLACE_CONQUERED, { state: s, placeIndex }, s.activeEcos ?? []).state;
          }
        }
      }

      // Fallo / Pifia: el corrupto contraataca (GDD v1.1 Sección 2)
      if (result.result === 'fail' || result.result === 'pifia' || result.result === 'timeout') {
        const failEnemy = s.enemies[0];
        if (type === 'confront') {
          const presencia = failEnemy?.presencia ?? 1;
          for (const pitChar of [...s.pit]) {
            s = applyDamageToChar(s, pitChar.characterId, presencia);
          }
          s = addLog(s, `Fallo: Corrupto aplica ${presencia} daño al Foso.`);
        } else {
          const influencia = failEnemy?.influencia ?? 1;
          s = {
            ...s,
            places: s.places.map((p, i) => i === placeIndex
              ? { ...p, resonanceCurrent: p.resonanceCurrent + influencia }
              : p),
          };
          s = addLog(s, `Fallo: Corrupto sube resonancia en ${influencia}.`);
        }
      }

      // Pifia extra: daño doble — aplica el mismo daño de fallo una vez más (GDD v1.1)
      if (result.result === 'pifia') {
        const pifiaEnemy = s.enemies[0];
        if (type === 'confront') {
          const pP = pifiaEnemy?.presencia ?? 1;
          for (const pitChar of [...s.pit]) {
            s = applyDamageToChar(s, pitChar.characterId, pP);
          }
          s = addLog(s, `¡PIFIA! Daño doble (${pP * 2}) al Foso.`);
        } else {
          const pI = pifiaEnemy?.influencia ?? 1;
          s = {
            ...s,
            places: s.places.map((p, i) => i === placeIndex
              ? { ...p, resonanceCurrent: p.resonanceCurrent + pI }
              : p),
          };
          s = addLog(s, `¡PIFIA! Resonancia +${pI * 2} total.`);
        }
      }

      // KO del personaje atacante
      const afterSlot = findCharSlot(s, characterId);
      if (afterSlot && !afterSlot.isKO && (afterSlot.presencia + afterSlot.influencia + afterSlot.temple) <= 0) {
        s = handleKO(s, characterId, dataCtx);
        s = applyEcos(ECO_HOOKS.ON_KO, { state: s, characterId }, s.activeEcos ?? []).state;
      }

      // Temp log for verification — remove after confirming ON_VIBRA_RESULT fires
      if (import.meta.env?.DEV) console.log('[ECO] ON_VIBRA_RESULT fired, activeEcos:', s.activeEcos ?? []);
      s = applyEcos(ECO_HOOKS.ON_VIBRA_RESULT, { state: s, result, characterId }, s.activeEcos ?? []).state;

      // NO se marca exhausted por Confrontar/Intervenir (GDD v1.1 — solo habilidades activas)

      const vic = checkVictory(s); if (vic) return { ...s, victory: vic };
      return { ...s, turn: 'enemy' };
    }

    // ── Resolver Acción Segura ───────────────────────────────────────────────
    case 'RESOLVE_ACCION_SEGURA': {
      const { type, characterId, characterIds, attribute, placeIndex = 0 } = action.payload.context;

      let s = addVibrationTime(state, 3000);
      const name = dataCtx.characters?.[characterId]?.basics?.name ?? characterId;

      if (type === 'confront') {
        const enemy   = s.enemies[0];
        const newAura = Math.max(0, enemy.auraCurrent - attribute);
        s = { ...s, enemies: [{ ...enemy, auraCurrent: newAura }] };
        s = addLog(s, `Acción Segura: ${name} inflige ${attribute} Aura al corrupto.`);
      } else {
        const newRes = Math.max(0, s.places[placeIndex].resonanceCurrent - attribute);
        s = { ...s, places: s.places.map((p, i) => i === placeIndex
          ? { ...p, resonanceCurrent: newRes }
          : p) };
        s = addLog(s, `Acción Segura: ${name} reduce ${attribute} resonancia.`);
        const preConquered = s.places[placeIndex]?.conquered;
        s = checkPlaceConquest(s, placeIndex);
        if (!preConquered && s.places[placeIndex]?.conquered) {
          s = applyEcos(ECO_HOOKS.ON_PLACE_CONQUERED, { state: s, placeIndex }, s.activeEcos ?? []).state;
        }
      }

      const vic = checkVictory(s); if (vic) return { ...s, victory: vic };
      return { ...s, turn: 'enemy' };
    }

    // ── Turno del enemigo ────────────────────────────────────────────────────
    case 'ENEMY_TURN': {
      let s = executeIntention(state);

      s = processAllKOs(s, dataCtx);
      s = applyEcos(ECO_HOOKS.ON_KO, { state: s }, s.activeEcos ?? []).state;

      const enemy  = s.enemies[0];
      const name   = dataCtx.characters?.[enemy.characterId]?.basics?.name ?? enemy.characterId;
      const intent = state.enemies[0].intention;
      const logMsg =
        intent.action === 'rest'            ? `Corrupto ${name}: Descansa (+${intent.value} Aura).` :
        intent.action === 'presencia_up'    ? `Corrupto ${name}: Sube Presencia.` :
        intent.action === 'influencia_up'   ? `Corrupto ${name}: Sube Influencia.` :
        intent.action === 'temple_up'       ? `Corrupto ${name}: Sube Temple.` :
        intent.action === 'attack_place'    ? `Corrupto ${name}: ¡Ataca el Lugar!` :
        intent.action === 'intervene_place' ? `Corrupto ${name}: Refuerza resonancia en ${intent.value}.` :
        `Corrupto ${name}: ${intent.action} (${intent.value}).`;
      s = addLog(s, logMsg);

      s = refreshIntention(s);
      const vic = checkVictory(s); if (vic) return { ...s, victory: vic };
      return { ...s, turn: 'player' };
    }

    // ── Resolver vibra defensiva (esquivar ataque del rival) ─────────────────
    case 'RESOLVE_DEFENSIVE_VIBRA': {
      const { result } = action.payload;
      const def  = state.pendingDefensiveVibra;
      let s      = { ...state, pendingDefensiveVibra: null };

      const charDef = dataCtx.characters?.[def.characterId];
      const name    = charDef?.basics?.name ?? def.characterId;
      const enemy   = s.enemies[0];
      const rawEN   = dataCtx.characters?.[enemy.characterId]?.basics?.name ?? '';
      const eName   = `Corrupto ${rawEN}`.trim();

      if (def.type === 'place_attack') {
        // Dodge a place attack with Temple
        if (result.result === 'flow') {
          // Reflect — enemy takes own damage back
          const newAura = Math.max(0, enemy.auraCurrent - def.value);
          s = { ...s, enemies: [{ ...enemy, auraCurrent: newAura }] };
          s = addLog(s, `¡${name} REFLEJA el golpe! Corrupto recibe ${def.value}.`);
        } else if (result.result === 'vibra') {
          s = addLog(s, `¡${name} ESQUIVA el ataque de ${eName}!`);
        } else if (result.result === 'pifia') {
          s = applyDamageToChar(s, def.characterId, def.value);
          s = addLog(s, `¡PIFIA! ${name} recibe ${def.value} y retrocede al HQ.`);
          // Force defender back to HQ
          const loc  = findCharLocation(s, def.characterId);
          const slot2 = findCharSlot(s, def.characterId);
          if (loc?.zone === 'place' && slot2 && s.hq.length < 5) {
            s = {
              ...s,
              places: s.places.map((p, i) => i === (def.placeIndex ?? 0)
                ? { ...p, occupants: p.occupants.filter(c => c.characterId !== def.characterId) }
                : p),
              hq: [...s.hq, slot2],
            };
          }
        } else {
          // fail / timeout
          s = applyDamageToChar(s, def.characterId, def.value);
          s = addLog(s, `${name} recibe ${def.value} de ${eName}.`);
        }
      } else {
        // Direct attack dodge (presencia hit)
        const parryMs = (def.segundosUntil ?? 1) * 1000;
        const isParry = result.timeSpent > 0 && result.timeSpent < parryMs;

        if (isParry) {
          const attackerSlot = findCharSlot(s, def.characterId);
          const contrataque  = attackerSlot?.presencia ?? 1;
          const newAura = Math.max(0, enemy.auraCurrent - contrataque);
          s = { ...s, enemies: [{ ...enemy, auraCurrent: newAura }] };
          s = addLog(s, `¡${name} PARRY! Esquiva y contraataca (${contrataque}).`);
        } else if (result.result === 'flow' || result.result === 'vibra') {
          s = addLog(s, `¡${name} esquiva el ataque de ${eName}!`);
        } else if (result.result === 'pifia') {
          const dmg = def.value * 2;
          s = applyDamageToChar(s, def.characterId, dmg);
          s = addLog(s, `Pifia al esquivar. ${name} recibe ${dmg} de daño.`);
        } else {
          s = applyDamageToChar(s, def.characterId, def.value);
          s = addLog(s, `${name} recibe ${def.value} de daño de ${eName}.`);
        }
      }

      // Comprobar KO
      const slot = findCharSlot(s, def.characterId);
      if (slot && (slot.presencia + slot.influencia + slot.temple) <= 0) {
        s = handleKO(s, def.characterId, dataCtx);
        s = applyEcos(ECO_HOOKS.ON_KO, { state: s, characterId: def.characterId }, s.activeEcos ?? []).state;
      }

      s = refreshIntention(s);
      const vic = checkVictory(s); if (vic) return { ...s, victory: vic };
      return { ...s, turn: 'player' };
    }

    // ── Reanimar líder (5 Lereles) ───────────────────────────────────────────
    case 'REVIVE_LEADER': {
      const { characterId } = action.payload;
      if (state.lereles < 5) return state;

      const slot = state.hq.find(c => c.characterId === characterId && c.isKO);
      if (!slot) return state;

      const charDef   = dataCtx.characters?.[characterId];
      const colorId   = charDef?.colorId ?? 'rojo';
      const baseAura  = charDef ? leaderAura(charDef) : 7;
      const baseAttrs = split(baseAura, colorId);

      let s = {
        ...state,
        lereles: state.lereles - 5,
        hq: state.hq.map(c => c.characterId === characterId
          ? { ...c, ...baseAttrs, isKO: false, exhausted: false }
          : c
        ),
      };
      s = addLog(s, `${charDef?.basics?.name ?? characterId} reanimado (-5L).`);

      const vic = checkVictory(s); if (vic) return { ...s, victory: vic };
      return { ...s, turn: 'enemy' };
    }

    default:
      return state;
  }
}
