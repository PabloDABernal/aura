/**
 * 24 lugares genéricos (2 por cada uno de los 12 tipos). GDD sección 4.
 * Son los lugares del pool general de la run, no pertenecen a Sets específicos.
 */
export const GENERIC_PLACES = {
  // ── Básico (ya en phase1Data, aquí 2 más genéricos) ──────────────────────
  'gp-basico-1': {
    id: 'gp-basico-1', name: 'La Torre Oscura', icon: '🏰', type: 'basico',
    resonance: 28, vibra: { mode: 'punto', target: 3200, timeLimit: 7, pifiaMargin: 20 },
    conquerBonus: { type: 'lereles', value: 2 },
  },
  'gp-basico-2': {
    id: 'gp-basico-2', name: 'El Abismo', icon: '🌑', type: 'basico',
    resonance: 32, vibra: { mode: 'punto', target: 4000, timeLimit: 7, pifiaMargin: 20 },
    conquerBonus: { type: 'lereles', value: 3 },
  },
  // ── Cronometrado ─────────────────────────────────────────────────────────
  'gp-crono-1': {
    id: 'gp-crono-1', name: 'Arena Reloj', icon: '⌛', type: 'cronometrado',
    resonance: 20, timer: 120000,
    vibra: { mode: 'centesimas', target: 67, timeLimit: 10, pifiaMargin: 20 },
    conquerBonus: { type: 'lereles', value: 2 },
  },
  'gp-crono-2': {
    id: 'gp-crono-2', name: 'Ciudad Prohibida', icon: '🏙️', type: 'cronometrado',
    resonance: 25, timer: 90000,
    vibra: { mode: 'centesimas', target: 45, timeLimit: 10, pifiaMargin: 20 },
    conquerBonus: { type: 'lereles', value: 3 },
  },
  // ── Bastión ───────────────────────────────────────────────────────────────
  'gp-bastion-1': {
    id: 'gp-bastion-1', name: 'Bastión de Hierro', icon: '⚙️', type: 'bastion',
    resonance: 20, rivalResonanceShield: 8,
    vibra: { mode: 'punto', target: 2500, timeLimit: 7, pifiaMargin: 20 },
    conquerBonus: { type: 'lereles', value: 3 },
  },
  'gp-bastion-2': {
    id: 'gp-bastion-2', name: 'Fortaleza de Cristal', icon: '💎', type: 'bastion',
    resonance: 18, rivalResonanceShield: 10,
    vibra: { mode: 'punto', target: 3000, timeLimit: 7, pifiaMargin: 20 },
    conquerBonus: { type: 'lereles', value: 4 },
  },
  // ── Carrera de Auras ─────────────────────────────────────────────────────
  'gp-carrera-1': {
    id: 'gp-carrera-1', name: 'Coliseo del Caos', icon: '🏟️', type: 'carrera',
    resonance: 15, rivalResonance: 15,
    vibra: { mode: 'centesimas', target: 50, timeLimit: 10, pifiaMargin: 20 },
    conquerBonus: { type: 'lereles', value: 3 },
  },
  'gp-carrera-2': {
    id: 'gp-carrera-2', name: 'Vórtice de Poder', icon: '🌀', type: 'carrera',
    resonance: 20, rivalResonance: 20,
    vibra: { mode: 'centesimas', target: 78, timeLimit: 10, pifiaMargin: 20 },
    conquerBonus: { type: 'lereles', value: 4 },
  },
  // ── Espejo ────────────────────────────────────────────────────────────────
  'gp-espejo-1': {
    id: 'gp-espejo-1', name: 'Sala de Espejos', icon: '🪞', type: 'espejo',
    resonance: 24,
    vibra: { mode: 'centesimas', target: 33, timeLimit: 10, pifiaMargin: 20 },
    conquerBonus: { type: 'lereles', value: 2 },
  },
  'gp-espejo-2': {
    id: 'gp-espejo-2', name: 'Dimensión Invertida', icon: '🔄', type: 'espejo',
    resonance: 28,
    vibra: { mode: 'punto', target: 2000, timeLimit: 7, pifiaMargin: 20 },
    conquerBonus: { type: 'lereles', value: 3 },
  },
  // ── Maldito ───────────────────────────────────────────────────────────────
  'gp-maldito-1': {
    id: 'gp-maldito-1', name: 'Bosque Maldito', icon: '🌲', type: 'maldito',
    resonance: 20, addResonanceEveryMs: 30000, addAmount: 2,
    vibra: { mode: 'centesimas', target: 55, timeLimit: 10, pifiaMargin: 20 },
    conquerBonus: { type: 'lereles', value: 2 },
  },
  'gp-maldito-2': {
    id: 'gp-maldito-2', name: 'Ruinas Corruptas', icon: '🏚️', type: 'maldito',
    resonance: 25, addResonanceEveryMs: 20000, addAmount: 3,
    vibra: { mode: 'punto', target: 3500, timeLimit: 7, pifiaMargin: 20 },
    conquerBonus: { type: 'lereles', value: 3 },
  },
  // ── Eco ───────────────────────────────────────────────────────────────────
  'gp-eco-1': {
    id: 'gp-eco-1', name: 'Biblioteca de Ecos', icon: '📚', type: 'eco',
    resonance: 22,
    vibra: { mode: 'punto', target: 4500, timeLimit: 7, pifiaMargin: 20 },
    conquerBonus: { type: 'eco', rarity: 'normal' },
  },
  'gp-eco-2': {
    id: 'gp-eco-2', name: 'Nexo de Fragmentos', icon: '✨', type: 'eco',
    resonance: 26,
    vibra: { mode: 'centesimas', target: 42, timeLimit: 10, pifiaMargin: 20 },
    conquerBonus: { type: 'eco', rarity: 'infrecuente' },
  },
  // ── Sacrificio ────────────────────────────────────────────────────────────
  'gp-sacrificio-1': {
    id: 'gp-sacrificio-1', name: 'Altar del Sacrificio', icon: '⚰️', type: 'sacrificio',
    resonance: 16,
    vibra: { mode: 'centesimas', target: 88, timeLimit: 10, pifiaMargin: 20 },
    conquerBonus: { type: 'lereles', value: 5 },
  },
  'gp-sacrificio-2': {
    id: 'gp-sacrificio-2', name: 'Cripta del Olvido', icon: '💀', type: 'sacrificio',
    resonance: 20,
    vibra: { mode: 'punto', target: 2200, timeLimit: 7, pifiaMargin: 20 },
    conquerBonus: { type: 'lereles', value: 6 },
  },
  // ── Resonante ─────────────────────────────────────────────────────────────
  'gp-resonante-1': {
    id: 'gp-resonante-1', name: 'Zona de Resonancia', icon: '🔔', type: 'resonante',
    resonance: 30, resonancePhase2: 15,
    vibra: { mode: 'centesimas', target: 60, timeLimit: 10, pifiaMargin: 20 },
    conquerBonus: { type: 'lereles', value: 3 },
  },
  'gp-resonante-2': {
    id: 'gp-resonante-2', name: 'Cámara de Amplificación', icon: '📡', type: 'resonante',
    resonance: 24, resonancePhase2: 12,
    vibra: { mode: 'punto', target: 3800, timeLimit: 7, pifiaMargin: 20 },
    conquerBonus: { type: 'lereles', value: 4 },
  },
  // ── Fortaleza ─────────────────────────────────────────────────────────────
  'gp-fortaleza-1': {
    id: 'gp-fortaleza-1', name: 'Gran Muralla', icon: '🧱', type: 'fortaleza',
    resonance: 20, rivalShield: 12,
    vibra: { mode: 'centesimas', target: 72, timeLimit: 10, pifiaMargin: 20 },
    conquerBonus: { type: 'lereles', value: 3 },
  },
  'gp-fortaleza-2': {
    id: 'gp-fortaleza-2', name: 'Ciudadela de Acero', icon: '🛡️', type: 'fortaleza',
    resonance: 24, rivalShield: 16,
    vibra: { mode: 'punto', target: 4200, timeLimit: 7, pifiaMargin: 20 },
    conquerBonus: { type: 'lereles', value: 4 },
  },
  // ── Péndulo ───────────────────────────────────────────────────────────────
  'gp-pendulo-1': {
    id: 'gp-pendulo-1', name: 'Reloj del Tiempo', icon: '🕰️', type: 'pendulo',
    resonance: 18, pendulumPeriodMs: 6000,
    vibra: { mode: 'punto', target: 3000, timeLimit: 7, pifiaMargin: 20 },
    conquerBonus: { type: 'lereles', value: 3 },
  },
  'gp-pendulo-2': {
    id: 'gp-pendulo-2', name: 'Metrónomo Caótico', icon: '🎵', type: 'pendulo',
    resonance: 22, pendulumPeriodMs: 4000,
    vibra: { mode: 'centesimas', target: 50, timeLimit: 10, pifiaMargin: 20 },
    conquerBonus: { type: 'lereles', value: 4 },
  },
};

export const GENERIC_PLACE_POOL = Object.values(GENERIC_PLACES);
