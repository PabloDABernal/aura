/**
 * Motor de habilidades — GDD v4.0 §5.
 * Soporta IDs del catálogo nuevo (pg/ag/aug) y migrados (p/a/aa).
 * B1: 5 hooks canónicos + backward-compat shims.
 */
import { ABILITY_CATALOG, getCatalogAbility } from '../../data/abilityCatalog.js';

// ── ID normalizers ────────────────────────────────────────────────────────────
function normPassive(id) {
  return { pg01:'p01', pg02:'p02', pg03:'p03', pg04:'p04', pg05:'p_tempo' }[id] ?? id;
}
function normActive(id) {
  return { ag01:'a01', ag02:'a02', ag03:'a03', ag04:'a04', ag05:'a05' }[id] ?? id;
}
function normAura(id) {
  return { aug01:'aa01', aug02:'aa02', aug03:'aa03', aug04:'aa04', aug05:'aa05' }[id] ?? id;
}

function getPassiveId(character) {
  return normPassive(
    character?.passiveAbility?.id ?? character?.ability?.id ?? null
  );
}
function getActiveId(character) {
  return normActive(
    character?.activeAbility?.id ?? (character?.ability?.type === 'active' ? character.ability.id : null) ?? null
  );
}
function getAuraId(character) {
  return normAura(
    character?.auraAbility?.id ?? null
  );
}

