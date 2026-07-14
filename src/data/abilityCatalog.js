/**
 * Catálogo de habilidades — GDD v4.0 §5.
 * Nivel 1: pool básico general (5 pasivas + 5 activas + 5 Aura).
 * Habilidades específicas por prueba se añaden por familias (pendiente).
 */

export const ABILITY_CATALOG = [
  // ── Pasivas Generales ─────────────────────────────────────────────────────
  {
    id: 'pg01', name: 'Vitalidad',
    description: '+1 vida al empezar la run',
    kind: 'passive', scope: 'general', unlockLevel: 1,
  },
  {
    id: 'pg02', name: 'Margen amplio',
    description: 'Margen de acierto +5 centésimas en todas las pruebas',
    kind: 'passive', scope: 'general', unlockLevel: 1,
  },
  {
    id: 'pg03', name: 'Sin prisa',
    description: 'Tiempo límite +10 segundos en todas las pruebas',
    kind: 'passive', scope: 'general', unlockLevel: 1,
  },
  {
    id: 'pg04', name: 'Resistencia',
    description: 'El primer fallo de la run no quita vida',
    kind: 'passive', scope: 'general', unlockLevel: 1,
  },
  {
    id: 'pg05', name: 'Fragmentos rápidos',
    description: 'Residuos Temporales se generan con 2 fallos en lugar de 3',
    kind: 'passive', scope: 'general', unlockLevel: 1,
  },

  // ── Activas Generales ─────────────────────────────────────────────────────
  {
    id: 'ag01', name: 'Cámara lenta',
    description: 'Reduce la velocidad del cronómetro al 50% durante 5s',
    kind: 'active', scope: 'general', unlockLevel: 1,
  },
  {
    id: 'ag02', name: 'Vista previa',
    description: 'Ver objetivos de la próxima prueba 3s antes de empezar',
    kind: 'active', scope: 'general', unlockLevel: 1,
  },
  {
    id: 'ag03', name: 'Segunda oportunidad',
    description: 'Repetir la prueba actual sin perder vida',
    kind: 'active', scope: 'general', unlockLevel: 1,
  },
  {
    id: 'ag04', name: 'Tiempo extra',
    description: '+15s al tiempo límite de la prueba actual',
    kind: 'active', scope: 'general', unlockLevel: 1,
  },
  {
    id: 'ag05', name: 'Escudo temporal',
    description: 'Convertir el siguiente fallo en prueba superada (sin bonus)',
    kind: 'active', scope: 'general', unlockLevel: 1,
  },

  // ── Aura Generales ────────────────────────────────────────────────────────
  {
    id: 'aug01', name: 'Revive',
    description: 'Recuperar 1 vida',
    kind: 'aura', scope: 'general', unlockLevel: 1,
  },
  {
    id: 'aug02', name: 'Habilidad libre',
    description: 'Activar la habilidad activa gratis (sin gastar el uso)',
    kind: 'aura', scope: 'general', unlockLevel: 1,
  },
  {
    id: 'aug03', name: 'Eco de oro',
    description: 'El siguiente eco es de rareza superior',
    kind: 'aura', scope: 'general', unlockLevel: 1,
  },
  {
    id: 'aug04', name: 'Tiempo bonus',
    description: '+5s al tiempo límite de la prueba actual',
    kind: 'aura', scope: 'general', unlockLevel: 1,
  },
  {
    id: 'aug05', name: 'Prueba fantasma',
    description: 'La próxima prueba cuenta como superada automáticamente si la superas 2 veces en la misma run',
    kind: 'aura', scope: 'general', unlockLevel: 1,
  },

  // ─── B2: Familias 4.1 Precisión + 4.5 Cálculo + Cadena (unlockLevel 5) ─────

  // Bingo
  { id: 'bingo_p',  name: 'Puntería',           kind: 'passive', scope: 'bingo',           unlockLevel: 5, description: 'Margen de acierto +3 en Bingo',                                  hook: { marginDelta: 3 } },
  { id: 'bingo_a',  name: 'Congelación',         kind: 'active',  scope: 'bingo',           unlockLevel: 5, description: 'Congela los objetivos de Bingo durante 2s',                    hook: { freezeTargetsMs: 2000 } },
  { id: 'bingo_au', name: 'Golpe certero',        kind: 'aura',    scope: 'bingo',           unlockLevel: 5, description: 'El siguiente impacto en Bingo cuenta como acierto automático', hook: { autoHitNext: true } },

  // X Oportunidades
  { id: 'xopportunities_p',  name: 'Objetivo extra',      kind: 'passive', scope: 'xopportunities', unlockLevel: 5, description: '+1 objetivo disponible en X Oportunidades',               hook: { numTargetsDelta: 1 } },
  { id: 'xopportunities_a',  name: 'Captura segura',      kind: 'active',  scope: 'xopportunities', unlockLevel: 5, description: 'La próxima captura en X Oportunidades está garantizada', hook: { nextCaptureGuaranteed: true } },
  { id: 'xopportunities_au', name: 'Exigencia reducida',  kind: 'aura',    scope: 'xopportunities', unlockLevel: 5, description: 'Necesitas 1 captura menos para superar X Oportunidades', hook: { requiredDelta: -1 } },

  // Suma 100
  { id: 'suma100_p',  name: 'Intentos extra',   kind: 'passive', scope: 'suma100', unlockLevel: 5, description: '+1 reset disponible en Suma 100',                    hook: { maxResetsDelta: 1 } },
  { id: 'suma100_a',  name: 'Reset seguro',      kind: 'active',  scope: 'suma100', unlockLevel: 5, description: 'El siguiente reset en Suma 100 no penaliza',         hook: { safeNextReset: true } },
  { id: 'suma100_au', name: 'Ventaja inicial',   kind: 'aura',    scope: 'suma100', unlockLevel: 5, description: 'Empieza Suma 100 con 10 puntos en el marcador',      hook: { startingScore: 10 } },

  // Cadena
  { id: 'cadena_p',  name: 'Primer eslabón libre',   kind: 'passive', scope: 'cadena', unlockLevel: 5, description: 'El primer eslabón de Cadena siempre cuenta aunque falle',       hook: { graceFirstLink: true } },
  { id: 'cadena_a',  name: 'Eslabón extendido',       kind: 'active',  scope: 'cadena', unlockLevel: 5, description: '+3s al tiempo de cada eslabón en Cadena',                     hook: { extraLinkSec: 3 } },
  { id: 'cadena_au', name: 'Eslabón garantizado',     kind: 'aura',    scope: 'cadena', unlockLevel: 5, description: 'El siguiente eslabón de Cadena se supera automáticamente',     hook: { autoPassNextLink: true } },

  // Memoria
  { id: 'memoria_p',  name: 'Memoria vívida',     kind: 'passive', scope: 'memoria', unlockLevel: 5, description: 'Los objetivos de Memoria son visibles 500ms extra',  hook: { visibleMsDelta: 500 } },
  { id: 'memoria_a',  name: 'Revelación',          kind: 'active',  scope: 'memoria', unlockLevel: 5, description: 'Revela los objetivos de Memoria durante 1500ms',     hook: { activeRevealMs: 1500 } },
  { id: 'memoria_au', name: 'Destello de memoria', kind: 'aura',    scope: 'memoria', unlockLevel: 5, description: 'El aura revela los objetivos de Memoria durante 1000ms', hook: { auraRevealMs: 1000 } },

  // Ciego
  { id: 'ciego_p',  name: 'Vista ampliada', kind: 'passive', scope: 'ciego', unlockLevel: 5, description: 'El número es visible 1s extra en Ciego',          hook: { visibleSecDelta: 1 } },
  { id: 'ciego_a',  name: 'Relumbre',       kind: 'active',  scope: 'ciego', unlockLevel: 5, description: 'Muestra el número de Ciego durante 2s extra',     hook: { extraVisibleSec: 2 } },
  { id: 'ciego_au', name: 'Flash ciego',    kind: 'aura',    scope: 'ciego', unlockLevel: 5, description: 'El aura revela el número de Ciego durante 1s',    hook: { auraRevealSec: 1 } },

  // Péndulo
  { id: 'pendulo_p',  name: 'Dirección visible', kind: 'passive', scope: 'pendulo', unlockLevel: 5, description: 'Muestra flecha indicando la dirección del péndulo', hook: { showDirectionArrow: true } },
  { id: 'pendulo_a',  name: 'Péndulo lento',     kind: 'active',  scope: 'pendulo', unlockLevel: 5, description: 'Reduce la velocidad del péndulo al 67%',            hook: { swingSpeedMultiplier: 0.667 } },
  { id: 'pendulo_au', name: 'Zona dulce',         kind: 'aura',    scope: 'pendulo', unlockLevel: 5, description: 'Muestra la zona de acierto óptima del péndulo',    hook: { showSweetSpot: true } },

  // Rebote
  { id: 'rebote_p',  name: 'Anticipo',     kind: 'passive', scope: 'rebote', unlockLevel: 5, description: 'Muestra el tiempo de rebote antes de que ocurra',         hook: { showDelay: true } },
  { id: 'rebote_a',  name: 'Sin rebote',   kind: 'active',  scope: 'rebote', unlockLevel: 5, description: 'Elimina el tiempo de rebote en la siguiente parada',       hook: { skipDelay: true } },
  { id: 'rebote_au', name: 'Margen doble', kind: 'aura',    scope: 'rebote', unlockLevel: 5, description: 'Duplica el margen de acierto en Rebote',                   hook: { marginMultiplier: 2 } },

  // Espejo
  { id: 'espejo_p',  name: 'Reflejo ampliado', kind: 'passive', scope: 'espejo', unlockLevel: 5, description: 'Margen de acierto +2 en Espejo',                             hook: { marginDelta: 2 } },
  { id: 'espejo_a',  name: 'Parada automática',kind: 'active',  scope: 'espejo', unlockLevel: 5, description: 'La próxima parada en Espejo cuenta como acierto automático', hook: { autoHitNextStop: true } },
  { id: 'espejo_au', name: 'Menos exigente',   kind: 'aura',    scope: 'espejo', unlockLevel: 5, description: 'Necesitas 1 acierto menos para superar Espejo',              hook: { requiredHitsDelta: -1 } },

  // Parpadeo
  { id: 'parpadeo_p',  name: 'Parpadeo lento', kind: 'passive', scope: 'parpadeo', unlockLevel: 5, description: 'Los objetivos de Parpadeo son visibles 150ms extra', hook: { visibleMsDelta: 150 } },
  { id: 'parpadeo_a',  name: 'Visión forzada', kind: 'active',  scope: 'parpadeo', unlockLevel: 5, description: 'Fuerza los objetivos visibles durante 3s',            hook: { forceVisibleSec: 3 } },
  { id: 'parpadeo_au', name: 'Ceguera reducida',kind: 'aura',   scope: 'parpadeo', unlockLevel: 5, description: 'Reduce el tiempo oculto al 60%',                      hook: { hiddenMsMultiplier: 0.6 } },

  // ─── B3: Familias 4.3 Predicción + 4.4 Ritmo y Sincronización (unlockLevel 10) ─

  // Cuenta Interna
  { id: 'cuentainterna_p',  name: 'Estimación refinada', kind: 'passive', scope: 'cuentainterna', unlockLevel: 10, description: 'Margen de acierto +0.2 en Cuenta Interna',         hook: { marginDelta: 0.2 } },
  { id: 'cuentainterna_a',  name: 'Pista numérica',      kind: 'active',  scope: 'cuentainterna', unlockLevel: 10, description: 'Muestra pista numérica del objetivo',              hook: { showNumericalHint: true } },
  { id: 'cuentainterna_au', name: 'Revelación interna',  kind: 'aura',    scope: 'cuentainterna', unlockLevel: 10, description: 'Revela el objetivo de Cuenta Interna durante 1500ms', hook: { revealTargetMs: 1500 } },

  // Cadencia Fantasma
  { id: 'cadenciafantasma_p',  name: 'Camino largo',     kind: 'passive', scope: 'cadenciafantasma', unlockLevel: 10, description: '+2s de recorrido en Cadencia Fantasma',                 hook: { travelSecDelta: 2 } },
  { id: 'cadenciafantasma_a',  name: 'Rastro fantasma',  kind: 'active',  scope: 'cadenciafantasma', unlockLevel: 10, description: 'Muestra rastro visual de la trayectoria',               hook: { showGhostTrail: true } },
  { id: 'cadenciafantasma_au', name: 'Destello objetivo',kind: 'aura',    scope: 'cadenciafantasma', unlockLevel: 10, description: 'Revela la posición objetivo durante 1000ms',             hook: { revealTargetMs: 1000 } },

  // Carga de Energía
  { id: 'cargaenergia_p',  name: 'Curva lineal',    kind: 'passive', scope: 'cargaenergia', unlockLevel: 10, description: 'La barra de Carga de Energía sube de forma lineal', hook: { barCurve: 'linear' } },
  { id: 'cargaenergia_a',  name: 'Zona ampliada',   kind: 'active',  scope: 'cargaenergia', unlockLevel: 10, description: 'Tiempo en zona objetivo se reduce a la mitad',      hook: { targetSecMultiplier: 0.5 } },
  { id: 'cargaenergia_au', name: 'Margen generoso', kind: 'aura',    scope: 'cargaenergia', unlockLevel: 10, description: 'Margen de acierto ×1.5 en Carga de Energía',        hook: { marginMultiplier: 1.5 } },

  // Eco Visual
  { id: 'ecovisual_p',  name: 'Ciclo extendido', kind: 'passive', scope: 'ecovisual', unlockLevel: 10, description: '+1 ciclo de muestra en Eco Visual',          hook: { cycleMostraDelta: 1 } },
  { id: 'ecovisual_a',  name: 'Bucle',            kind: 'active',  scope: 'ecovisual', unlockLevel: 10, description: 'Repite el ciclo de demostración en Eco Visual', hook: { repeatCycle: true } },
  { id: 'ecovisual_au', name: 'Tolerancia extra', kind: 'aura',    scope: 'ecovisual', unlockLevel: 10, description: '+50ms de margen en Eco Visual',                hook: { marginMsBonus: 50 } },

  // Poliritmo
  { id: 'poliritmo_p',  name: 'Ritmo flexible',     kind: 'passive', scope: 'poliritmo', unlockLevel: 10, description: '+50ms de margen en Poliritmo',                              hook: { marginMsDelta: 50 } },
  { id: 'poliritmo_a',  name: 'Toque garantizado',  kind: 'active',  scope: 'poliritmo', unlockLevel: 10, description: 'El próximo toque en Poliritmo cuenta como acierto automático', hook: { nextTapGuaranteed: true } },
  { id: 'poliritmo_au', name: 'Tempo reducido',     kind: 'aura',    scope: 'poliritmo', unlockLevel: 10, description: 'Los intervalos de Poliritmo se amplían ×1.2',                hook: { intervalMultiplier: 1.2 } },

  // Sincronía de Fase
  { id: 'sincroniafase_p',  name: 'Fase tolerante',             kind: 'passive', scope: 'sincroniafase', unlockLevel: 10, description: '+30ms de margen en Sincronía de Fase',                        hook: { marginMsDelta: 30 } },
  { id: 'sincroniafase_a',  name: 'Doble tolerancia',           kind: 'active',  scope: 'sincroniafase', unlockLevel: 10, description: 'Duplica el margen en la siguiente revolución',                hook: { doubleMarginNextRev: true } },
  { id: 'sincroniafase_au', name: 'Sincronización garantizada', kind: 'aura',    scope: 'sincroniafase', unlockLevel: 10, description: 'El siguiente acierto en Sincronía de Fase está garantizado', hook: { guaranteeNextHit: true } },

  // ─── B4: Familias 4.6 Azar + 4.7 Equilibrio Dinámico (unlockLevel 15) ─────

  // Equilibrio
  { id: 'equilibrio_p',  name: 'Rango ampliado',           kind: 'passive', scope: 'equilibrio', unlockLevel: 15, description: 'Rango de valores se amplía 5 en cada extremo', hook: { minValDelta: -5, maxValDelta: 5 } },
  { id: 'equilibrio_a',  name: 'Recentrado',               kind: 'active',  scope: 'equilibrio', unlockLevel: 15, description: 'Resetea el valor de Equilibrio al centro',      hook: { resetToCenterOnUse: true } },
  { id: 'equilibrio_au', name: 'Congelación de equilibrio',kind: 'aura',    scope: 'equilibrio', unlockLevel: 15, description: 'Congela el valor de Equilibrio en su posición', hook: { freezeOnAura: true } },

  // Banca
  { id: 'banca_p',  name: 'Descarte extra', kind: 'passive', scope: 'banca', unlockLevel: 15, description: '+1 descarte disponible en Banca',                          hook: { discardsDelta: 1 } },
  { id: 'banca_a',  name: 'Nuevo reparto',  kind: 'active',  scope: 'banca', unlockLevel: 15, description: 'Reparte nuevas cartas en Banca manteniendo las aceptadas', hook: { rerollOnUse: true } },
  { id: 'banca_au', name: 'Aceptación automática', kind: 'aura', scope: 'banca', unlockLevel: 15, description: 'Acepta automáticamente la siguiente carta en Banca', hook: { auraAutoAccept: true } },

  // Doble o Nada
  { id: 'doblenada_p',  name: 'Margen generoso', kind: 'passive', scope: 'doblenada', unlockLevel: 15, description: 'Margen de acierto ×1.1 en Doble o Nada',                         hook: { marginMultiplier: 1.1 } },
  { id: 'doblenada_a',  name: 'Parada segura',   kind: 'active',  scope: 'doblenada', unlockLevel: 15, description: 'La próxima parada en Doble o Nada no puede ser explosión',       hook: { safeNextStop: true } },
  { id: 'doblenada_au', name: 'Apuesta reducida',kind: 'aura',    scope: 'doblenada', unlockLevel: 15, description: 'El siguiente objetivo de Doble o Nada se reduce a la mitad',     hook: { nextHalved: true } },

  // Pacto
  { id: 'pacto_p',  name: 'Moneda extra',    kind: 'passive', scope: 'pacto', unlockLevel: 15, description: '+1 moneda inicial en Pacto',                                 hook: { coinsDelta: 1 } },
  { id: 'pacto_a',  name: 'Pacto reducido',  kind: 'active',  scope: 'pacto', unlockLevel: 15, description: 'El coste del siguiente intercambio en Pacto se reduce a la mitad', hook: { costReductionFactor: 0.5 } },
  { id: 'pacto_au', name: 'Intento extra',   kind: 'aura',    scope: 'pacto', unlockLevel: 15, description: '+1 intento de intercambio en Pacto',                          hook: { attemptsBonusDelta: 1 } },
];

export const PASSIVE_ABILITIES = ABILITY_CATALOG.filter(a => a.kind === 'passive');
export const ACTIVE_ABILITIES  = ABILITY_CATALOG.filter(a => a.kind === 'active');
export const AURA_ABILITIES    = ABILITY_CATALOG.filter(a => a.kind === 'aura');

/**
 * Returns the probe-specific ability for a given scope and kind.
 */
export function getCatalogAbility(scope, kind) {
  return ABILITY_CATALOG.find(a => a.scope === scope && a.kind === kind) ?? null;
}

/**
 * Returns all catalog abilities for a given probe scope.
 */
export function getCatalogAbilitiesForProbe(scope) {
  return ABILITY_CATALOG.filter(a => a.scope === scope);
}
