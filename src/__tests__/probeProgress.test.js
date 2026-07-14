/**
 * Tests: probeProgress model v4.2 — makeProbeProgress, resetCharactersProbeProgress,
 *        applyAddPista (por parámetro), migrateCharactersProbeProgress (v4 compat).
 */
import { describe, it, expect } from 'vitest';
import {
  makeProbeProgress,
  migrateCharactersProbeProgress,
  resetCharactersProbeProgress,
  applyAddPista,
} from '../store/collectionSlice.js';
import { PROBE_TYPES } from '../components/probes/probeRegistry.js';
import { PROBE_PISTAS } from '../data/probePistas.js';

const CATALOG_TYPES = Object.keys(PROBE_PISTAS);

// ── makeProbeProgress ───────────────────────────────────────────────────────

describe('makeProbeProgress', () => {
  it('contiene los 20 tipos de prueba', () => {
    const pp = makeProbeProgress();
    expect(Object.keys(pp)).toHaveLength(20);
    for (const t of PROBE_TYPES) expect(pp).toHaveProperty(t);
  });

  it('tipos con catálogo → objeto con params a 0', () => {
    const pp = makeProbeProgress();
    for (const t of CATALOG_TYPES) {
      expect(typeof pp[t]).toBe('object');
      for (const p of PROBE_PISTAS[t].pistas) {
        expect(pp[t][p.key]).toBe(0);
      }
    }
  });

  it('tipos sin catálogo → objeto vacío {}', () => {
    const pp = makeProbeProgress();
    for (const t of PROBE_TYPES) {
      if (!PROBE_PISTAS[t]) {
        expect(pp[t]).toEqual({});
      }
    }
  });
});

// ── resetCharactersProbeProgress (v5) ───────────────────────────────────────

describe('resetCharactersProbeProgress', () => {
  it('resetea probeProgress numérico viejo al nuevo formato por parámetro', () => {
    const chars = {
      c1: { id: 'c1', probeProgress: { bingo: 7, parpadeo: 15, pendulo: 3 } },
    };
    const result = resetCharactersProbeProgress(chars);
    // bingo debe ser objeto con params a 0, no número
    expect(typeof result.c1.probeProgress.bingo).toBe('object');
    expect(result.c1.probeProgress.bingo.targets).toBe(0);
    expect(result.c1.probeProgress.parpadeo.range).toBe(0);
  });

  it('no machacha otros campos del personaje', () => {
    const chars = { c1: { id: 'c1', name: 'Test', grade: 5, probeProgress: { bingo: 3 } } };
    const result = resetCharactersProbeProgress(chars);
    expect(result.c1.name).toBe('Test');
    expect(result.c1.grade).toBe(5);
  });

  it('es idempotente — ejecutar dos veces da el mismo resultado', () => {
    const chars = { c1: { id: 'c1', probeProgress: makeProbeProgress() } };
    const once  = resetCharactersProbeProgress(chars);
    const twice = resetCharactersProbeProgress(once);
    expect(twice).toEqual(once);
  });

  it('funciona sin probeProgress previo', () => {
    const chars = { c1: { id: 'c1', name: 'Sin Progress' } };
    const result = resetCharactersProbeProgress(chars);
    expect(result.c1.probeProgress).toBeDefined();
    expect(typeof result.c1.probeProgress.bingo).toBe('object');
  });
});

// ── migrateCharactersProbeProgress (v4 compat) ──────────────────────────────

describe('migrateCharactersProbeProgress (v4 compat)', () => {
  it('añade probeProgress a personaje sin él', () => {
    const char = { id: 'c1', name: 'Test', grade: 1 };
    const result = migrateCharactersProbeProgress({ c1: char });
    expect(result.c1.probeProgress).toBeDefined();
    expect(Object.keys(result.c1.probeProgress)).toHaveLength(20);
  });

  it('es idempotente con formato nuevo', () => {
    const chars = { c1: { id: 'c1', probeProgress: makeProbeProgress() } };
    const once  = migrateCharactersProbeProgress(chars);
    const twice = migrateCharactersProbeProgress(once);
    expect(twice).toEqual(once);
  });
});

// ── applyAddPista (por parámetro) ───────────────────────────────────────────

