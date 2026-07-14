/**
 * Generación de secuencias y configuración de pruebas.
 * GDD v4.0 Sección 3 y 4.
 */
import { gradeIndex as gi, getGradeConfig } from './gradeConfig.js';
import { PROBE_WEIGHTS }                     from './probeWeights.js';

// ── Familias mecánicas ────────────────────────────────────────────────────────
export const PROBE_FAMILY = {
  bingo: 'precision', xopportunities: 'precision', cadena: 'precision',
  suma100: 'calculo', banca: 'calculo', equilibrio: 'calculo', doblenada: 'calculo',
  memoria: 'memoria', ciego: 'memoria', cuentainterna: 'memoria',
  pacto: 'azar',
  pendulo: 'percepcion', espejo: 'percepcion', parpadeo: 'percepcion',
  rebote: 'percepcion', cadenciafantasma: 'percepcion', cargaenergia: 'percepcion',
  ecovisual: 'ritmo', poliritmo: 'ritmo', sincroniafase: 'ritmo',
};

export const FAMILY_LABELS = {
  precision: '🎯 PRECISIÓN',
  calculo:   '🔢 CÁLCULO',
  memoria:   '🧠 MEMORIA',
  azar:      '🎲 AZAR',
  percepcion:'👁 PERCEPCIÓN',
  ritmo:     '🎵 RITMO',
};

// ── Pools por familia GDD §4 ──────────────────────────────────────────────────
const F41 = ['bingo', 'xopportunities'];                                            // Precisión — siempre
const F45 = ['suma100', 'equilibrio', 'banca', 'doblenada'];                        // Cálculo — siempre
const F42 = ['memoria', 'ciego', 'cuentainterna'];                                  // Memoria — grado 4+
const F44 = ['pendulo', 'espejo', 'parpadeo', 'rebote', 'cadenciafantasma', 'cargaenergia']; // Percepción — grado 4+
const F43 = ['ecovisual', 'poliritmo', 'sincroniafase'];                            // Ritmo — grado 7+
const F46 = ['pacto'];                                                              // Azar — grado 7+

export function getProbePool(grade, collectorLevel = 1) {
  const pool = [...F41, ...F45];
  if (grade >= 3) pool.push('cadena');
  if (grade >= 4 && collectorLevel >= 5) pool.push(...F42, ...F44);
  if (grade >= 7 && collectorLevel >= 10) pool.push(...F43, ...F46);
  return pool;
}

function getProbeTen(grade, collectorLevel = 1, mercyRun = false) {
  const pool = getProbePool(grade, collectorLevel);
  if (mercyRun) {
    return pool.slice().sort((a, b) => (PROBE_WEIGHTS[a] ?? 5) - (PROBE_WEIGHTS[b] ?? 5))[0];
  }
  const heavy = pool.filter(p => (PROBE_WEIGHTS[p] ?? 0) >= 7);
  const candidates = heavy.length > 0 ? heavy : pool;
  return candidates.slice().sort((a, b) => (PROBE_WEIGHTS[b] ?? 0) - (PROBE_WEIGHTS[a] ?? 0))[0];
}

/**
 * Genera la secuencia de 10 tipos de prueba según grado y modo.
 * La prueba 10 es la de mayor peso disponible (o menor en mercy run).
 */
export function generateProbeSequence(grade, collectorLevel = 1, mercyRun = false) {
  const pool   = getProbePool(grade, collectorLevel);
  const hard10 = getProbeTen(grade, collectorLevel, mercyRun);

  const sequence = [];
  let lastFamily = null;

  for (let i = 0; i < 9; i++) {
    let candidates = pool.filter(p => PROBE_FAMILY[p] !== lastFamily);
    if (candidates.length === 0) candidates = pool;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    sequence.push(pick);
    lastFamily = PROBE_FAMILY[pick];
  }

  sequence.push(hard10);
  return sequence;
}

/**
 * Genera la config concreta para una prueba dado el tipo, grado y contexto.
 */
