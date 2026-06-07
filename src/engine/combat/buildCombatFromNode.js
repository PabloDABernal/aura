/**
 * Construye un CombatState a partir de un nodo de la run.
 * GDD sección 4 — tipos de combate.
 */
import { leaderAura, corruptAura } from '../character/auraCalculator.js';
import { split }                   from '../character/attributeSplit.js';
import { calculateIntention }      from './enemyAI.js';
import { PLACES }                  from '../../data/phase1Data.js';
import { GENERIC_PLACE_POOL }      from '../../data/genericPlaces.js';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildLeaderSlot(charId, dataCtx) {
  const def   = dataCtx.characters[charId];
  if (!def) return null;
  const aura  = leaderAura(def);
  const attrs = split(aura, def.colorId);
  const activeAbilities = def.leader?.activeAbility?.keywordIds ?? [];
  return { characterId: charId, ...attrs, exhausted: false, isKO: false, states: [], cooldowns: {}, abilityCooldowns: {}, activeAbilities, isLeader: true };
}

const ENEMY_ATTRS = {
  basic:  { presencia: 1, influencia: 1, temple: 2 },
  elite:  { presencia: 2, influencia: 2, temple: 2 },
  boss:   { presencia: 3, influencia: 2, temple: 3 },
};

function buildEnemyFromChar(charDef, combatType = 'basic') {
  if (!charDef?.corrupt) return null;
  const aura  = corruptAura(charDef, combatType);
  const attrs = ENEMY_ATTRS[combatType] ?? ENEMY_ATTRS.basic;
  return {
    characterId:    charDef.id,
    auraMax:        aura,
    auraCurrent:    aura,
    vibraTarget:    charDef.corrupt.vibraTarget ?? 67,
    intention:      { action: 'rest', value: attrs.temple, targetId: null, placeIndex: 0, ambush: false },
    states:         [],
    buffs:          {},
    baseActions:    charDef.corrupt.baseActions ?? {},
    timerModifiers: charDef.corrupt.timerModifiers ?? {},
    ...attrs,
    actionToggle:   false,
  };
}

function resolvePlaceDef(placeId, collectionPlaces = {}) {
  if (collectionPlaces[placeId]) return collectionPlaces[placeId];
  if (PLACES[placeId]) return PLACES[placeId];
  const generic = GENERIC_PLACE_POOL.find(p => p.id === placeId);
  return generic ?? null;
}

function buildPlaceState(placeId, collectionPlaces = {}) {
  const def = resolvePlaceDef(placeId, collectionPlaces);
  if (!def) return null;
  return {
    placeId,
    type:             def.type ?? 'basico',
    resonanceCurrent: def.resonance ?? 20,
    resonanceMax:     def.resonance ?? 20,
    rivalResonance:   null,
    occupants:        [],
    conquered:        false,
    state:            null,
    zoneTime:         0,
  };
}

/**
 * @param {object} node  - nodo de la run
 * @param {object} run   - RunState activo
 * @param {object} dataCtx - { characters, places }
 * @returns CombatState
 */
export function buildCombatFromNode(node, run, dataCtx) {
  const { type, corruptCharId, placeId, attrBonus = 0 } = node;
  const leaderIds = run.selectedLeaderIds ?? [];
  const collectionPlaces = dataCtx?.places ?? {};

  const hq = leaderIds
    .map(id => buildLeaderSlot(id, dataCtx))
    .filter(Boolean);

  const deck = shuffle(run.deck ?? []);

  let enemies = [];
  let places  = [];
  let nodeType = 'combat_basic';

  const charDef = dataCtx.characters[corruptCharId];

  switch (type) {
    case 'combat_basic':
    default: {
      const enemy = buildEnemyFromChar(charDef, 'basic');
      if (enemy) enemies = [{ ...enemy, presencia: enemy.presencia + attrBonus, influencia: enemy.influencia + attrBonus, temple: enemy.temple + attrBonus }];
      const place = buildPlaceState(placeId, collectionPlaces);
      if (place) places = [place];
      nodeType = 'combat_basic';
      break;
    }
    case 'elite': {
      const e1 = buildEnemyFromChar(charDef, 'elite');
      const e2 = buildEnemyFromChar(charDef, 'elite');
      const bonus = (e) => e ? { ...e, presencia: e.presencia + attrBonus, influencia: e.influencia + attrBonus, temple: e.temple + attrBonus } : e;
      if (e1) enemies = [bonus(e1), e2 ? { ...bonus(e2), characterId: corruptCharId + '_2' } : bonus(e1)];
      const place = buildPlaceState(placeId, collectionPlaces);
      if (place) places = [place];
      nodeType = 'elite';
      break;
    }
    case 'conquista': {
      const enemy = buildEnemyFromChar(charDef, 'basic');
      if (enemy) enemies = [enemy];
      // 3 lugares aleatorios del pool
      const pool = GENERIC_PLACE_POOL.filter(p => p.type === 'basico');
      const pickedPlaces = shuffle(pool).slice(0, 3);
      places = pickedPlaces.map(pd => buildPlaceState(pd.id, collectionPlaces)).filter(Boolean);
      if (places.length === 0) places = [buildPlaceState(placeId, collectionPlaces)].filter(Boolean);
      nodeType = 'conquista';
      break;
    }
    case 'boss': {
      const enemy = buildEnemyFromChar(charDef, 'boss');
      if (enemy) enemies = [enemy];
      const place = buildPlaceState(placeId, collectionPlaces);
      if (place) places = [place];
      nodeType = 'boss';
      break;
    }
    case 'fusionado': {
      // Aura = suma de (leaderAura × 10) de cada líder
      const fusedAura = leaderIds.reduce((sum, id) => {
        const def = dataCtx.characters[id];
        return sum + (def ? leaderAura(def) * 10 : 0);
      }, 0);
      const fusedEnemy = {
        characterId:    'fusionado',
        auraMax:        fusedAura,
        auraCurrent:    fusedAura,
        vibraTarget:    50,
        intention:      { action: 'rest', value: 3, targetId: null, placeIndex: 0, ambush: false },
        states:         [], buffs: {},
        baseActions:    {},
        timerModifiers: { hideMark: true, soloBar: true, segundosUntil: 0 },
        presencia:      3,
        influencia:     3,
        temple:         3,
        actionToggle:   false,
      };
      enemies = [fusedEnemy];
      const place = buildPlaceState(placeId, collectionPlaces);
      if (place) places = [place];
      nodeType = 'fusionado';
      break;
    }
  }

  const baseState = {
    nodeType,
    turn:    'player',
    enemies, hq, deck, pit: [],
    places, discardPile: [],
    lereles:          run.lereles ?? 0,
    activeEcos:       run.activeEcos ?? [],
    vibrationTime:    0,
    pitTime:          0,
    log:              [],
    pendingVibra:     null,
    pendingDefensiveVibra: null,
    pendingKoBonus:   0,
    enemyDoubleEffect: false,
    victory:           null,
  };

  // Calcular intención inicial
  const intention = calculateIntention(baseState);
  return {
    ...baseState,
    enemies: baseState.enemies.map((e, i) => i === 0 ? { ...e, intention } : e),
  };
}
