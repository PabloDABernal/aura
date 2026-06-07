/**
 * Datos hardcodeados para Fase 1.
 * 2 Sets (One Piece / Dragon Ball), 12 personajes + 2 corruptos + 2 lugares.
 */
import { leaderAura, guestAura }   from '../engine/character/auraCalculator.js';
import { split }                    from '../engine/character/attributeSplit.js';
import { calculateIntention }       from '../engine/combat/enemyAI.js';

// ─── definiciones de personajes ─────────────────────────────────────────────

export const CHARACTERS = {
  'char-luffy': {
    id:      'char-luffy',
    colorId: 'rojo',
    basics:  { name: 'Luffy',  emoji: '🔴', phrase: 'Voy a ser el Rey.' },
    leader: {
      activeAbility:  { keywordIds: ['viral'],        level: 1, customName: null },
      passiveAbility: null,
      ultimate:       null,
    },
    guest: {
      inheritedAbilityIds: [],
      onDrawOrInHQ: null,
      onDiscard:    { fromHQ: null, fromZone: null },
    },
    corrupt: {
      vibraTarget: 67,
      baseActions: { attackPit: { value: 2 }, recover: { value: 2 }, interveneRise: { value: 3 }, attackPlace: { value: 2 } },
      activeKeywordId: null, passiveKeywordId: null,
      timerModifiers: { hideMark: true, hideCentesimas: false, segundosUntil: 0, centesimasUntil: 4, separatorsFrom: 3, markFrom: 9 },
    },
  },

  'char-zoro': {
    id:      'char-zoro',
    colorId: 'rojo',
    basics:  { name: 'Zoro', emoji: '🔴', phrase: 'Nada me detiene.' },
    leader: {
      activeAbility:  null,
      passiveAbility: null,
      ultimate:       null,
    },
    guest: {
      inheritedAbilityIds: [],
      onDrawOrInHQ: null,
      onDiscard:    { fromHQ: null, fromZone: null },
    },
    corrupt: null,
  },

  'char-nami': {
    id:      'char-nami',
    colorId: 'rojo',
    basics:  { name: 'Nami', emoji: '🔴', phrase: 'El dinero lo es todo.' },
    leader: null,
    guest: {
      inheritedAbilityIds: [],
      onDrawOrInHQ: null,
      onDiscard:    { fromHQ: null, fromZone: null },
    },
    corrupt: null,
  },

  'char-robin': {
    id:      'char-robin',
    colorId: 'verde',
    basics:  { name: 'Robin', emoji: '🟢', phrase: 'Quiero seguir viviendo.' },
    leader: {
      activeAbility:  null,
      passiveAbility: { keywordIds: ['tendencia'], level: 1, customName: null },
      ultimate:       null,
    },
    guest: {
      inheritedAbilityIds: ['tendencia'],
      onDrawOrInHQ: null,
      onDiscard:    { fromHQ: null, fromZone: null },
    },
    corrupt: null,
  },

  'char-chopper': {
    id:      'char-chopper',
    colorId: 'verde',
    basics:  { name: 'Chopper', emoji: '🟢', phrase: 'Soy el médico.' },
    leader: null,
    guest: {
      inheritedAbilityIds: [],
      onDrawOrInHQ: null,
      onDiscard:    { fromHQ: null, fromZone: null },
    },
    corrupt: null,
  },

  'char-usopp': {
    id:      'char-usopp',
    colorId: 'verde',
    basics:  { name: 'Usopp', emoji: '🟢', phrase: 'Soy el francotirador.' },
    leader: null,
    guest: {
      inheritedAbilityIds: [],
      onDrawOrInHQ: null,
      onDiscard:    { fromHQ: null, fromZone: null },
    },
    corrupt: null,
  },
};

// ─── Dragon Ball (verde) ──────────────────────────────────────────────────────

Object.assign(CHARACTERS, {
  'char-goku': {
    id: 'char-goku', colorId: 'verde',
    basics: { name: 'Goku', emoji: '🟢', phrase: 'Tengo que superarme.' },
    leader: { activeAbility: null, passiveAbility: null, ultimate: null },
    guest:  { inheritedAbilityIds: [], onDrawOrInHQ: null, onDiscard: { fromHQ: null, fromZone: null } },
    corrupt: {
      vibraTarget: 45,
      baseActions: { attackPit: { value: 3 }, recover: { value: 3 }, interveneRise: { value: 2 }, attackPlace: { value: 2 } },
      activeKeywordId: null, passiveKeywordId: null,
      timerModifiers: { hideMark: true, hideCentesimas: false, segundosUntil: 0, centesimasUntil: 4, separatorsFrom: 3, markFrom: 9 },
    },
  },
  'char-vegeta': {
    id: 'char-vegeta', colorId: 'verde',
    basics: { name: 'Vegeta', emoji: '🟢', phrase: 'Soy el príncipe de todo.' },
    leader: { activeAbility: { keywordIds: ['viral'], level: 1, customName: null }, passiveAbility: null, ultimate: null },
    guest:  { inheritedAbilityIds: [], onDrawOrInHQ: null, onDiscard: { fromHQ: null, fromZone: null } },
    corrupt: null,
  },
  'char-piccolo': {
    id: 'char-piccolo', colorId: 'verde',
    basics: { name: 'Piccolo', emoji: '🟢', phrase: 'Cuida de él.' },
    leader: null,
    guest:  { inheritedAbilityIds: ['tendencia'], onDrawOrInHQ: null, onDiscard: { fromHQ: null, fromZone: null } },
    corrupt: null,
  },
  'char-gohan': {
    id: 'char-gohan', colorId: 'verde',
    basics: { name: 'Gohan', emoji: '🟢', phrase: 'Papá me enseñó todo.' },
    leader: null,
    guest:  { inheritedAbilityIds: [], onDrawOrInHQ: null, onDiscard: { fromHQ: null, fromZone: null } },
    corrupt: null,
  },
  'char-bulma': {
    id: 'char-bulma', colorId: 'verde',
    basics: { name: 'Bulma', emoji: '🟢', phrase: 'La ciencia lo explica todo.' },
    leader: null,
    guest:  { inheritedAbilityIds: [], onDrawOrInHQ: null, onDiscard: { fromHQ: null, fromZone: null } },
    corrupt: null,
  },
  'char-yamcha': {
    id: 'char-yamcha', colorId: 'verde',
    basics: { name: 'Yamcha', emoji: '🟢', phrase: '¡Wolf Fang Fist!' },
    leader: null,
    guest:  { inheritedAbilityIds: [], onDrawOrInHQ: null, onDiscard: { fromHQ: null, fromZone: null } },
    corrupt: null,
  },
});