// ── Helper: get probe-specific catalog ability for a probeType and kind ───────
function getProbeSpecificAbility(character, probeType, kind) {
  const equipped = character?.probeAbilities?.[probeType]?.[kind];
  if (!equipped) return null;
  return ABILITY_CATALOG.find(a => a.id === equipped && a.scope === probeType && a.kind === kind) ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK 1: applyRunStart
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Called once at run start. Returns initial run-state overrides.
 * @returns {{ extraLives: number, residuesThreshold: number }}
 */
export function applyRunStart(baseState, character) {
  const pid = getPassiveId(character);
  const extraLives = pid === 'p01' ? 1 : 0;
  const residuesThreshold = (pid === 'p_tempo' || pid === 'pg05') ? 2 : 3;
  return { extraLives, residuesThreshold };
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK 2: applyProbeConfig
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Applies all passive ability effects to raw probe config.
 * Handles both general and probe-specific passives.
 * @param {object} config - raw probe config from generateProbeConfig
 * @param {object} character
 * @param {string} probeType - current probe type (e.g., 'bingo')
 * @param {number} flowBonus - from p09 accumulated flow margin
 * @returns modified config copy
 */
export function applyProbeConfig(config, character, probeType, flowBonus = 0) {
  let c = { ...config };
  const pid = getPassiveId(character);

  // ── General passives ───────────────────────────────────────────────────────
  if (pid === 'p02') {
    if (c.margin   !== undefined) c.margin   += 5;
    if (c.marginMs !== undefined) c.marginMs += 50;
  }
  if (pid === 'p03') {
    if (c.timeLimitSec !== undefined) c.timeLimitSec += 10;
    if (c.totalSec     !== undefined) c.totalSec     += 10;
  }
  if (pid === 'p06' && probeType === 'bingo' && c.targets !== undefined) {
    c.targets = Math.max(1, c.targets - 1);
  }
  if (pid === 'p05' && probeType === 'suma100') {
    c.softReset = true; // marker for Suma100Probe: on overshoot, go to 50 not 0
  }
  if (pid === 'p10' && probeType === 'xopportunities') {
    c.firstCaptureGuaranteed = true;
  }
  if (flowBonus > 0 && c.margin !== undefined) c.margin += flowBonus;

  // ── Probe-specific passive ─────────────────────────────────────────────────
  const probePassive = getProbeSpecificAbility(character, probeType, 'passive');
  if (probePassive?.hook) {
    c = applyHook(c, probePassive.hook);
  }

  return c;
}

// ── Utility: apply a hook object to a config ──────────────────────────────────
function applyHook(config, hook) {
  const c = { ...config };
  for (const [key, val] of Object.entries(hook)) {
    if (key.endsWith('Delta') || key.endsWith('Bonus')) {
      const base = key.replace('Delta', '').replace('Bonus', '');
      if (c[base] !== undefined) c[base] += val;
      else c[base] = val;
    } else if (key === 'marginMultiplier' && c.margin !== undefined) {
      c.margin = Math.round(c.margin * val * 10) / 10;
    } else {
      c[key] = val;
    }
  }
  return c;
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK 3: applyProbeResult
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Determines fail absorption after a probe finishes.
 * @param {'perfect'|'pass'|'fail'} result
 * @param {object} character
 * @param {string} probeType
 * @param {{ firstFailFree: boolean, secondAirUsed: boolean, lives: number, shieldActive: boolean }} context
 * @returns {{ absorb: boolean, firstFailFree: boolean, secondAirUsed: boolean, shieldConsumed: boolean }}
 */
export function applyProbeResult(result, character, probeType, context) {
  const { firstFailFree, secondAirUsed, lives, shieldActive } = context;
  const pid = getPassiveId(character);

  if (result !== 'fail') {
    return { absorb: false, firstFailFree, secondAirUsed, shieldConsumed: false };
  }

  if (shieldActive) {
    return { absorb: true, firstFailFree, secondAirUsed, shieldConsumed: true };
  }
  if ((pid === 'p04' || pid === 'pg04') && firstFailFree) {
    return { absorb: true, firstFailFree: false, secondAirUsed, shieldConsumed: false };
  }
  if ((pid === 'p08' || pid === 'pg08') && !secondAirUsed && lives === 1) {
    return { absorb: true, firstFailFree, secondAirUsed: true, shieldConsumed: false };
  }

  return { absorb: false, firstFailFree, secondAirUsed, shieldConsumed: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK 4: applyActiveUse
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Resolves the effect of activating the active ability.
 * @param {object} character
 * @param {object} runState - current activeRun
 * @param {string} probeType
 * @returns {{ effect: object|null, runPatch: object }}
 *   effect.type: 'slow'|'repeat'|'timeBonus'|'shield'|'preview'|'configPatch'|'rachaMargin'
 */
export function applyActiveUse(character, runState, probeType) {
  const aid = getActiveId(character);

  switch (aid) {
    case 'a01':
      return { effect: { type: 'slow', factor: 0.5, durationMs: 5000, label: 'Cámara lenta 5s' }, runPatch: {} };
    case 'a02':
      return { effect: { type: 'preview', durationMs: 3000, label: 'Vista previa 3s' }, runPatch: {} };
    case 'a03':
      return { effect: { type: 'repeat', label: 'Prueba reiniciada' }, runPatch: {} };
    case 'a04':
      return { effect: { type: 'timeBonus', value: 15, label: '+15 segundos' }, runPatch: {} };
    case 'a05':
      return { effect: { type: 'shield', label: 'Escudo activado' }, runPatch: { shieldActive: true } };
    case 'a06':
      return { effect: { type: 'reveal', durationMs: 2000, label: 'Descifrado 2s' }, runPatch: {} };
    case 'a07':
      return { effect: { type: 'configPatch', patch: { durationMultiplier: 2 }, label: 'Turbo: duración ×2' }, runPatch: {} };
    case 'a08':
      if (probeType !== 'suma100') return { effect: null, runPatch: {} };
      return { effect: { type: 'configPatch', patch: { safeNextReset: true }, label: 'Reset seguro' }, runPatch: {} };
    case 'a09':
      return { effect: { type: 'rachaMargin', probesLeft: 3, label: 'Racha: margen ×2 por 3 pruebas' }, runPatch: { rachaMarginLeft: 3 } };
    case 'a10':
      if (probeType !== 'xopportunities') return { effect: null, runPatch: {} };
      return { effect: { type: 'configPatch', patch: { extraAttempts: 2 }, label: '+2 intentos' }, runPatch: {} };
    default: {
      // Probe-specific active
      const probeActive = getProbeSpecificAbility(character, probeType, 'active');
      if (probeActive?.hook) {
        return { effect: { type: 'configPatch', patch: probeActive.hook, label: probeActive.name }, runPatch: {} };
      }
      return { effect: null, runPatch: {} };
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK 5: applyAuraTrigger
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Resolves the effect of an aura activation.
 * @param {object} character
 * @param {object} runState - current activeRun
 * @param {string} probeType
 * @returns {{ runPatch: object, message: string }}
 */
export function applyAuraTrigger(character, runState, probeType) {
  const aaid = getAuraId(character);
  const { lives, maxLives = 3, abilityUsed, auraActivations = 0 } = runState;

  switch (aaid) {
    case 'aa01':
      return { runPatch: { lives: Math.min(lives + 1, maxLives) }, message: '❤️ +1 vida recuperada' };
    case 'aa02':
      // Free ability use — apply active effect via aura, mark flag so UI shows "VÍA AURA"
      return { runPatch: { abilityUsedViaAura: true }, message: '⚡ Habilidad libre activada' };
    case 'aa03':
      return { runPatch: { nextEcoTierBoost: true }, message: '🌟 Próximo eco de rareza superior' };
    case 'aa04':
      return { runPatch: { activeAuraEffect: { type: 'timeBonus', value: 5 } }, message: '⏱ +5 segundos (próxima prueba)' };
    case 'aa05':
      return { runPatch: { nextProbeAutoPass: true }, message: '✨ Siguiente prueba auto-superada' };
    case 'aa06':
      return { runPatch: { lives: Math.min(lives + 1, 4) }, message: '❤️ +1 vida extra' };
    case 'aa07':
      return { runPatch: { activeAuraEffect: { type: 'removeHardest' } }, message: '🗑 Objetivo más difícil eliminado' };
    case 'aa08':
      return { runPatch: { shieldActive: true }, message: '🛡 Prueba actual protegida contra fallo' };
    case 'aa09':
      return { runPatch: { activeAuraEffect: { type: 'reveal', durationMs: 1000 } }, message: '⚡ Flash 1s' };
    case 'aa10':
      if (probeType !== 'suma100') return { runPatch: {}, message: '✨ Aura activada' };
      return { runPatch: { activeAuraEffect: { type: 'configPatch', patch: { startingScoreBonus: 10 } } }, message: '➕ +10 en Suma 100' };
    case 'aa11':
      return { runPatch: { activeAuraEffect: { type: 'slow', factor: 0.75, durationMs: 3000 } }, message: '🐢 Cronómetro lento 3s' };
    case 'aa12':
      return { runPatch: { activeAuraEffect: { type: 'guaranteeNextHit' } }, message: '🎯 Próxima parada garantizada' };
    case 'aa13':
      return { runPatch: { pendingFreeEco: true }, message: '🍀 Eco gratis recibido' };
    case 'aa14':
      return { runPatch: { activeAuraEffect: { type: 'revealAll', durationMs: 2000 } }, message: '👁 Todos los objetivos visibles 2s' };
    case 'aa15':
      return { runPatch: { shieldActive: true }, message: '🛡 Primer fallo de prueba ignorado' };
    default: {
      // Probe-specific aura
      const probeAura = getProbeSpecificAbility(character, probeType, 'aura');
      if (probeAura?.hook) {
        return {
          runPatch: { activeAuraEffect: { type: 'configPatch', patch: probeAura.hook } },
          message: `✨ ${probeAura.name}`,
        };
      }
      return { runPatch: {}, message: '✨ Aura activada' };
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKWARD COMPAT SHIMS
// ─────────────────────────────────────────────────────────────────────────────

export function getRunStartBonuses(passiveAbility) {
  return { extraLives: normPassive(passiveAbility?.id) === 'p01' ? 1 : 0 };
}

export function applyAbilityProbeConfig(config, passiveAbility, flowBonus = 0) {
  const fakeChar = { passiveAbility };
  return applyProbeConfig(config, fakeChar, null, flowBonus);
}

export function checkFailAbsorption(passiveAbility, firstFailFree, secondAirUsed, lives) {
  const fakeChar = { passiveAbility };
  const { absorb, firstFailFree: ff, secondAirUsed: sau } = applyProbeResult(
    'fail', fakeChar, null, { firstFailFree, secondAirUsed, lives, shieldActive: false }
  );
  return { absorb, firstFailFree: ff, secondAirUsed: sau };
}

export function getActiveAbilityEffect(abilityId) {
  switch (normActive(abilityId)) {
    case 'a01': return { type: 'slow',      factor: 0.5,  durationMs: 5000, label: 'Cámara lenta 5s' };
    case 'a02': return { type: 'preview',   durationMs: 3000, label: 'Vista previa 3s' };
    case 'a03': return { type: 'repeat',                       label: 'Prueba reiniciada' };
    case 'a04': return { type: 'timeBonus', value: 15,         label: '+15 segundos' };
    case 'a05': return { type: 'shield',                       label: 'Escudo activado' };
    default:    return null;
  }
}

export function applyRuntimeEffect(config, effect) {
  if (!effect) return config;
  const c = { ...config };
  if (effect.type === 'timeBonus') {
    if (c.timeLimitSec !== undefined) c.timeLimitSec += effect.value;
    if (c.totalSec     !== undefined) c.totalSec     += effect.value;
  }
  if (effect.type === 'slow') {
    c.slowFactor = effect.factor;
  }
  if (effect.type === 'configPatch' && effect.patch) {
    Object.assign(c, effect.patch);
  }
  return c;
}

export function computeAuraEffect(auraAbilityId, lives, maxLives, abilityUsed) {
  const fakeChar = { auraAbility: { id: auraAbilityId } };
  const fakeRun  = { lives, maxLives, abilityUsed, auraActivations: 0 };
  return applyAuraTrigger(fakeChar, fakeRun, null);
}
