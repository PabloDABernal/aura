/**
 * Catálogo de pistas por tipo de prueba — GDD v4.2 §Niveles de Prueba.
 * Estructura canónica:
 *   base  — config de Nivel 1 (todos los contadores a 0); claves == props de componente
 *   pistas — array de { key, delta|values, cap, steps, type }
 *
 * Tipos de pista:
 *   { type: 'linear', key, delta, cap, steps }   — suma delta*n al base hasta cap
 *   { type: 'enum',   key, values, steps }        — avanza por lista ordenada
 *
 * Suma de steps por prueba: exactamente 20 (GDD: 20 pistas por prueba).
 *
 * Claves de salida alineadas con props de componentes:
 *   margin (cs), maxStops, timeLimitSec (bingo), duration (espejo),
 *   requiredHits (espejo), swingDuration (péndulo), range (parpadeo)
 */

export const PROBE_PISTAS = {

  // ── Bingo ──────────────────────────────────────────────────────────────────
  // base: targets 3, margin 3cs, timeLimitSec 20s, maxStops 20
  // pistas: targets +1→10 (7), margin -1→0 (3), timeLimitSec -2→10s (5), maxStops -2→10 (5)
  bingo: {
    base: { targets: 3, margin: 3, timeLimitSec: 20, maxStops: 20 },
    pistas: [
      { type: 'linear', key: 'targets',      delta: +1, cap: 10, steps: 7 },
      { type: 'linear', key: 'margin',       delta: -1, cap:  0, steps: 3 },
      { type: 'linear', key: 'timeLimitSec', delta: -2, cap: 10, steps: 5 },
      { type: 'linear', key: 'maxStops',     delta: -2, cap: 10, steps: 5 },
    ],
  },

  // ── Espejo ─────────────────────────────────────────────────────────────────
  // base: requiredHits 1, maxStops 16, duration 10s, margin 2cs
  // pistas: requiredHits +1→5 (4), margin -1→0 (2), duration -1→6s (4), maxStops -1→6 (10)
  espejo: {
    base: { requiredHits: 1, maxStops: 16, duration: 10, margin: 2 },
    pistas: [
      { type: 'linear', key: 'requiredHits', delta: +1, cap:  5, steps:  4 },
      { type: 'linear', key: 'margin',       delta: -1, cap:  0, steps:  2 },
      { type: 'linear', key: 'duration',     delta: -1, cap:  6, steps:  4 },
      { type: 'linear', key: 'maxStops',     delta: -1, cap:  6, steps: 10 },
    ],
  },

  // ── Péndulo ────────────────────────────────────────────────────────────────
  // base: swings 5, swingDuration 5s, maxStops 15, margin 2cs
  // pistas: swings -1→2 (3), swingDuration -1→2s (3), margin -1→0 (2), maxStops -1→3 (12)
  pendulo: {
    base: { swings: 5, swingDuration: 5, maxStops: 15, margin: 2 },
    pistas: [
      { type: 'linear', key: 'swings',        delta: -1, cap:  2, steps:  3 },
      { type: 'linear', key: 'swingDuration', delta: -1, cap:  2, steps:  3 },
      { type: 'linear', key: 'margin',        delta: -1, cap:  0, steps:  2 },
      { type: 'linear', key: 'maxStops',      delta: -1, cap:  3, steps: 12 },
    ],
  },

  // ── Parpadeo ───────────────────────────────────────────────────────────────
  // base: totalSec 10, range 50cs (Nivel 1 = más fácil), margin 3cs, maxStops 10
  // pistas: totalSec -1→3s (7), range [50→25→20→10] (3), margin -1→0 (3), maxStops -1→3 (7)
  // GDD v4.2: multi-parada; range INVERTIDO (50 es fácil, 10 es difícil); maxStops real (sin hidden)
  parpadeo: {
    base: { totalSec: 10, range: 50, margin: 3, maxStops: 10 },
    pistas: [
      { type: 'linear', key: 'totalSec', delta: -1, cap:  3, steps: 7 },
      { type: 'enum',   key: 'range',   values: [50, 25, 20, 10], steps: 3 },
      { type: 'linear', key: 'margin',  delta: -1, cap:  0, steps: 3 },
      { type: 'linear', key: 'maxStops', delta: -1, cap:  3, steps: 7 },
    ],
  },
};

/**
 * Resuelve la config de una prueba a partir del estado de pistas.
 *
 * Firma primaria (GDD v4.2): pistasByParam = { [param]: count }
 *   Cada parámetro se aplica de forma INDEPENDIENTE desde base.
 *
 * Fallback de compatibilidad: si se pasa un number en vez de objeto,
 *   distribuye en ORDEN de catálogo (comportamiento pre-v4.2).
 *   Mantener hasta que PracticeScreen y TestBenchScreen migren al nuevo modelo.
 */
export function resolveConfigFromPistas(probeType, pistasByParam) {
  const catalog = PROBE_PISTAS[probeType];
  if (!catalog) return {};

  const config = { ...catalog.base };

  // Fallback: llamadas antiguas pasan un number (Práctica/Banco aún no migradas)
  if (typeof pistasByParam === 'number') {
    let remaining = Math.max(0, Math.min(20, pistasByParam));
    for (const pista of catalog.pistas) {
      if (remaining <= 0) break;
      const consume = Math.min(remaining, pista.steps);
      remaining -= consume;
      if (pista.type === 'enum') {
        config[pista.key] = pista.values[Math.min(consume, pista.values.length - 1)];
      } else {
        const raw = config[pista.key] + pista.delta * consume;
        config[pista.key] = pista.delta < 0
          ? Math.max(pista.cap, raw)
          : Math.min(pista.cap, raw);
      }
    }
    return config;
  }

  // Camino primario: objeto por parámetro
  for (const pista of catalog.pistas) {
    const count = Math.max(0, Math.min(pista.steps, pistasByParam[pista.key] ?? 0));
    if (count === 0) continue; // base ya tiene el valor correcto
    if (pista.type === 'enum') {
      config[pista.key] = pista.values[Math.min(count, pista.values.length - 1)];
    } else {
      const raw = config[pista.key] + pista.delta * count;
      config[pista.key] = pista.delta < 0
        ? Math.max(pista.cap, raw)
        : Math.min(pista.cap, raw);
    }
  }

  return config;
}

/** Devuelve el tope de steps de cada parámetro: { [param]: steps }. */
export function getParamCaps(probeType) {
  const catalog = PROBE_PISTAS[probeType];
  if (!catalog) return {};
  return Object.fromEntries(catalog.pistas.map(p => [p.key, p.steps]));
}

/**
 * Lista los parámetros que aún NO están al tope.
 * Usado por la pantalla de elección de pista para construir la oferta.
 */
export function listUpgradeableParams(probeType, pistasByParam) {
  const catalog = PROBE_PISTAS[probeType];
  if (!catalog) return [];
  return catalog.pistas
    .filter(p => (pistasByParam[p.key] ?? 0) < p.steps)
    .map(p => p.key);
}
