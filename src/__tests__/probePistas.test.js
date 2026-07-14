/**
 * Tests: probePistas catalog — resolveConfigFromPistas (object + fallback number),
 *        getParamCaps, listUpgradeableParams, step sums.
 */
import { describe, it, expect } from 'vitest';
import {
  PROBE_PISTAS,
  resolveConfigFromPistas,
  getParamCaps,
  listUpgradeableParams,
} from '../data/probePistas.js';

const PROBE_TYPES = Object.keys(PROBE_PISTAS);

// ── Integridad del catálogo ─────────────────────────────────────────────────

describe('PROBE_PISTAS catalog integrity', () => {
  it.each(PROBE_TYPES)('%s — steps sum exactly 20', (probeType) => {
    const { pistas } = PROBE_PISTAS[probeType];
    const total = pistas.reduce((sum, p) => sum + p.steps, 0);
    expect(total).toBe(20);
  });

  it('parpadeo range values = [50,25,20,10]', () => {
    const range = PROBE_PISTAS.parpadeo.pistas.find(p => p.key === 'range');
    expect(range.values).toEqual([50, 25, 20, 10]);
  });

  it('parpadeo maxStops is a real param (no hidden)', () => {
    const ms = PROBE_PISTAS.parpadeo.pistas.find(p => p.key === 'maxStops');
    expect(ms).toBeDefined();
    expect(ms.hidden).toBeUndefined();
    expect(ms.steps).toBe(7);
  });

  it('parpadeo base range = 50', () => {
    expect(PROBE_PISTAS.parpadeo.base.range).toBe(50);
  });
});

// ── resolveConfigFromPistas — API por objeto (v4.2) ─────────────────────────

describe('resolveConfigFromPistas (object API) — Nivel 1 (todos a 0)', () => {
  it('bingo todos a 0 → base config', () => {
    const cfg = resolveConfigFromPistas('bingo', { targets: 0, margin: 0, timeLimitSec: 0, maxStops: 0 });
    expect(cfg).toEqual({ targets: 3, margin: 3, timeLimitSec: 20, maxStops: 20 });
  });

  it('parpadeo todos a 0 → base config con range 50 y maxStops 10', () => {
    const cfg = resolveConfigFromPistas('parpadeo', { totalSec: 0, range: 0, margin: 0, maxStops: 0 });
    expect(cfg).toEqual({ totalSec: 10, range: 50, margin: 3, maxStops: 10 });
  });

  it('objeto vacío {} → base config (faltan params = 0 implícito)', () => {
    const cfg = resolveConfigFromPistas('bingo', {});
    expect(cfg).toEqual({ targets: 3, margin: 3, timeLimitSec: 20, maxStops: 20 });
  });
});

describe('resolveConfigFromPistas (object API) — corona bingo', () => {
  it('bingo { targets:7, margin:3, timeLimitSec:5, maxStops:5 } → todos al cap', () => {
    const cfg = resolveConfigFromPistas('bingo', { targets: 7, margin: 3, timeLimitSec: 5, maxStops: 5 });
    expect(cfg.targets).toBe(10);      // base 3 + 7*1
    expect(cfg.margin).toBe(0);        // base 3 - 3*1
    expect(cfg.timeLimitSec).toBe(10); // base 20 - 5*2
    expect(cfg.maxStops).toBe(10);     // base 20 - 5*2
  });
});

describe('resolveConfigFromPistas (object API) — parpadeo range', () => {
  it('range:0 → 50 (base, más fácil)', () => {
    expect(resolveConfigFromPistas('parpadeo', { range: 0 }).range).toBe(50);
  });

  it('range:1 → 25', () => {
    expect(resolveConfigFromPistas('parpadeo', { range: 1 }).range).toBe(25);
  });

  it('range:2 → 20', () => {
    expect(resolveConfigFromPistas('parpadeo', { range: 2 }).range).toBe(20);
  });

  it('range:3 → 10 (más difícil)', () => {
    expect(resolveConfigFromPistas('parpadeo', { range: 3 }).range).toBe(10);
  });

  it('parpadeo maxStops:7 → 3 (cap)', () => {
    expect(resolveConfigFromPistas('parpadeo', { maxStops: 7 }).maxStops).toBe(3);
  });

  it('params son independientes — solo range afectado', () => {
    const cfg = resolveConfigFromPistas('parpadeo', { range: 2 });
    expect(cfg.totalSec).toBe(10); // sin tocar
    expect(cfg.margin).toBe(3);    // sin tocar
    expect(cfg.maxStops).toBe(10); // sin tocar
    expect(cfg.range).toBe(20);
  });
});