describe('applyAddPista', () => {
  it('incrementa el parámetro dado', () => {
    const chars = { c1: { id: 'c1', probeProgress: makeProbeProgress() } };
    const result = applyAddPista(chars, 'c1', 'bingo', 'targets');
    expect(result.c1.probeProgress.bingo.targets).toBe(1);
  });

  it('topa en el cap (steps) del parámetro — bingo targets cap = 7', () => {
    let chars = { c1: { id: 'c1', probeProgress: makeProbeProgress() } };
    for (let i = 0; i < 10; i++) {
      chars = applyAddPista(chars, 'c1', 'bingo', 'targets');
    }
    expect(chars.c1.probeProgress.bingo.targets).toBe(7); // cap = 7, no 20
  });

  it('topa parpadeo maxStops en 7 (no en 20)', () => {
    let chars = { c1: { id: 'c1', probeProgress: makeProbeProgress() } };
    for (let i = 0; i < 10; i++) {
      chars = applyAddPista(chars, 'c1', 'parpadeo', 'maxStops');
    }
    expect(chars.c1.probeProgress.parpadeo.maxStops).toBe(7);
  });

  it('no modifica otros parámetros de la misma prueba', () => {
    const chars = { c1: { id: 'c1', probeProgress: makeProbeProgress() } };
    const result = applyAddPista(chars, 'c1', 'bingo', 'targets');
    expect(result.c1.probeProgress.bingo.margin).toBe(0);
    expect(result.c1.probeProgress.bingo.timeLimitSec).toBe(0);
    expect(result.c1.probeProgress.bingo.maxStops).toBe(0);
  });

  it('no modifica otras pruebas', () => {
    const chars = { c1: { id: 'c1', probeProgress: makeProbeProgress() } };
    const result = applyAddPista(chars, 'c1', 'bingo', 'targets');
    expect(result.c1.probeProgress.espejo.requiredHits).toBe(0);
    expect(result.c1.probeProgress.parpadeo.range).toBe(0);
  });

  it('no-op para characterId desconocido — devuelve misma referencia', () => {
    const chars = { c1: { id: 'c1', probeProgress: makeProbeProgress() } };
    const result = applyAddPista(chars, 'NONEXISTENT', 'bingo', 'targets');
    expect(result).toBe(chars);
  });

  it('no-op para param desconocido — devuelve misma referencia', () => {
    const chars = { c1: { id: 'c1', probeProgress: makeProbeProgress() } };
    const result = applyAddPista(chars, 'c1', 'bingo', 'camposInexistente');
    expect(result).toBe(chars);
  });

  it('no-op si ya está al tope — devuelve misma referencia', () => {
    let chars = { c1: { id: 'c1', probeProgress: makeProbeProgress() } };
    for (let i = 0; i < 7; i++) chars = applyAddPista(chars, 'c1', 'bingo', 'targets');
    const atCap = applyAddPista(chars, 'c1', 'bingo', 'targets');
    expect(atCap).toBe(chars);
  });
});

// ── Migración v5: personaje con probeProgress numérico ──────────────────────

describe('Migración v5 — probeProgress numérico viejo reseteado', () => {
  it('personaje con { bingo: 12 } queda con { bingo: { targets:0,... } }', () => {
    const oldChar = {
      id: 'old1', name: 'Viejo',
      probeProgress: { bingo: 12, espejo: 7, pendulo: 0, parpadeo: 20 },
    };
    const result = resetCharactersProbeProgress({ old1: oldChar });
    const pp = result.old1.probeProgress;
    expect(pp.bingo).toEqual({ targets: 0, margin: 0, timeLimitSec: 0, maxStops: 0 });
    expect(pp.parpadeo).toEqual({ totalSec: 0, range: 0, margin: 0, maxStops: 0 });
    expect(pp.espejo).toEqual({ requiredHits: 0, maxStops: 0, duration: 0, margin: 0 });
  });

  it('resultado es idempotente — re-ejecutar no cambia nada', () => {
    const chars = { c1: { id: 'c1', probeProgress: { bingo: 5 } } };
    const once  = resetCharactersProbeProgress(chars);
    const twice = resetCharactersProbeProgress(once);
    expect(twice).toEqual(once);
  });
});
