/** Colección del jugador. GDD sección 9. SDD sección 3.5–3.7. */

function mkChar(id, setId, colorId, name, phrase, isLeader) {
  const emoji = { rojo: '🔴', morado: '🟣', negro: '⚫', verde: '🟢', naranja: '🟠' }[colorId] ?? '⭐';
  return {
    id, setId, colorId, status: 'confirmed', ownerId: 'local',
    basics: { name, phrase: phrase ?? '', emoji },
    leader: isLeader
      ? { activeAbility: null, passiveAbility: null, ultimate: null }
      : null,
    guest: { inheritedAbilityIds: [], onDrawOrInHQ: null, onDiscard: { fromHQ: null, fromZone: null } },
    corrupt: isLeader ? {
      vibraTarget: 50,
      baseActions: { attackPit: { value: 2 }, recover: { value: 2 }, interveneRise: { value: 3 }, attackPlace: { value: 2 } },
      timerModifiers: { hideMark: true, hideCentesimas: false, segundosUntil: 0, separatorsFrom: 3, markFrom: 9 },
    } : null,
  };
}

function mkPlace(id, setId, name, icon) {
  return {
    id, setId, status: 'confirmed', ownerId: 'local',
    name, icon, type: 'basico',
    resonance: 24, upperLimit: null,
    vibra: { mode: 'punto', target: 3500, timeLimit: 7, pifiaMargin: 20 },
    pifiaConsequence: { type: 'loseAura', value: 1 },
    conquerBonus: { type: 'lereles', value: 2 },
  };
}

function mkSet(id, colorId, category, name, charIds, placeId) {
  return {
    id, status: 'confirmed', ownerId: 'local',
    colorId, category, name,
    characters: charIds, placeId,
    collectionPointsEarned: 5,
    stats: { runsPlayed: 0, runsCompleted: 0, bestResult: null },
  };
}

function buildOnboarding() {
  const chars = {}, places = {};
  const configs = [
    {
      id: 'onb-rojo', colorId: 'rojo', cat: 'Anime', name: 'Piratas del Sol',
      leader: ['El Capitán', 'El mar es mío.'],
      guests: [
        ['El Espadachín', 'Tres espadas, tres victorias.'],
        ['La Navegante', 'Conozco cada estrella.'],
        ['El Francotirador', 'Nunca fallo.'],
        ['El Cocinero', 'Lucho con mis pies.'],
        ['El Arqueólogo', 'Quiero seguir viviendo.'],
      ],
      place: ['El Gran Azul', '🌊'],
    },
    {
      id: 'onb-morado', colorId: 'morado', cat: 'Series', name: 'La Conspiración',
      leader: ['El Detective', 'Todo deja rastro.'],
      guests: [
        ['La Manipuladora', 'Las palabras son mi arma.'],
        ['El Espía', 'Soy el que no ves.'],
        ['La Informante', 'Lo sé todo de todos.'],
        ['El Hacker', 'No hay sistema seguro.'],
        ['El Maestro', 'Mi plan está en marcha.'],
      ],
      place: ['La Sede Central', '🏛️'],
    },
    {
      id: 'onb-negro', colorId: 'negro', cat: 'Videojuegos', name: 'Los Maestros',
      leader: ['El Guerrero', 'Mi espada no descansa.'],
      guests: [
        ['La Maga', 'El poder fluye por mí.'],
        ['El Ladrón', 'Rápido y silencioso.'],
        ['El Sanador', 'Mantendré a todos en pie.'],
        ['El Arquero', 'A mil pasos no hay escape.'],
        ['La Asesina', 'Un golpe, un fin.'],
      ],
      place: ['El Dungeon Final', '🏚️'],
    },
    {
      id: 'onb-verde', colorId: 'verde', cat: 'Literatura', name: 'Los Guardianes',
      leader: ['El Mago', 'No pasarás.'],
      guests: [
        ['La Elfa', 'El bosque me guía.'],
        ['El Enano', 'Resistiré con honor.'],
        ['El Hobbit', 'Un paso más, solo uno.'],
        ['El Ranger', 'Este no es mi fin.'],
        ['La Sacerdotisa', 'La luz os protege.'],
      ],
      place: ['La Tierra Media', '🌿'],
    },
    {
      id: 'onb-naranja', colorId: 'naranja', cat: 'Deportes', name: 'Los Campeones',
      leader: ['El Delantero', 'Gol o muerte.'],
      guests: [
        ['El Portero', 'No entra ninguna.'],
        ['El Capitán del Equipo', 'Mi equipo, mi familia.'],
        ['El Mediocampista', 'Controlo el juego.'],
        ['El Defensa', 'Por aquí no pasas.'],
        ['El Entrenador', 'Tengo un plan.'],
      ],
      place: ['El Estadio', '🏟️'],
    },
  ];

  const sets = {};
  for (const cfg of configs) {
    const leaderId = `${cfg.id}-lider`;
    const guestIds = cfg.guests.map((_, i) => `${cfg.id}-g${i}`);
    const placeId  = `${cfg.id}-place`;

    chars[leaderId] = mkChar(leaderId, cfg.id, cfg.colorId, cfg.leader[0], cfg.leader[1], true);
    cfg.guests.forEach(([name, phrase], i) => {
      chars[guestIds[i]] = mkChar(guestIds[i], cfg.id, cfg.colorId, name, phrase, false);
    });
    places[placeId] = mkPlace(placeId, cfg.id, cfg.place[0], cfg.place[1]);
    sets[cfg.id] = mkSet(cfg.id, cfg.colorId, cfg.cat, cfg.name, [leaderId, ...guestIds], placeId);
  }

  return { sets, characters: chars, places };
}

