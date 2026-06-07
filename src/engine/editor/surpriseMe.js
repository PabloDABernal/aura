/**
 * Generador aleatorio coherente para el editor. GDD sección 12.
 * Genera personajes, lugares y ecos aleatorios según el color elegido.
 */
import { COLORS } from '../../data/colors.js';
import { PLACE_TYPE_IDS } from '../../data/placeTypes.js';

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const CHAR_PREFIXES = ['El', 'La', 'Los', 'Don', 'Sir', 'Lady', 'El Gran', 'La Gran', 'El Último', 'La Primera'];
const CHAR_NAMES = [
  'Destino', 'Sombra', 'Rayo', 'Tormenta', 'Llama', 'Viento', 'Furia',
  'Calma', 'Oscuro', 'Veloz', 'Fuerte', 'Abismo', 'Cumbre', 'Chispa', 'Silencio',
];
const CHAR_PHRASES = [
  'No me rendí nunca.', 'Este es mi camino.', 'Todos me temen.',
  'Solo yo puedo hacerlo.', 'El poder es mío.', 'Nadie me para.',
  'Sigo adelante.', 'Este es mi momento.', 'Lucho por los míos.',
  'El tiempo dirá.', 'No hay vuelta atrás.', 'Yo decido mi destino.',
];

const PLACE_PREFIXES = ['El', 'La', 'Los', 'Las', 'El Gran', 'La Gran'];
const PLACE_NAMES = [
  'Templo', 'Fortaleza', 'Santuario', 'Caverna', 'Pico', 'Llanura',
  'Nexo', 'Torre', 'Portal', 'Arena', 'Coliseo', 'Abismo', 'Lago', 'Cima',
];
const PLACE_ADJECTIVES = [
  'del Caos', 'de la Fuerza', 'Oscuro', 'Eterno', 'Perdido',
  'Prohibido', 'Sagrado', 'Olvidado', 'Maldito', 'Luminoso',
];
const PLACE_ICONS = [
  '🏰', '🌑', '⌛', '🏙️', '⚙️', '💎', '🏟️', '🌀', '🪞', '🔄',
  '🌲', '🏚️', '📚', '✨', '⚰️', '💀', '🔔', '📡', '🧱', '🛡️', '🕰️', '🎵',
  '🌊', '🗻', '🌋', '🏜️', '🌃', '🏛️', '⛩️', '🌌',
];

const ECO_ADJECTIVES = [
  'Estable', 'Caótico', 'Oculto', 'Potente', 'Sutil', 'Brillante',
  'Silencioso', 'Violento', 'Preciso', 'Impredecible',
];
const ECO_NOUNS = ['Pulso', 'Resonancia', 'Vibra', 'Flujo', 'Eco', 'Onda', 'Chispa', 'Ritmo'];
const ECO_EFFECTS = [
  'Margen de acierto +5 centésimas permanente.',
  'El cronómetro corre 20% más lento.',
  'La primera prueba de cada combate es Vibra automática.',
  'Aliados +1 Aura al inicio del combate.',
  'Líderes +2 Aura temporal al inicio del combate.',
  'Al conquistar un lugar +1 Aura permanente a todos los personajes.',
  'Intervención exitosa reduce 0.5s del contador del lugar.',
  'Al acabar un combate +1L por cada Eco equipado.',
  'Parar en X.07 exacto da +1L.',
  'Cada Flow consecutivo +3 centésimas de margen acumulable.',
  'Parar antes de 2s da ×1.5 adicional.',
  'Invitados +1 Aura al robar.',
  'Descartar un Eco desde un lugar da 2L en lugar de 1.',
];

/** Genera un personaje aleatorio coherente con el color. */
export function surpriseCharacter(colorId) {
  const color = COLORS[colorId];
  const activePool  = color?.keywords?.activa ?? [];
  const passivePool = color?.keywords?.pasiva ?? [];

  const activeKw  = activePool.length  > 0 ? pick(activePool)  : '';
  const passiveKw = passivePool.length > 0 ? pick(passivePool) : '';
  const ultCost   = pick([0, 0, 0, 3, 5, 7]);

  return {
    name:       `${pick(CHAR_PREFIXES)} ${pick(CHAR_NAMES)}`,
    phrase:     pick(CHAR_PHRASES),
    activeKw,
    passiveKw:  passiveKw !== activeKw ? passiveKw : '',
    ultCost,
    vibraTarget: randInt(20, 80),
  };
}

/** Genera un lugar aleatorio. */
export function surprisePlace() {
  const typeId    = pick(PLACE_TYPE_IDS);
  const resonance = randInt(16, 40);
  const isPoint   = pick([true, false]);

  return {
    name:      `${pick(PLACE_PREFIXES)} ${pick(PLACE_NAMES)} ${pick(PLACE_ADJECTIVES)}`,
    icon:      pick(PLACE_ICONS),
    type:      typeId,
    resonance,
    vibraMode: isPoint ? 'punto' : 'centesimas',
    target:    isPoint ? randInt(1500, 6500) : randInt(20, 90),
  };
}

/** Genera un Eco aleatorio coherente con la categoría. */
export function surpriseEco(category) {
  const cats    = ['vibra', 'personaje', 'lugar', 'economia', 'sinergia'];
  const cat     = category ?? pick(cats);
  const rarezas = ['normal', 'normal', 'infrecuente', 'raro'];

  return {
    name:        `${pick(ECO_NOUNS)} ${pick(ECO_ADJECTIVES)}`,
    description: pick(ECO_EFFECTS),
    category:    cat,
    rarity:      pick(rarezas),
  };
}
