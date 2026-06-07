/**
 * Librería base de Ecos. GDD sección 6.
 * id, name, desc, category, rarity, doubleFilo, penalty, effect
 */
export const ECO_LIBRARY = {
  // ── Vibra — Normal ─────────────────────────────────────────────────────────
  pulso_estable: {
    id: 'pulso_estable', name: 'Pulso Estable',
    desc: 'Margen de acierto +2 centésimas permanente.',
    category: 'vibra', rarity: 'normal', doubleFilo: false,
    effect: { type: 'marginBonus', value: 2 },
  },
  calma: {
    id: 'calma', name: 'Calma',
    desc: 'Cronómetro 20% más lento.',
    category: 'vibra', rarity: 'normal', doubleFilo: false,
    effect: { type: 'timerSpeed', mult: 0.8 },
  },
  primer_golpe: {
    id: 'primer_golpe', name: 'Primer Golpe',
    desc: 'Primera prueba de cada combate es Vibra automática.',
    category: 'vibra', rarity: 'normal', doubleFilo: false,
    effect: { type: 'firstVibra' },
  },
  memoria_muscular: {
    id: 'memoria_muscular', name: 'Memoria Muscular',
    desc: 'Parar en el mismo segundo que la prueba anterior da +2 Aura temporal.',
    category: 'vibra', rarity: 'normal', doubleFilo: false,
    effect: { type: 'sameSecondBonus', aura: 2 },
  },
  // ── Vibra — Infrecuente ────────────────────────────────────────────────────
  adrenalina: {
    id: 'adrenalina', name: 'Adrenalina',
    desc: 'Cada Flow consecutivo +3 centésimas de margen acumulable.',
    category: 'vibra', rarity: 'infrecuente', doubleFilo: false,
    effect: { type: 'flowStreakMargin', perFlow: 3 },
  },
  zona: {
    id: 'zona', name: 'Zona',
    desc: 'Parar antes de 2s da ×1.5 adicional al daño.',
    category: 'vibra', rarity: 'infrecuente', doubleFilo: false,
    effect: { type: 'earlyStopMult', beforeMs: 2000, mult: 1.5 },
  },
  doble_filo_margen: {
    id: 'doble_filo_margen', name: 'Doble Filo',
    desc: 'Margen ×2 pero zona de Pifia a la mitad.',
    category: 'vibra', rarity: 'infrecuente', doubleFilo: true,
    penalty: 'Zona de Pifia a la mitad.',
    effect: { type: 'marginMult', mult: 2, pifiaHalf: true },
  },
  segunda_intencion: {
    id: 'segunda_intencion', name: 'Segunda Intención',
    desc: 'Tras parar puedes relanzar el cronómetro hasta 2 veces. Cada relanzamiento suma tiempo.',
    category: 'vibra', rarity: 'infrecuente', doubleFilo: true,
    penalty: 'Cada relanzamiento consume tiempo de Vibración adicional.',
    effect: { type: 'relaunch', maxRelaunches: 2 },
  },
  ventana_activa: {
    id: 'ventana_activa', name: 'Ventana Activa',
    desc: 'Margen empieza ×3 pero se reduce 5ctms/s. Si esperas demasiado llega a 0.',
    category: 'vibra', rarity: 'infrecuente', doubleFilo: true,
    penalty: 'El margen se reduce con el tiempo.',
    effect: { type: 'shrinkingMargin', initial: 3, reductionPerSec: 5 },
  },
  // ── Vibra — Raro ───────────────────────────────────────────────────────────
  resonancia_perfecta: {
    id: 'resonancia_perfecta', name: 'Resonancia Perfecta',
    desc: 'Cada Flow da ×2 + bonus máximo siempre.',
    category: 'vibra', rarity: 'raro', doubleFilo: false,
    effect: { type: 'perfectFlow' },
  },
  caos_controlado: {
    id: 'caos_controlado', name: 'Caos Controlado',
    desc: 'Objetivo cambia aleatoriamente en cada intento. Si aciertas: ×3.',
    category: 'vibra', rarity: 'raro', doubleFilo: false,
    effect: { type: 'randomTarget', mult: 3 },
  },
  // ── Personaje — Normal ─────────────────────────────────────────────────────
  escolta: {
    id: 'escolta', name: 'Escolta',
    desc: 'Invitados en HQ ganan +1 Aura al inicio de cada turno del jugador.',
    category: 'personaje', rarity: 'normal', doubleFilo: false,
    effect: { type: 'hqGuestAura', perTurn: 1 },
  },
  sinfonia: {
    id: 'sinfonia', name: 'Sinfonía',
    desc: 'Si todos tus personajes en zona son del mismo color, +1 Aura cada uno.',
    category: 'personaje', rarity: 'normal', doubleFilo: false,
    effect: { type: 'sameColorBonus', aura: 1 },
  },
  colectivo: {
    id: 'colectivo', name: 'Colectivo',
    desc: 'Invitados +1 Aura al inicio del combate.',
    category: 'personaje', rarity: 'normal', doubleFilo: false,
    effect: { type: 'startAuraBonus', targets: 'guests', aura: 1 },
  },
  veterano: {
    id: 'veterano', name: 'Veterano',
    desc: 'Líderes +2 Aura temporal al inicio del combate.',
    category: 'personaje', rarity: 'normal', doubleFilo: false,
    effect: { type: 'startAuraBonus', targets: 'leaders', aura: 2 },
  },
  // ── Personaje — Infrecuente ────────────────────────────────────────────────
  cataliz: {
    id: 'cataliz', name: 'Catalizador',
    desc: 'El personaje con más Aura en Foso gana +2 Presencia.',
    category: 'personaje', rarity: 'infrecuente', doubleFilo: false,
    effect: { type: 'pitTopAuraBonus', presencia: 2 },
  },
  fortaleza: {
    id: 'fortaleza', name: 'Fortaleza',
    desc: 'Líderes con Temple 0 no van a KO, se quedan en Temple 1.',
    category: 'personaje', rarity: 'infrecuente', doubleFilo: false,
    effect: { type: 'leaderTempleFloor', min: 1 },
  },
  ultima_bala: {
    id: 'ultima_bala', name: 'Última Bala',
    desc: 'Último invitado Aura ×3, resto -1 Aura.',
    category: 'personaje', rarity: 'infrecuente', doubleFilo: true,
    penalty: 'El resto de invitados pierden 1 Aura.',
    effect: { type: 'lastGuestTriple', otherPenalty: -1 },
  },
  // ── Personaje — Raro ───────────────────────────────────────────────────────
  resonancia_grupal: {
    id: 'resonancia_grupal', name: 'Resonancia Grupal',
    desc: 'Cada KO de aliado sube +2 Aura al siguiente en actuar.',
    category: 'personaje', rarity: 'raro', doubleFilo: false,
    effect: { type: 'koChainBonus', aura: 2 },
  },
  // ── Lugar — Normal ─────────────────────────────────────────────────────────
  conocedor: {
    id: 'conocedor', name: 'Conocedor',
    desc: 'Lugares del mismo Set que tus líderes dan +2 lereles al conquistar.',
    category: 'lugar', rarity: 'normal', doubleFilo: false,
    effect: { type: 'sameSetConquerLereles', lereles: 2 },
  },
  bastion_propio: {
    id: 'bastion_propio', name: 'Bastión Propio',
    desc: 'Tus personajes en lugar ganan +1 Temple por turno.',
    category: 'lugar', rarity: 'normal', doubleFilo: false,
    effect: { type: 'placeTemplePerTurn', temple: 1 },
  },
  terreno_conocido: {
    id: 'terreno_conocido', name: 'Terreno Conocido',
    desc: 'Al entrar en un lugar +1 Aura temporal.',
    category: 'lugar', rarity: 'normal', doubleFilo: false,
    effect: { type: 'enterPlaceBonus', aura: 1 },
  },
  // ── Lugar — Infrecuente ────────────────────────────────────────────────────
  resonador: {
    id: 'resonador', name: 'Resonador',
    desc: 'Al conquistar un lugar, recuperas 1 Aura en todos los personajes activos.',
    category: 'lugar', rarity: 'infrecuente', doubleFilo: false,
    effect: { type: 'conquerHealAll', aura: 1 },
  },
  territorio: {
    id: 'territorio', name: 'Territorio',
    desc: 'Si conquistas 2+ lugares en un combate, +3 lereles bonus.',
    category: 'lugar', rarity: 'infrecuente', doubleFilo: false,
    effect: { type: 'multiConquerBonus', minPlaces: 2, lereles: 3 },
  },
  // ── Lugar — Raro ───────────────────────────────────────────────────────────
  dominador: {
    id: 'dominador', name: 'Dominador',
    desc: 'El primer lugar de cada combate se puede conquistar con Acción Segura.',
    category: 'lugar', rarity: 'raro', doubleFilo: false,
    effect: { type: 'firstPlaceAccionSegura' },
  },
  // ── Economía — Normal ──────────────────────────────────────────────────────
  carterista: {
    id: 'carterista', name: 'Carterista',
    desc: 'Al descartar, ganas 2L en lugar de 1L.',
    category: 'economia', rarity: 'normal', doubleFilo: false,
    effect: { type: 'discardLerelesBonus', lereles: 2 },
  },
  inversor: {
    id: 'inversor', name: 'Inversor',
    desc: 'Si terminas el combate con 5+ lereles, ganas 2L extra.',
    category: 'economia', rarity: 'normal', doubleFilo: false,
    effect: { type: 'endCombatLerelesBonus', minLereles: 5, bonus: 2 },
  },
  ahorrador: {
    id: 'ahorrador', name: 'Ahorrador',
    desc: 'Al acabar combate +1L por cada Eco equipado.',
    category: 'economia', rarity: 'normal', doubleFilo: false,
    effect: { type: 'ecoCountLereles', perEco: 1 },
  },
  // ── Economía — Infrecuente ─────────────────────────────────────────────────
  prestamista: {
    id: 'prestamista', name: 'Prestamista',
    desc: 'Empiezas con +5L pero gastas +1L en todo.',
    category: 'economia', rarity: 'infrecuente', doubleFilo: true,
    penalty: '+1L de coste en cada gasto.',
    effect: { type: 'startBonus', lereles: 5, extraCost: 1 },
  },
  // ── Economía — Raro ───────────────────────────────────────────────────────
  economia_guerra: {
    id: 'economia_guerra', name: 'Economía de Guerra',
    desc: 'Acción Segura cuesta 1L pero da el doble de daño.',
    category: 'economia', rarity: 'raro', doubleFilo: false,
    effect: { type: 'accionSeguraPaid', cost: 1, mult: 2 },
  },
  // ── Sinergia — Normal ──────────────────────────────────────────────────────
  duo_dinamico: {
    id: 'duo_dinamico', name: 'Dúo Dinámico',
    desc: 'Si tienes 2 personajes del mismo Set en zona, +1 Aura cada turno.',
    category: 'sinergia', rarity: 'normal', doubleFilo: false,
    effect: { type: 'sameSetZoneBonus', minSameSet: 2, auraPerTurn: 1 },
  },
  numero_suerte: {
    id: 'numero_suerte', name: 'Número de la Suerte',
    desc: 'Parar exactamente en X.07 da +1L.',
    category: 'sinergia', rarity: 'normal', doubleFilo: false,
    effect: { type: 'luckyNumber', centesimas: 7, lereles: 1 },
  },
  // ── Sinergia — Infrecuente ─────────────────────────────────────────────────
  triangulo: {
    id: 'triangulo', name: 'Triángulo',
    desc: 'Con personajes de 3 colores distintos activos, margen +3.',
    category: 'sinergia', rarity: 'infrecuente', doubleFilo: false,
    effect: { type: 'threeColorsBonus', marginBonus: 3 },
  },
  // ── Especial ───────────────────────────────────────────────────────────────
  huevo_oro: {
    id: 'huevo_oro', name: 'Huevo de Oro',
    desc: 'Ocupa los 10 slots. Si completas la run, los Lereles restantes se guardan.',
    category: 'especial', rarity: 'especial', doubleFilo: false,
    effect: { type: 'goldEgg' },
  },
};

export const ECO_BY_RARITY = {
  normal:     Object.values(ECO_LIBRARY).filter(e => e.rarity === 'normal'),
  infrecuente: Object.values(ECO_LIBRARY).filter(e => e.rarity === 'infrecuente'),
  raro:       Object.values(ECO_LIBRARY).filter(e => e.rarity === 'raro'),
  especial:   Object.values(ECO_LIBRARY).filter(e => e.rarity === 'especial'),
};

/** Obtiene N ecos aleatorios del pool según rareza. */
export function getRandomEcos(rarity = 'normal', count = 3) {
  const pool = ECO_BY_RARITY[rarity] ?? ECO_BY_RARITY.normal;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
