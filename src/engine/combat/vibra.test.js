// npx vitest run src/engine/combat/vibra.test.js --reporter verbose
import { describe, it, expect } from 'vitest';
import { resolveVibra } from './vibra.js';

// GDD v0.9: margen 'both' = max(attribute, 2) a cada lado.
// attribute:8, margin=8, ventana +-8 centesimas.
// target:50 -> Flow en 0.50, 1.50, 2.50...
//   Vibra: ctms [42,49] o [51,58]  (|signed| <= 8)
//   Fail:  ctms [22,41] o [59,78]  (dist <= 20)
//   Pifia: ctms [0,21]  o [79,99]  (dist > 20)
const BASE = {
  mode: 'centesimas',
  target: 50,
  attribute: 8,
  pifiaMargin: 20,
  baseDamage: 5,
  marginSide: 'both',
};

describe('resolveVibra — modo centesimas (marginSide: both)', () => {

  it('Flow exacto diff===0, multiplier 2', () => {
    const r = resolveVibra({ ...BASE, stopTime: 500 });
    expect(r.result).toBe('flow');
    expect(r.multiplier).toBe(2);
  });

  it('Flow segundo 0: bonusTiempo=5, finalValue=15', () => {
    const r = resolveVibra({ ...BASE, stopTime: 500 });
    expect(r.bonusTiempo).toBe(5);
    expect(r.finalValue).toBe(15); // 5×2 + 5
  });

  it('Vibra borde exacto antes (±8, ctms=42)', () => {
    // signed=-8, |8|<=8 → vibra
    const r = resolveVibra({ ...BASE, stopTime: 420 });
    expect(r.result).toBe('vibra');
    expect(r.multiplier).toBe(1);
  });

  it('Vibra borde exacto después (±8, ctms=58)', () => {
    // signed=+8, 8<=8 → vibra
    const r = resolveVibra({ ...BASE, stopTime: 580 });
    expect(r.result).toBe('vibra');
    expect(r.multiplier).toBe(1);
  });

  it('finalValue = baseDamage + bonusTiempo en Flow segundo 2', () => {
    const r = resolveVibra({ ...BASE, stopTime: 2500 }); // 2.50s → segundo 2
    expect(r.result).toBe('flow');
    expect(r.bonusTiempo).toBe(3);
    expect(r.finalValue).toBe(13); // 5×2 + 3
  });

  it('Un centésima más allá del borde → fail (ctms=41)', () => {
    // signed=-9, dist=1<=20 → fail
    const r = resolveVibra({ ...BASE, stopTime: 410 });
    expect(r.result).toBe('fail');
    expect(r.multiplier).toBe(0);
    expect(r.finalValue).toBe(0);
    expect(r.bonusTiempo).toBe(0);
  });

  it('Fail en segundo 0: bonusTiempo=0 aunque segundo sea 0', () => {
    // ctms=35, signed=-15, dist=7<=20 → fail, second=0
    const r = resolveVibra({ ...BASE, stopTime: 350 });
    expect(r.result).toBe('fail');
    expect(r.bonusTiempo).toBe(0);
  });

  it('Pifia: dist > pifiaMargin (ctms=20, dist=22)', () => {
    // signed=-30, dist=30-8=22 > 20 → pifia
    const r = resolveVibra({ ...BASE, stopTime: 200 });
    expect(r.result).toBe('pifia');
  });

  it('Timeout: stopTime null → timeout', () => {
    const r = resolveVibra({ ...BASE, stopTime: null });
    expect(r.result).toBe('timeout');
    expect(r.finalValue).toBe(0);
    expect(r.timeSpent).toBe(0);
  });

  it('Bonus tiempo: 0.xx→5, 1.xx→4, 4.xx→1, 5.xx→0', () => {
    expect(resolveVibra({ ...BASE, stopTime: 500  }).bonusTiempo).toBe(5);
    expect(resolveVibra({ ...BASE, stopTime: 1500 }).bonusTiempo).toBe(4);
    expect(resolveVibra({ ...BASE, stopTime: 4500 }).bonusTiempo).toBe(1);
    expect(resolveVibra({ ...BASE, stopTime: 5500 }).bonusTiempo).toBe(0);
  });

  it('auraGain incluye bonusTiempo: flow→2+b, vibra→1+b, fail→0, pifia→-1, timeout→0', () => {
    // flow en 0s: 2+5=7
    expect(resolveVibra({ ...BASE, stopTime: 500  }).auraGain).toBe(7);
    // vibra en 0s: 1+5=6
    expect(resolveVibra({ ...BASE, stopTime: 420  }).auraGain).toBe(6);
    // flow en 2s: 2+3=5
    expect(resolveVibra({ ...BASE, stopTime: 2500 }).auraGain).toBe(5);
    // fail: 0
    expect(resolveVibra({ ...BASE, stopTime: 410  }).auraGain).toBe(0);
    // pifia: -1
    expect(resolveVibra({ ...BASE, stopTime: 200  }).auraGain).toBe(-1);
    // timeout: 0
    expect(resolveVibra({ ...BASE, stopTime: null }).auraGain).toBe(0);
  });

  it('mínimo garantizado ±2: attribute=1 → margin=2', () => {
    // attr=1, margin=max(1,2)=2, target=50
    // ctms=52, signed=+2, 2<=2 → vibra
    const r = resolveVibra({ ...BASE, attribute: 1, stopTime: 520 });
    expect(r.result).toBe('vibra');
    // ctms=53, signed=+3, dist=1<=20 → fail
    const r2 = resolveVibra({ ...BASE, attribute: 1, stopTime: 530 });
    expect(r2.result).toBe('fail');
  });

  it('attribute=7 → margin=7: borde ±7, ctms=57 vibra, ctms=58 fail', () => {
    const r = resolveVibra({ ...BASE, attribute: 7, stopTime: 570 });
    expect(r.result).toBe('vibra');
    const r2 = resolveVibra({ ...BASE, attribute: 7, stopTime: 580 });
    expect(r2.result).toBe('fail');
  });
});

