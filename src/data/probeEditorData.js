/**
 * Datos compartidos para el editor y el banco de pruebas.
 * DEFAULT_CONFIGS, PROBE_FAMILIES, PROBE_LABELS, AURA_DESC.
 */

export const DEFAULT_CONFIGS = {
  bingo:           { targets: 5, margin: 0, timeLimitSec: 20, showVisualAid: false },
  xopportunities:  { numTargets: 3, required: 1, margin: 0, totalSec: 10, showVisualAid: false },
  suma100:         { timeLimitSec: 30, maxResets: 5, targetSum: 100, showVisualAid: false },
  espejo:          { duration: 10, maxStops: 10, margin: 3, requiredHits: 1 },
  pendulo:         { swings: 5, swingDuration: 3, margin: 2, maxStops: null, requiredHits: 1, showVisualAid: false },
  parpadeo:        { margin: 5, visibleMs: 500, hiddenMs: 1500, totalSec: 15 },
  memoria:         { totalSec: 10, delayMs: 3000, visibleMs: 1500, margin: 5 },
  ciego:           { margin: 5, visibleSec: 3, totalSec: 10 },
  cadena:          { links: 4, timeSec: 12, reductionSec: 2, margin: 5 },
  cuentainterna:   { targetSec: 5, margin: 0.30, attempts: 2 },
  cadenciafantasma:{ travelSec: 4, margin: 0.25 },
  cargaenergia:    { targetSec: 5, margin: 0.30, barCurve: 'log' },
  ecovisual:       { lights: 3, cycleMostra: 2, intervalMs: 1000, marginMs: 200 },
  poliritmo:       { intervalA: 800, intervalB: 1200, totalSec: 12, required: 1, marginMs: 200 },
  sincroniafase:   { revolutions: 3, required: 1, periodMs: 3000, marginMs: 150, fixedAngleDeg: 90 },
  rebote:          { margin: 5, delayMs: 500, showDelay: true, totalSec: 10 },
  equilibrio:      { minVal: 40, maxVal: 60, durationSec: 30, initialVal: 50 },
  banca:           { slots: 5, minTarget: 80, maxTarget: 120, totalSec: 60, discards: 0 },
  doblenada:       { maxStops: 3, explosionLimit: 9.00, targetIdeal: 8.50, margin: 0.30, totalSec: 10 },
  pacto:           { coins: 5, costPerSec: 1, totalSec: 10, attempts: 2 },
};

export const PROBE_FAMILIES = [
  { id: '4.1', name: 'Cronómetro Clásico',     probes: ['bingo','espejo','pendulo','parpadeo','memoria','ciego','cadena'] },
  { id: '4.2', name: 'Predicción y Duración',   probes: ['cuentainterna','cadenciafantasma','cargaenergia'] },
  { id: '4.3', name: 'Ritmo y Sincronización',  probes: ['ecovisual','poliritmo','sincroniafase'] },
  { id: '4.4', name: 'Percepción Alterada',     probes: ['rebote'] },
  { id: '4.5', name: 'Acumulación y Control',   probes: ['suma100','equilibrio','banca','doblenada'] },
  { id: '4.6', name: 'Azar y Estrategia',       probes: ['xopportunities','pacto'] },
];

export const PROBE_LABELS = {
  bingo: 'Bingo a Tiempo', xopportunities: 'X Oportunidades', suma100: 'Suma 100',
  espejo: 'Espejo', pendulo: 'Péndulo', parpadeo: 'Parpadeo',
  memoria: 'Memoria', ciego: 'Ciego', cadena: 'Cadena',
  cuentainterna: 'Cuenta Interna', cadenciafantasma: 'Cadencia Fantasma',
  cargaenergia: 'Carga de Energía', ecovisual: 'Eco Visual', poliritmo: 'Poliritmo',
  sincroniafase: 'Sincronía de Fase', rebote: 'Rebote', equilibrio: 'Equilibrio',
  banca: 'Banca', doblenada: 'Doble o Nada', pacto: 'Pacto',
};

export const AURA_DESC = {
  bingo:             'Parar en .{n} → +1 al margen.',
  xopportunities:    'Tocar en .{n} → +2 centésimas al margen (apilable).',
  suma100:           'Parar en .{n} → +2 al margen de victoria (persiste entre resets).',
  espejo:            'Parar en .{n} → +1 al margen.',
  pendulo:           'Parar en .{n} → +1 al margen.',
  parpadeo:          'Parar en .{n} → ±2 al margen.',
  memoria:           'Parar en .{n} → +5 al margen.',
  ciego:             'Parar en .{n} → +5 al margen.',
  cadena:            'Parar en .{n} → +1s extra al siguiente eslabón.',
  cuentainterna:     'Tocar en centésima .{n} → +0.1s al margen.',
  cadenciafantasma:  'Tocar en centésima .{n} → +0.1s al margen.',
  cargaenergia:      'Soltar en centésima .{n} → +0.1s al margen.',
  ecovisual:         'Pulsar en centésima .{n} → ese golpe con margen extra.',
  poliritmo:         'Pulsar en centésima .{n} → margen ×2 para ese golpe.',
  sincroniafase:     'Tocar en centésima .{n} → +50ms al margen.',
  rebote:            'Parar (antes del delay) en .{n} → +5 al margen.',
  equilibrio:        'Parar en .{n} → parada gratis, el valor no cambia.',
  banca:             'Parar en .{n} → esa parada se revela inmediatamente.',
  doblenada:         'Parar en .{n} → ese valor se divide entre 2.',
  pacto:             'Si el stop aterriza en .{n} → +1 moneda devuelta.',
};