export function generateProbeConfig(probeType, grade, probeNumber, activeEcos = [], passiveAbility = null) {
  const g = gi(grade);
  const gradeConfig = getGradeConfig(grade);
  let config = {};

  switch (probeType) {

    // ── 4.1 Precisión ──────────────────────────────────────────────────────────
    case 'bingo': {
      const p = [
        { targets: 3, timeLimitSec: 60 },
        { targets: 5, timeLimitSec: 45 },
        { targets: 6, timeLimitSec: 40 },
        { targets: 8, timeLimitSec: 30 },
      ][g];
      config = { ...p, margin: gradeConfig.baseMargin };
      break;
    }

    case 'xopportunities': {
      const p = [
        { numTargets: 3, required: 1, totalSec: 10 },
        { numTargets: 4, required: 1, totalSec: 10 },
        { numTargets: 5, required: 2, totalSec: 10 },
        { numTargets: 6, required: 2, totalSec: 10 },
      ][g];
      config = { ...p, margin: Math.max(2, Math.round(gradeConfig.baseMargin * 0.8)) };
      break;
    }

    case 'cadena': {
      const p = [
        { links: 3, timeSec: 15, reductionSec: 2 },
        { links: 4, timeSec: 12, reductionSec: 2 },
        { links: 5, timeSec: 10, reductionSec: 2 },
        { links: 5, timeSec:  8, reductionSec: 2 },
      ][g];
      config = { ...p, margin: gradeConfig.baseMargin };
      break;
    }

    case 'memoria': {
      const p = [
        { totalSec: 10, delayMs: 3000, visibleMs: 2000 },
        { totalSec: 10, delayMs: 4000, visibleMs: 1000 },
        { totalSec: 12, delayMs: 5000, visibleMs: 500  },
        { totalSec: 15, delayMs: 6000, visibleMs: 0    },
      ][g];
      config = { ...p, margin: gradeConfig.baseMargin };
      break;
    }

    case 'ciego': {
      const p = [
        { visibleSec: 3,   totalSec: 10 },
        { visibleSec: 2,   totalSec: 10 },
        { visibleSec: 1.5, totalSec: 12 },
        { visibleSec: 1,   totalSec: 15 },
      ][g];
      config = { ...p, margin: gradeConfig.baseMargin };
      break;
    }

    case 'parpadeo': {
      const p = [
        { visibleMs: 500, hiddenMs: 1500, totalSec: 15 },
        { visibleMs: 300, hiddenMs: 1500, totalSec: 15 },
        { visibleMs: 200, hiddenMs: 2000, totalSec: 20 },
        { visibleMs: 150, hiddenMs: 2500, totalSec: 20 },
      ][g];
      config = { ...p, margin: gradeConfig.baseMargin };
      break;
    }

    case 'rebote': {
      const p = [
        { delayMs: 500, showDelay: true,  totalSec: 10 },
        { delayMs: 500, showDelay: true,  totalSec: 10 },
        { delayMs: 500, showDelay: false, totalSec: 12 },
        { delayMs: 500, showDelay: false, totalSec: 12 },
      ][g];
      config = { ...p, margin: gradeConfig.baseMargin };
      break;
    }

    case 'pendulo': {
      const p = [
        { swings: 4, swingDuration: 4, margin: 6 },
        { swings: 5, swingDuration: 3, margin: 4 },
        { swings: 5, swingDuration: 3, margin: 2 },
        { swings: 6, swingDuration: 2, margin: 1 },
      ][g];
      config = { ...p, requiredHits: 1, maxStops: null, showVisualAid: false };
      break;
    }

    case 'espejo': {
      const p = [
        { duration: 10, maxStops: 12, margin: 6 },
        { duration: 10, maxStops: 10, margin: 4 },
        { duration: 10, maxStops: 10, margin: 3 },
        { duration: 10, maxStops:  8, margin: 2 },
      ][g];
      config = { ...p, requiredHits: 1 };
      break;
    }

    // ── 4.2 Predicción y Duración ──────────────────────────────────────────────
    case 'cuentainterna': {
      const p = [
        { targetSec: 3,  margin: 0.50, attempts: 3 },
        { targetSec: 5,  margin: 0.30, attempts: 2 },
        { targetSec: 7,  margin: 0.20, attempts: 2 },
        { targetSec: 10, margin: 0.10, attempts: 1 },
      ][g];
      config = { ...p };
      break;
    }

    case 'cadenciafantasma': {
      const p = [
        { travelSec: 4,  margin: 0.40 },
        { travelSec: 6,  margin: 0.25 },
        { travelSec: 8,  margin: 0.15 },
        { travelSec: 10, margin: 0.10 },
      ][g];
      config = { ...p };
      break;
    }

    case 'cargaenergia': {
      const p = [
        { targetSec: 3,  margin: 0.50, barCurve: 'linear'    },
        { targetSec: 5,  margin: 0.30, barCurve: 'log'        },
        { targetSec: 7,  margin: 0.20, barCurve: 'log'        },
        { targetSec: 10, margin: 0.10, barCurve: 'oscillate'  },
      ][g];
      config = { ...p };
      break;
    }

    // ── 4.3 Ritmo y Sincronización ─────────────────────────────────────────────
    case 'ecovisual': {
      const p = [
        { lights: 3, cycleMostra: 3, intervalMs: 1000, marginMs: 200 },
        { lights: 3, cycleMostra: 2, intervalMs: 800,  marginMs: 150 },
        { lights: 4, cycleMostra: 2, intervalMs: 600,  marginMs: 100 },
        { lights: 5, cycleMostra: 1, intervalMs: 500,  marginMs: 70  },
      ][g];
      config = { ...p };
      break;
    }

    case 'poliritmo': {
      const p = [
        { intervalA: 800, intervalB: 1200, totalSec: 10, required: 1, marginMs: 250 },
        { intervalA: 700, intervalB: 1100, totalSec: 12, required: 1, marginMs: 200 },
        { intervalA: 600, intervalB: 1000, totalSec: 15, required: 1, marginMs: 150 },
        { intervalA: 500, intervalB:  900, totalSec: 18, required: 1, marginMs: 100 },
      ][g];
      config = { ...p };
      break;
    }

    case 'sincroniafase': {
      const p = [
        { revolutions: 2, required: 1, periodMs: 3000, marginMs: 250, fixedAngleDeg: 90 },
        { revolutions: 3, required: 1, periodMs: 3000, marginMs: 167, fixedAngleDeg: 90 },
        { revolutions: 4, required: 1, periodMs: 3000, marginMs: 117, fixedAngleDeg: 90 },
        { revolutions: 5, required: 2, periodMs: 3000, marginMs:  83, fixedAngleDeg: 90 },
      ][g];
      config = { ...p };
      break;
    }

    // ── 4.5 Acumulación y Control ──────────────────────────────────────────────
    case 'suma100': {
      const p = [
        { timeLimitSec: 90,  maxResets: 3 },
        { timeLimitSec: 75,  maxResets: 2 },
        { timeLimitSec: 60,  maxResets: 1 },
        { timeLimitSec: 45,  maxResets: 0 },
      ][g];
      config = { ...p, targetSum: 100 };
      break;
    }

    case 'equilibrio': {
      const p = [
        { minVal: 40, maxVal: 60, durationSec: 30, initialVal: 50 },
        { minVal: 45, maxVal: 55, durationSec: 30, initialVal: 50 },
        { minVal: 47, maxVal: 53, durationSec: 25, initialVal: 50 },
        { minVal: 48, maxVal: 52, durationSec: 20, initialVal: 50 },
      ][g];
      config = { ...p };
      break;
    }

    case 'banca': {
      const p = [
        { slots: 5, minTarget:  80, maxTarget: 120, totalSec: 60, discards: 99 },
        { slots: 5, minTarget:  90, maxTarget: 110, totalSec: 50, discards: 2  },
        { slots: 4, minTarget:  95, maxTarget: 105, totalSec: 40, discards: 1  },
        { slots: 3, minTarget:  98, maxTarget: 102, totalSec: 30, discards: 0  },
      ][g];
      config = { ...p };
      break;
    }

    case 'doblenada': {
      const p = [
        { maxStops: 3, explosionLimit: 8.00,  targetIdeal: 7.50, margin: 0.50, totalSec: 10 },
        { maxStops: 3, explosionLimit: 9.00,  targetIdeal: 8.50, margin: 0.30, totalSec: 10 },
        { maxStops: 2, explosionLimit: 10.00, targetIdeal: 9.50, margin: 0.15, totalSec: 10 },
        { maxStops: 2, explosionLimit: 10.00, targetIdeal: 9.99, margin: 0.05, totalSec: 10 },
      ][g];
      config = { ...p };
      break;
    }

    // ── 4.6 Azar y Estrategia ──────────────────────────────────────────────────
    case 'pacto': {
      const p = [
        { coins: 5, costPerSec: 0.5,  totalSec: 10, attempts: 3 },
        { coins: 4, costPerSec: 0.67, totalSec: 10, attempts: 2 },
        { coins: 3, costPerSec: 1.0,  totalSec: 10, attempts: 2 },
        { coins: 2, costPerSec: 1.33, totalSec: 10, attempts: 1 },
      ][g];
      config = { ...p };
      break;
    }

    default:
      config = { targets: 3, margin: gradeConfig.baseMargin, timeLimitSec: 60 };
  }

  // ── Velocidad de grado (reducir tiempos para grados 7+) ───────────────────
  const sf = gradeConfig.speedFactor;
  if (sf !== 1.0) {
    const factor = 1 / sf;
    if (config.timeLimitSec !== undefined) config.timeLimitSec = Math.max(5,  Math.round(config.timeLimitSec * factor));
    if (config.totalSec     !== undefined) config.totalSec     = Math.max(5,  Math.round(config.totalSec * factor));
    if (config.durationSec  !== undefined) config.durationSec  = Math.max(5,  Math.round(config.durationSec * factor));
    if (config.timeSec      !== undefined) config.timeSec      = Math.max(3,  Math.round(config.timeSec * factor));
    if (config.travelSec    !== undefined) config.travelSec    = Math.max(2,  Math.round(config.travelSec * factor));
  }

  return config;
}