const _onb = buildOnboarding();

export const INITIAL_COLLECTION = {
  sets:         { ..._onb.sets },
  characters:   { ..._onb.characters },
  places:       { ..._onb.places },
  ecos:         {},
  categories:   { rojo: ['Anime'], morado: ['Series'], negro: ['Videojuegos'], verde: ['Literatura', 'Anime'], naranja: ['Deportes'] },
  slots:        { rojo: 2, morado: 1, negro: 1, verde: 2, naranja: 1 },
  archivedSets: [],
};

export function collectionReducer(col = INITIAL_COLLECTION, action) {
  switch (action.type) {

    // ── Sets ─────────────────────────────────────────────────────────────────
    case 'CREATE_SET': {
      const s = {
        ...action.set, status: 'draft', characters: [], placeId: null,
        ownerId: 'local', collectionPointsEarned: 0,
        stats: { runsPlayed: 0, runsCompleted: 0, bestResult: null },
      };
      return { ...col, sets: { ...col.sets, [s.id]: s } };
    }
    case 'UPDATE_SET':
      return { ...col, sets: { ...col.sets, [action.id]: { ...col.sets[action.id], ...action.patch } } };
    case 'CONFIRM_SET':
      return { ...col, sets: { ...col.sets, [action.id]: { ...col.sets[action.id], status: 'confirmed' } } };
    case 'ARCHIVE_SET':
      return { ...col, sets: { ...col.sets, [action.id]: { ...col.sets[action.id], status: 'archived' } } };
    case 'DELETE_SET': {
      const { [action.id]: _s, ...restSets } = col.sets;
      return { ...col, sets: restSets };
    }

    // ── Personajes ────────────────────────────────────────────────────────────
    case 'CREATE_CHARACTER': {
      const c = { ...action.char, status: 'draft', ownerId: 'local' };
      return { ...col, characters: { ...col.characters, [c.id]: c } };
    }
    case 'UPDATE_CHARACTER':
      return { ...col, characters: { ...col.characters, [action.id]: { ...col.characters[action.id], ...action.patch } } };
    case 'CONFIRM_CHARACTER':
      return { ...col, characters: { ...col.characters, [action.id]: { ...col.characters[action.id], status: 'confirmed' } } };
    case 'DELETE_CHARACTER': {
      const { [action.id]: _c, ...restChars } = col.characters;
      return { ...col, characters: restChars };
    }

    // ── Lugares ───────────────────────────────────────────────────────────────
    case 'CREATE_PLACE': {
      const p = { ...action.place, status: 'draft', ownerId: 'local' };
      return { ...col, places: { ...col.places, [p.id]: p } };
    }
    case 'UPDATE_PLACE':
      return { ...col, places: { ...col.places, [action.id]: { ...col.places[action.id], ...action.patch } } };
    case 'CONFIRM_PLACE':
      return { ...col, places: { ...col.places, [action.id]: { ...col.places[action.id], status: 'confirmed' } } };
    case 'DELETE_PLACE': {
      const { [action.id]: _p, ...restPlaces } = col.places;
      return { ...col, places: restPlaces };
    }

    // ── Ecos ──────────────────────────────────────────────────────────────────
    case 'CREATE_ECO': {
      const e = { ...action.eco, ownerId: 'local', custom: true };
      return { ...col, ecos: { ...col.ecos, [e.id]: e } };
    }
    case 'UPDATE_ECO':
      return { ...col, ecos: { ...col.ecos, [action.id]: { ...col.ecos[action.id], ...action.patch } } };
    case 'DELETE_ECO': {
      const { [action.id]: _e, ...restEcos } = col.ecos;
      return { ...col, ecos: restEcos };
    }

    // ── Slots ─────────────────────────────────────────────────────────────────
    case 'UNLOCK_SLOT':
      return { ...col, slots: { ...col.slots, [action.colorId]: (col.slots[action.colorId] ?? 1) + 1 } };

    default:
      return col;
  }
}
