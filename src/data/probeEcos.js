/**
 * Ecos disponibles — GDD v4.0 §6.2.
 * Tiers: basic (5) | advanced (8, probe-specific) | legendary (4).
 */

export const ECO_TIERS = {
  basic:     { label: 'Básico',     color: '#9CA3AF', glow: false },
  advanced:  { label: 'Avanzado',   color: '#60A5FA', glow: false },
  legendary: { label: 'Legendario', color: '#FFD700', glow: true  },
};

export const ECO_POOL = [
  // ── BASIC — 5 ecos, generales ───────────────────────────────────────────────
  {
    id: 'eco-segunda',
    name: 'Segunda oportunidad',
    description: 'El próximo fallo no quita vida',
    tier: 'basic', scope: 'general', oneShot: true, onFail: true,
    hook: {},
  },
  {
    id: 'eco-ralentizador',
    name: 'Ralentizador',
    description: 'En la próxima prueba el cronómetro va al 75%',
    tier: 'basic', scope: 'general', oneShot: true,
    hook: { slowFactor: 0.75 },
  },
  {
    id: 'eco-margen',
    name: 'Objetivo ampliado',
    description: 'En la próxima prueba el margen de acierto se duplica',
    tier: 'basic', scope: 'general', oneShot: true,
    hook: { marginMultiplier: 2 },
  },
  {
    id: 'eco-preview',
    name: 'Vista previa',
    description: 'Ves el tipo de prueba 3 s extra antes de empezar',
    tier: 'basic', scope: 'general', oneShot: true,
    hook: { showPreview: true },
  },
  {
    id: 'eco-tiempo',
    name: 'Tiempo extra',
    description: '+10 segundos a todas las pruebas restantes de la run',
    tier: 'basic', scope: 'general', oneShot: false,
    hook: { extraTimeSec: 10 },
  },

  // ── ADVANCED — 8 ecos, probe-specific, requieren grado 5+ ──────────────────
  {
    id: 'eco-ojo-clinico',
    name: 'Ojo clínico',
    description: 'En Ciego, los objetivos nunca se oscurecen',
    tier: 'advanced', scope: 'ciego', oneShot: false,
    hook: { visibleSecDelta: 999 },
  },
  {
    id: 'eco-pulso-interno',
    name: 'Pulso interno',
    description: 'En Cadena, el margen de acierto se amplía +10',
    tier: 'advanced', scope: 'cadena', oneShot: false,
    hook: { marginDelta: 10 },
  },
  {
    id: 'eco-seguro',
    name: 'Seguro',
    description: 'En Rebote, el margen de rebote es 1.5× mayor',
    tier: 'advanced', scope: 'rebote', oneShot: false,
    hook: { marginMultiplier: 1.5 },
  },
  {
    id: 'eco-radar',
    name: 'Radar',
    description: 'En Parpadeo, el destello dura +300 ms más',
    tier: 'advanced', scope: 'parpadeo', oneShot: false,
    hook: { visibleMsDelta: 300 },
  },
  {
    id: 'eco-cadena-dorada',
    name: 'Cadena dorada',
    description: 'En Cadena, necesitas 1 eslabón menos',
    tier: 'advanced', scope: 'cadena', oneShot: false,
    hook: { linksDelta: -1 },
  },
  {
    id: 'eco-memoria-fotografica',
    name: 'Memoria fotográfica',
    description: 'En Memoria, los objetivos se muestran 1 s más',
    tier: 'advanced', scope: 'memoria', oneShot: false,
    hook: { visibleMsDelta: 1000 },
  },
  {
    id: 'eco-espejo-roto',
    name: 'Espejo roto',
    description: 'En Espejo, el margen de simetría se amplía +5',
    tier: 'advanced', scope: 'espejo', oneShot: false,
    hook: { marginDelta: 5 },
  },
  {
    id: 'eco-fantasma-visible',
    name: 'Fantasma visible',
    description: 'En Cadencia Fantasma, el patrón se muestra visible',
    tier: 'advanced', scope: 'cadenciafantasma', oneShot: false,
    hook: { showGhost: true },
  },

  // ── LEGENDARY — 4 ecos, 5% de probabilidad de aparición ───────────────────
  {
    id: 'eco-sincronia',
    name: 'Sincronía perfecta',
    description: 'Próxima prueba: cualquier parada en tu número Aura cuenta como perfect',
    tier: 'legendary', scope: 'general', oneShot: true,
    hook: { auraNumberPerfect: true },
  },
  {
    id: 'eco-tiempo-roto',
    name: 'Tiempo roto',
    description: 'Próxima prueba: cronómetro al 50% pero margen ×3',
    tier: 'legendary', scope: 'general', oneShot: true,
    hook: { slowFactor: 0.5, marginMultiplier: 3 },
  },
  {
    id: 'eco-pasado',
    name: 'Eco del pasado',
    description: 'El siguiente eco que elijas se aplica dos veces (ocupa 1 slot)',
    tier: 'legendary', scope: 'general', oneShot: true, onNextEcoPick: true,
    hook: {},
  },
  {
    id: 'eco-ultimo-aliento',
    name: 'Último aliento',
    description: 'Si llegas a 0 vidas, recuperas 1 vida y la run continúa (una vez)',
    tier: 'legendary', scope: 'general', oneShot: true, onZeroLives: true,
    hook: {},
  },
];

export const ECO_BY_TIER = {
  basic:     ECO_POOL.filter(e => e.tier === 'basic'),
  advanced:  ECO_POOL.filter(e => e.tier === 'advanced'),
  legendary: ECO_POOL.filter(e => e.tier === 'legendary'),
};

export function getEcoById(id) {
  return ECO_POOL.find(e => e.id === id) ?? null;
}
