/**
 * Motor de ecos para runs — GDD v4.0 §6.
 * Separado del ecoEngine.js del sistema de combate (legacy).
 */
import { ECO_BY_TIER, getEcoById } from '../../data/probeEcos.js';

// One-shot ecos consumed after any single probe (they apply to "next probe" only)
const CONSUME_AFTER_PROBE = new Set([
  'eco-ralentizador',
  'eco-margen',
  'eco-sincronia',
  'eco-tiempo-roto',
  // eco-preview handled separately (consumed in advanceToNextProbe)
  // eco-segunda handled in fail absorption
  // eco-pasado handled in addRunEco
  // eco-ultimo-aliento handled on 0-lives
]);

/**
 * Generates 3 eco options for the eco-select screen.
 * - 5% legendary slot
 * - advanced only if character.grade >= 5
 * - no duplicates with current activeEcos
 * - tierBoost: force at least 1 advanced/legendary slot
 */
export function generateEcoOptions(character, activeEcos = [], tierBoost = false) {
  const grade    = character?.grade ?? 1;
  const existing = new Set(activeEcos);

  const pick    = pool => pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  const shuffle = arr  => [...arr].sort(() => Math.random() - 0.5);

  const avail = {
    legendary: ECO_BY_TIER.legendary.filter(e => !existing.has(e.id)),
    advanced:  grade >= 5 ? ECO_BY_TIER.advanced.filter(e => !existing.has(e.id)) : [],
    basic:     ECO_BY_TIER.basic.filter(e => !existing.has(e.id)),
  };

  const options = [];
  const taken   = new Set();

  // Legendary slot (5%)
  if (avail.legendary.length > 0 && Math.random() < 0.05) {
    const eco = pick(avail.legendary);
    if (eco) { options.push(eco); taken.add(eco.id); }
  }

  // tierBoost: force at least 1 advanced if no legendary was rolled
  if (tierBoost && options.length === 0 && avail.advanced.length > 0) {
    const eco = pick(avail.advanced);
    if (eco) { options.push(eco); taken.add(eco.id); }
  }

  // Fill remaining slots: advanced preferred, then basic
  const fill = shuffle([
    ...avail.advanced.filter(e => !taken.has(e.id)),
    ...avail.basic.filter(e => !taken.has(e.id)),
  ]);
  while (options.length < 3 && fill.length > 0) {
    const eco = fill.shift();
    options.push(eco);
    taken.add(eco.id);
  }

  return shuffle(options).slice(0, 3);
}

/**
 * Applies eco config effects to a probe config object.
 * General-scope ecos apply to all probes; advanced ecos only when scope matches.
 * doubledEcos: IDs whose effect is applied twice (eco-pasado mechanism).
 */
export function applyEcoConfig(config, activeEcos = [], probeType = null, doubledEcos = []) {
  let c = { ...config };
  for (const ecoId of activeEcos) {
    const eco = getEcoById(ecoId);
    if (!eco || !eco.hook || Object.keys(eco.hook).length === 0) continue;
    // Skip ecos handled outside config pipeline
    if (eco.onFail || eco.onZeroLives || eco.onNextEcoPick) continue;
    if (eco.scope !== 'general' && eco.scope !== probeType) continue;

    const times = doubledEcos.includes(ecoId) ? 2 : 1;
    for (let t = 0; t < times; t++) {
      c = applyHook(c, eco.hook);
    }
  }
  return c;
}

function applyHook(config, hook) {
  const c = { ...config };
  for (const [key, val] of Object.entries(hook)) {
    if (key.endsWith('Delta')) {
      const base = key.slice(0, -5);
      c[base] = (c[base] ?? 0) + val;
    } else if (key === 'marginMultiplier') {
      if (c.margin   !== undefined) c.margin   = Math.round(c.margin   * val * 10) / 10;
      if (c.marginMs !== undefined) c.marginMs = Math.round(c.marginMs * val);
    } else if (key === 'extraTimeSec') {
      if (c.timeLimitSec !== undefined) c.timeLimitSec += val;
      if (c.totalSec     !== undefined) c.totalSec     += val;
      if (c.durationSec  !== undefined) c.durationSec  += val;
      if (c.timeSec      !== undefined) c.timeSec      += val;
      if (c.travelSec    !== undefined) c.travelSec    += val;
    } else if (key === 'slowFactor') {
      // most restrictive wins
      c.slowFactor = Math.min(c.slowFactor ?? 1, val);
    } else {
      c[key] = val;
    }
  }
  return c;
}

/**
 * Returns IDs of one-shot ecos to remove after any probe completes.
 */
export function getEcosToConsumeAfterProbe(activeEcos = []) {
  return activeEcos.filter(id => CONSUME_AFTER_PROBE.has(id));
}