// ── resolveConfigFromPistas — fallback number (compatibilidad Práctica/Banco) ──

describe('resolveConfigFromPistas (fallback number)', () => {
  it('bingo 0 → base config', () => {
    expect(resolveConfigFromPistas('bingo', 0)).toEqual({ targets: 3, margin: 3, timeLimitSec: 20, maxStops: 20 });
  });

  it('bingo 20 → corona', () => {
    const cfg = resolveConfigFromPistas('bingo', 20);
    expect(cfg.targets).toBe(10);
    expect(cfg.margin).toBe(0);
    expect(cfg.timeLimitSec).toBe(10);
    expect(cfg.maxStops).toBe(10);
  });

  it('bingo 7 → targets maxed, resto sin tocar', () => {
    const cfg = resolveConfigFromPistas('bingo', 7);
    expect(cfg.targets).toBe(10);
    expect(cfg.margin).toBe(3);
    expect(cfg.timeLimitSec).toBe(20);
    expect(cfg.maxStops).toBe(20);
  });

  it('parpadeo 0 → base (range 50, maxStops 10)', () => {
    const cfg = resolveConfigFromPistas('parpadeo', 0);
    expect(cfg).toEqual({ totalSec: 10, range: 50, margin: 3, maxStops: 10 });
  });

  it('parpadeo 8 — 7 steps totalSec + 1 step range → range 25', () => {
    const cfg = resolveConfigFromPistas('parpadeo', 8);
    expect(cfg.totalSec).toBe(3);
    expect(cfg.range).toBe(25); // values[1]
  });

  it('parpadeo 10 — 3 steps range totalmente → range 10', () => {
    const cfg = resolveConfigFromPistas('parpadeo', 10);
    expect(cfg.range).toBe(10); // values[3]
  });

  it('parpadeo 20 → corona', () => {
    const cfg = resolveConfigFromPistas('parpadeo', 20);
    expect(cfg.totalSec).toBe(3);
    expect(cfg.range).toBe(10);
    expect(cfg.margin).toBe(0);
    expect(cfg.maxStops).toBe(3);
  });

  it('clamps to 20 even if passed more', () => {
    const at20 = resolveConfigFromPistas('bingo', 20);
    const at99 = resolveConfigFromPistas('bingo', 99);
    expect(at99).toEqual(at20);
  });
});

// ── getParamCaps ────────────────────────────────────────────────────────────

describe('getParamCaps', () => {
  it('bingo — caps correctos', () => {
    expect(getParamCaps('bingo')).toEqual({
      targets: 7, margin: 3, timeLimitSec: 5, maxStops: 5,
    });
  });

  it('parpadeo — caps correctos', () => {
    expect(getParamCaps('parpadeo')).toEqual({
      totalSec: 7, range: 3, margin: 3, maxStops: 7,
    });
  });

  it('tipo desconocido → {}', () => {
    expect(getParamCaps('fantasma')).toEqual({});
  });
});

// ── listUpgradeableParams ───────────────────────────────────────────────────

describe('listUpgradeableParams', () => {
  it('todos a 0 → todos los params ofertados', () => {
    const params = listUpgradeableParams('bingo', {});
    expect(params).toEqual(['targets', 'margin', 'timeLimitSec', 'maxStops']);
  });

  it('targets al tope → targets excluido', () => {
    const params = listUpgradeableParams('bingo', { targets: 7 });
    expect(params).not.toContain('targets');
    expect(params).toContain('margin');
  });

  it('todos al tope → lista vacía', () => {
    const params = listUpgradeableParams('bingo', { targets: 7, margin: 3, timeLimitSec: 5, maxStops: 5 });
    expect(params).toHaveLength(0);
  });

  it('parpadeo range al tope → range excluido', () => {
    const params = listUpgradeableParams('parpadeo', { range: 3 });
    expect(params).not.toContain('range');
    expect(params).toContain('totalSec');
    expect(params).toContain('maxStops');
  });
});