// ─── definiciones de lugares ─────────────────────────────────────────────────

export const PLACES = {
  'place-1': {
    id:    'place-1',
    name:  'Soul Society',
    icon:  '🌙',
    type:  'basico',
    resonance:  30,
    upperLimit: null,
    vibra:      { mode: 'punto', target: 3500, timeLimit: 7, pifiaMargin: 20 },
    pifiaConsequence: { type: 'loseAura', value: 1 },
    conquerBonus:     { type: 'lereles', value: 2 },
  },
  'place-2': {
    id:    'place-2',
    name:  'Planeta Namek',
    icon:  '🌿',
    type:  'basico',
    resonance:  24,
    upperLimit: null,
    vibra:      { mode: 'punto', target: 3000, timeLimit: 7, pifiaMargin: 20 },
    pifiaConsequence: { type: 'loseAura', value: 1 },
    conquerBonus:     { type: 'lereles', value: 2 },
  },
};

// ─── sets (metadatos de colección) ───────────────────────────────────────────

export const SETS = {};

// ─── helpers ────────────────────────────────────────────────────────────────

function fisherYates(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── helpers para calcular atributos ─────────────────────────────────────────

function buildLeaderSlot(charId, isLeader = true) {
  const charDef = CHARACTERS[charId];
  const aura    = isLeader ? leaderAura(charDef) : guestAura(charDef);
  const attrs   = split(aura, charDef.colorId);
  return { characterId: charId, ...attrs, exhausted: false, isKO: false, states: [], cooldowns: {}, isLeader };
}

// ─── estado inicial del combate ───────────────────────────────────────────────

function buildInitialCombatState() {
  const luffyAura  = leaderAura(CHARACTERS['char-luffy']);  // 7 (tiene activeAbility)
  const corruptAura = luffyAura * 3;                         // 21

  const hq = [
    buildLeaderSlot('char-luffy', true),
    buildLeaderSlot('char-zoro',  true),
  ];

  const initialStateWithoutIntention = {
    nodeType: 'combat_basic',
    turn:     'player',
    enemies: [
      {
        characterId:    'char-luffy',
        auraMax:        corruptAura,
        auraCurrent:    corruptAura,
        vibraTarget:    CHARACTERS['char-luffy'].corrupt.vibraTarget,
        intention:      { action: 'rest', value: 2, targetId: null, placeIndex: 0, ambush: false },
        states:         [],
        buffs:          {},
        baseActions:    CHARACTERS['char-luffy'].corrupt.baseActions,
        timerModifiers: CHARACTERS['char-luffy'].corrupt.timerModifiers,
        presencia:      1,
        influencia:     1,
        temple:         2,
        actionToggle:   false,
      },
    ],
    pit:    [],
    places: [
      {
        placeId:          'place-1',
        type:             'basico',
        resonanceCurrent: PLACES['place-1'].resonance,
        resonanceMax:     PLACES['place-1'].resonance,
        rivalResonance:   null,
        occupants:        [],
        conquered:        false,
        state:            null,
        zoneTime:         0,
      },
    ],
    hq,
    deck:            fisherYates(['char-nami', 'char-robin', 'char-chopper', 'char-usopp']),
    pitTime:         0,
    discardPile:     [],
    lereles:         0,
    vibrationTime:   0,
    log:             [],
    pendingVibra:    null,
    pendingDefensiveVibra: null,
    enemyDoubleEffect:     false,
    victory:               null,
  };

  // Calcular intención inicial con el estado ya construido
  const firstIntention = calculateIntention(initialStateWithoutIntention);
  return {
    ...initialStateWithoutIntention,
    enemies: initialStateWithoutIntention.enemies.map((e, i) =>
      i === 0 ? { ...e, intention: firstIntention } : e
    ),
  };
}

export const INITIAL_COMBAT_STATE = buildInitialCombatState();

/** dataCtx para combatReducer: personajes y lugares. */
export const DATA_CTX = { characters: CHARACTERS, places: PLACES };
