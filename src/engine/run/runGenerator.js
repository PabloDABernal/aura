/**
 * Generador de Run. GDD sección 5.
 * generateRun(selectedSetIds, selectedLeaderIds, dataCtx) → RunState
 */
import { GENERIC_PLACE_POOL } from '../../data/genericPlaces.js';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(arr, n = 1) {
  return shuffle(arr).slice(0, n);
}

/**
 * Construye la baraja de invitados (5 por líder, mezclados).
 * @returns {string[]} array de characterIds barajados
 */
export function buildDeck(leaderIds, sets) {
  const guests = leaderIds.flatMap(leaderId => {
    const set = Object.values(sets).find(s => s.leaders.includes(leaderId));
    return set?.guests ?? [];
  });
  return shuffle(guests);
}

/**
 * Genera una área de la run.
 */
function generateArea(areaIndex, setId, isLast, sets, genericPlaces) {
  const set      = sets[setId];
  const setPlace = set?.placeIds?.[0];
  const leaders  = set?.leaders ?? [];

  // BUG 3 fix: no-replacement place selection, refill when pool exhausted
  const placePool = genericPlaces.map(p => p.id);
  let availablePlaces = shuffle([...placePool]);
  function pickUniquePlace() {
    if (availablePlaces.length === 0) availablePlaces = shuffle([...placePool]);
    return availablePlaces.pop();
  }

  // BUG 4 fix: vary corrupt per node, no two consecutive same, boss = primary corrupt
  const corruptPool = [...(set?.corruptIds ?? [])];
  if (corruptPool.length === 0 && leaders.length > 0) corruptPool.push(leaders[0]);
  const bossCorrupt = corruptPool[0] ?? leaders[0];
  let lastCorrupt = null;
  function pickNextCorrupt() {
    if (corruptPool.length <= 1) return corruptPool[0] ?? leaders[0];
    const candidates = corruptPool.filter(id => id !== lastCorrupt);
    const chosen = candidates.length > 0
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : corruptPool[0];
    lastCorrupt = chosen;
    return chosen;
  }

  const nodes = [];

  // Nodos 0-3: combate básico (attrBonus progresivo)
  for (let i = 0; i < 4; i++) {
    const placeId = i === 0 && setPlace ? setPlace : pickUniquePlace();
    nodes.push({
      index:         i,
      type:          'combat_basic',
      enemySetId:    setId,
      corruptCharId: pickNextCorrupt(),
      placeId,
      attrBonus:     i,
      canBeMerchant: i === 1 || i === 3,
      completed:     false,
      result:        null,
    });
  }

  // Nodo 4: conquista o elite (50/50)
  nodes.push({
    index:         4,
    type:          Math.random() < 0.5 ? 'conquista' : 'elite',
    enemySetId:    setId,
    corruptCharId: pickNextCorrupt(),
    placeId:       pickUniquePlace(),
    attrBonus:     4,
    canBeMerchant: false,
    completed:     false,
    result:        null,
  });

  // Nodo 5: boss/fusionado — attrBonus=0 (atributos base fijos)
  nodes.push({
    index:         5,
    type:          isLast ? 'fusionado' : 'boss',
    enemySetId:    setId,
    corruptCharId: bossCorrupt,
    placeId:       setPlace ?? pickUniquePlace(),
    attrBonus:     0,
    canBeMerchant: false,
    completed:     false,
    result:        null,
  });

  return { areaIndex, setId, nodes, currentNodeIndex: 0 };
}

/**
 * Genera el RunState completo.
 * @param {string[]} selectedSetIds
 * @param {string[]} selectedLeaderIds
 * @param {{ sets: {}, characters: {}, places: {} }} dataCtx
 * @returns RunState
 */
export function generateRun(selectedSetIds, selectedLeaderIds, dataCtx) {
  const { sets = {}, characters = {} } = dataCtx;
  const genericPlaces = GENERIC_PLACE_POOL;

  // Número de áreas = líderes + 1 (última = fusionado)
  const areaCount = selectedLeaderIds.length + 1;
  const areas = [];

  for (let i = 0; i < areaCount; i++) {
    const setId  = selectedSetIds[i % selectedSetIds.length];
    const isLast = i === areaCount - 1;
    areas.push(generateArea(i, setId, isLast, sets, genericPlaces));
  }

  return {
    id:              Date.now().toString(),
    startedAt:       Date.now(),
    selectedSetIds,
    selectedLeaderIds,
    areas,
    currentAreaIndex: 0,
    deck:            buildDeck(selectedLeaderIds, sets),
    activeEcos:      [],
    lereles:         0,
    checkpointsPassed: [],
    totalFlows:      0,
    totalPifias:     0,
    vibrationTimeTotal: 0,
    active:          true,
    victory:         null,
  };
}
