/**
 * Desafío Diario — seed determinista, PRNG, personaje sistema, condiciones.
 * GDD v4.0 §10.3
 */

export function getTodayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${dd}`;
}

export function getDailySeed(dateStr) {
  const n = parseInt(dateStr, 10);
  let h = 0x811c9dc5;
  let x = n;
  for (let i = 0; i < 8; i++) {
    h ^= (x & 0xff);
    h = Math.imul(h, 0x01000193) >>> 0;
    x = (x / 256) | 0;
  }
  return h >>> 0;
}

export function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CONDITIONS = [
  {
    id: 'standard',
    label: 'Estándar',
    description: 'Run normal de Grado 10. Sin modificadores.',
    startingLives: 3,
  },
  {
    id: 'reduced_lives',
    label: 'Escasez de Vidas',
    description: 'Comienzas con solo 2 vidas en lugar de 3.',
    startingLives: 2,
  },
  {
    id: 'tight_margins',
    label: 'Márgenes Ajustados',
    description: 'El margen de cada prueba se reduce en 1 punto.',
    startingLives: 3,
    marginPenalty: 1,
  },
  {
    id: 'speed_rush',
    label: 'Contrarreloj',
    description: 'Todos los tiempos están reducidos un 15%.',
    startingLives: 3,
    speedPenalty: 0.15,
  },
  {
    id: 'iron_will',
    label: 'Voluntad de Hierro',
    description: 'Las sincronías perfectas ya no recuperan vidas.',
    startingLives: 3,
    noHealOnPerfect: true,
  },
];

export function getDailyCondition(dateStr) {
  const seed = getDailySeed(dateStr);
  const rng  = mulberry32(seed);
  const idx  = Math.floor(rng() * CONDITIONS.length);
  return CONDITIONS[idx];
}

export function getDailyChar(dateStr) {
  const seed = getDailySeed(dateStr);
  return {
    id:                'daily-system-char',
    name:              'Desafiante del Día',
    auraNumber:        seed % 100,
    grade:             10,
    status:            'active',
    _isSystemChar:     true,
    passiveAbility:    null,
    activeAbility:     null,
    auraAbility:       null,
    stats:             {},
    temporalResidues:  0,
    failedRunsAtGrade: 0,
  };
}
