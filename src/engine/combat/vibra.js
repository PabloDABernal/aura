/**
 * Margen dinámico: crece de ±2 a ±maxMargin entre t=0 y t=separatorsFromMs.
 * Después se mantiene fijo en maxMargin.
 */
export function getDynamicMargin(elapsedMs, separatorsFromMs, maxMargin) {
  if (maxMargin <= 2 || elapsedMs >= separatorsFromMs) return maxMargin;
  const t = elapsedMs / separatorsFromMs;
  return Math.round(2 + (maxMargin - 2) * t);
}

/**
 * Multiplicador según el segundo en que se para (GDD v1.1 Sección 2).
 * 0.xx → ×2.0, 1.xx → ×1.8 ... 5.xx+ → ×1.0
 */
function secondMultiplier(second) {
  if (second <= 0) return 2.0;
  if (second === 1) return 1.8;
  if (second === 2) return 1.6;
  if (second === 3) return 1.4;
  if (second === 4) return 1.2;
  return 1.0;
}

/**
 * resolveVibra — lógica pura de la prueba de Vibra (SDD sección 4.3, GDD v1.1 Sección 2).
 * Sin React. Mismo input → mismo output.
 *
 * @param {object} params
 * @param {'centesimas'|'punto'} params.mode
 * @param {number}       params.target       - centésimas 0-99 (centesimas) | ms objetivo (punto)
 * @param {number|null}  params.stopTime     - ms parada. null = timeout
 * @param {number}       params.attribute    - atributo del personaje (Presencia/Influencia/margen defensivo)
 * @param {number}       [params.margin]     - margen pre-calculado (sobreescribe attribute para 'both')
 * @param {'both'|'before'|'after'} [params.marginSide='both']
 * @param {number}  [params.pifiaMargin=20]
 * @param {number}  params.baseDamage        - Presencia (confrontar) o Influencia (intervenir)
 * @param {Array}   [params.ecoModifiers=[]]
 * @returns {{ result, multiplier, bonusTiempo, finalValue, timeSpent, auraGain }}
 */
export function resolveVibra({
  mode,
  target,
  stopTime,
  attribute,
  margin,
  marginSide = 'both',
  pifiaMargin = 20,
  baseDamage,
  ecoModifiers = [],
}) {
  if (stopTime === null || stopTime === undefined) {
    return { result: 'timeout', multiplier: 0, bonusTiempo: 0, finalValue: 0, timeSpent: 0, auraGain: 0 };
  }

  const bothMargin = margin !== undefined ? margin : Math.max(attribute, 2);

  let beforeMargin, afterMargin;
  if (marginSide === 'before') {
    beforeMargin = attribute; afterMargin = 0;
  } else if (marginSide === 'after') {
    beforeMargin = 0; afterMargin = attribute;
  } else {
    beforeMargin = bothMargin; afterMargin = bothMargin;
  }

  let signed;
  let second = 0;

  if (mode === 'centesimas') {
    const centesimasParado = Math.floor((stopTime % 1000) / 10);
    signed = centesimasParado - target;
    second = Math.floor(stopTime / 1000);
  } else {
    signed = (stopTime - target) / 10;
    second = Math.floor(stopTime / 1000);
  }

  let result, multiplier;

  // Flow: parada exacta (signed===0) O primer segundo en centésimas (0.xx)
  const isExact = signed === 0;
  const isFirstSecond = mode === 'centesimas' && second === 0;

  if (isExact || isFirstSecond) {
    // Dentro del margen: flow. Fuera del margen: fallo/pifia normal
    const inMargin = (signed <= 0 && Math.abs(signed) <= beforeMargin) || (signed >= 0 && signed <= afterMargin) || signed === 0;
    if (inMargin) {
      result = 'flow'; multiplier = secondMultiplier(second) * 2;
    } else {
      const distFromEdge = signed < 0
        ? Math.abs(signed) - beforeMargin
        : signed - afterMargin;
      result = distFromEdge <= pifiaMargin ? 'fail' : 'pifia';
      multiplier = 0;
    }
  } else if (signed < 0 && Math.abs(signed) <= beforeMargin) {
    result = 'vibra'; multiplier = secondMultiplier(second);
  } else if (signed > 0 && signed <= afterMargin) {
    result = 'vibra'; multiplier = secondMultiplier(second);
  } else {
    const distFromEdge = signed < 0
      ? Math.abs(signed) - beforeMargin
      : signed - afterMargin;
    result = distFromEdge <= pifiaMargin ? 'fail' : 'pifia';
    multiplier = 0;
  }

  const finalValue = multiplier > 0 ? Math.round(baseDamage * multiplier) : 0;

  return {
    result,
    multiplier,
    bonusTiempo: 0,
    finalValue,
    timeSpent: stopTime,
    auraGain: 0,
  };
}

/** ms que suma al tiempo de Vibración al usar Acción Segura. SDD sección 4.4. */
export const ACCION_SEGURA_TIME = 3000;

/**
 * Acción Segura: daño fijo sin cronómetro.
 * baseDamage = Presencia (confrontar) o Influencia (intervenir).
 */
export function resolveAccionSegura(baseDamage) {
  return {
    result:      'accion_segura',
    multiplier:  1,
    bonusTiempo: 0,
    finalValue:  baseDamage,
    timeSpent:   ACCION_SEGURA_TIME,
    auraGain:    0,
  };
}

/**
 * Devuelve { before, after } en centésimas para construir la barra visual.
 */
export function getMarginSides(attribute, marginSide = 'both') {
  const bothMargin = Math.max(attribute, 2);
  if (marginSide === 'before') return { before: attribute, after: 0 };
  if (marginSide === 'after')  return { before: 0, after: attribute };
  return { before: bothMargin, after: bothMargin };
}