describe('resolveVibra — marginSide: before', () => {
  const BEFORE = { ...BASE, marginSide: 'before' };
  // attribute=8, before=8 (total), after=0

  it('Vibra antes del objetivo (borde: signed=-8)', () => {
    const r = resolveVibra({ ...BEFORE, stopTime: 420 });
    expect(r.result).toBe('vibra');
  });

  it('Flow exacto funciona', () => {
    const r = resolveVibra({ ...BEFORE, stopTime: 500 });
    expect(r.result).toBe('flow');
  });

  it('1 centésima DESPUÉS del objetivo → fail inmediato', () => {
    const r = resolveVibra({ ...BEFORE, stopTime: 510 });
    expect(r.result).toBe('fail');
  });

  it('21 centésimas después → pifia', () => {
    const r = resolveVibra({ ...BEFORE, stopTime: 710 });
    expect(r.result).toBe('pifia');
  });
});

describe('resolveVibra — marginSide: after', () => {
  const AFTER = { ...BASE, marginSide: 'after' };
  // attribute=8, before=0, after=8

  it('Vibra después del objetivo (borde: signed=+8)', () => {
    const r = resolveVibra({ ...AFTER, stopTime: 580 });
    expect(r.result).toBe('vibra');
  });

  it('1 centésima ANTES del objetivo → fail inmediato', () => {
    const r = resolveVibra({ ...AFTER, stopTime: 490 });
    expect(r.result).toBe('fail');
  });

  it('Muy antes → pifia', () => {
    const r = resolveVibra({ ...AFTER, stopTime: 200 });
    expect(r.result).toBe('pifia');
  });
});

describe('resolveVibra — modo punto', () => {
  // attribute=8, margin=max(8,2)=8
  // signed = (stopTime - 3500) / 10
  const PUNTO = { mode: 'punto', target: 3500, attribute: 8, pifiaMargin: 20, baseDamage: 4 };

  it('Flow exacto', () => {
    const r = resolveVibra({ ...PUNTO, stopTime: 3500 });
    expect(r.result).toBe('flow');
    expect(r.multiplier).toBe(2);
  });

  it('Vibra borde exacto (signed=+8, ctms=3580)', () => {
    // (3580-3500)/10=8, 8<=8 → vibra
    const r = resolveVibra({ ...PUNTO, stopTime: 3580 });
    expect(r.result).toBe('vibra');
  });

  it('No hay bonusTiempo en modo punto', () => {
    const r = resolveVibra({ ...PUNTO, stopTime: 3500 });
    expect(r.bonusTiempo).toBe(0);
    expect(r.finalValue).toBe(8); // 4×2 + 0
  });

  it('Fail fuera del margen pero dentro de pifiaMargin', () => {
    // (3600-3500)/10=10, dist=10-8=2<=20 → fail
    const r = resolveVibra({ ...PUNTO, stopTime: 3600 });
    expect(r.result).toBe('fail');
  });

  it('Pifia en modo punto (signed=40, dist=32>20)', () => {
    // (3900-3500)/10=40, dist=40-8=32>20 → pifia
    const r = resolveVibra({ ...PUNTO, stopTime: 3900 });
    expect(r.result).toBe('pifia');
  });
});
