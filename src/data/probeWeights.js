/**
 * Estimador de dificultad de configuración de prueba.
 * computeDifficultyScore(probeType, config) → 1-10 (1=trivial, 10=máxima)
 */
function lerp(v, inMin, inMax, outMin, outMax) {
  const t = Math.max(0, Math.min(1, (v - inMin) / (inMax - inMin)));
  return outMin + t * (outMax - outMin);
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

export function computeDifficultyScore(probeType, config) {
  const c = config ?? {};
  let score;
  switch (probeType) {
    case 'bingo': {
      const m = lerp(c.margin ?? 0, 0, 15, 10, 1);
      const t = lerp(c.timeLimitSec ?? 20, 120, 5, 1, 10);
      const n = lerp(c.targets ?? 5, 1, 9, 1, 10);
      score = m * 0.5 + t * 0.3 + n * 0.2;
      break;
    }
    case 'espejo': {
      const m = lerp(c.margin ?? 3, 20, 0, 1, 10);
      const d = lerp(c.duration ?? 10, 30, 5, 1, 10);
      score = m * 0.7 + d * 0.3;
      break;
    }
    case 'pendulo': {
      const m = lerp(c.margin ?? 2, 20, 0, 1, 10);
      const s = lerp(c.swingDuration ?? 3, 10, 2, 1, 10);
      score = m * 0.6 + s * 0.4;
      break;
    }
    case 'parpadeo': {
      const m = lerp(c.margin ?? 5, 20, 0, 1, 10);
      const v = lerp(c.visibleMs ?? 500, 2000, 100, 1, 10);
      score = m * 0.5 + v * 0.5;
      break;
    }
    case 'memoria': {
      const m = lerp(c.margin ?? 5, 15, 0, 1, 10);
      const d = lerp(c.delayMs ?? 3000, 1000, 8000, 1, 10);
      const v = lerp(c.visibleMs ?? 1500, 3000, 500, 1, 10);
      score = m * 0.5 + d * 0.3 + v * 0.2;
      break;
    }
    case 'ciego': {
      const m = lerp(c.margin ?? 5, 20, 0, 1, 10);
      const v = lerp(c.visibleSec ?? 3, 10, 1, 1, 10);
      score = m * 0.6 + v * 0.4;
      break;
    }
    case 'cadena': {
      const m = lerp(c.margin ?? 5, 20, 0, 1, 10);
      const l = lerp(c.links ?? 4, 2, 8, 1, 10);
      const r = lerp(c.reductionSec ?? 2, 0, 5, 1, 10);
      score = m * 0.4 + l * 0.3 + r * 0.3;
      break;
    }
    case 'cuentainterna': {
      score = lerp(c.margin ?? 0.30, 1.5, 0.1, 1, 10);
      break;
    }
    case 'cadenciafantasma': {
      score = lerp(c.margin ?? 0.25, 1.0, 0.05, 1, 10);
      break;
    }
    case 'cargaenergia': {
      const m = lerp(c.margin ?? 0.30, 1.5, 0.1, 1, 10);
      const curveBonus = c.barCurve === 'oscillate' ? 2 : c.barCurve === 'linear' ? 0 : 1;
      score = m + curveBonus;
      break;
    }
    case 'ecovisual': {
      const m = lerp(c.marginMs ?? 200, 500, 50, 1, 10);
      const l = lerp(c.lights ?? 3, 2, 5, 1, 10);
      const i = lerp(c.intervalMs ?? 1000, 2000, 300, 1, 10);
      score = m * 0.4 + l * 0.3 + i * 0.3;
      break;
    }
    case 'poliritmo': {
      const m = lerp(c.marginMs ?? 200, 400, 50, 1, 10);
      const r = lerp(c.required ?? 1, 1, 5, 1, 10);
      score = m * 0.6 + r * 0.4;
      break;
    }
    case 'sincroniafase': {
      const m = lerp(c.marginMs ?? 150, 400, 50, 1, 10);
      const r = lerp(c.required ?? 1, 1, c.revolutions ?? 3, 1, 10);
      score = m * 0.7 + r * 0.3;
      break;
    }
    case 'rebote': {
      score = lerp(c.margin ?? 5, 20, 0, 1, 10);
      break;
    }
    case 'xopportunities': {
      const m = lerp(c.margin ?? 0, 15, 0, 1, 10);
      const r = lerp(c.required ?? 1, 1, c.numTargets ?? 3, 1, 10);
      score = m * 0.6 + r * 0.4;
      break;
    }
    case 'suma100': {
      const t = lerp(c.timeLimitSec ?? 30, 120, 10, 1, 10);
      const s = lerp(c.targetSum ?? 100, 100, 500, 1, 10);
      score = t * 0.6 + s * 0.4;
      break;
    }
    case 'equilibrio': {
      score = lerp((c.maxVal ?? 60) - (c.minVal ?? 40), 50, 5, 1, 10);
      break;
    }
    case 'banca': {
      score = lerp(c.slots ?? 5, 2, 10, 1, 10);
      break;
    }
    case 'doblenada': {
      score = lerp(c.margin ?? 0.30, 1.5, 0.05, 1, 10);
      break;
    }
    case 'pacto': {
      score = lerp(c.coins ?? 5, 10, 1, 1, 10);
      break;
    }
    default:
      score = 5;
  }
  return clamp(Math.round(score), 1, 10);
}
