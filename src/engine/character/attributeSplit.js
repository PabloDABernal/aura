import { COLORS } from '../../data/colors.js';

/**
 * Reparte el Aura total en Presencia/Influencia/Temple según el perfil del color.
 * El resto va a Temple para cuadrar exacto. SDD sección 4.5.
 */
export function split(total, colorId) {
  const { presencia, influencia } = COLORS[colorId].split;
  const p = Math.round(total * presencia);
  const i = Math.round(total * influencia);
  const t = total - p - i;
  return { presencia: p, influencia: i, temple: t };
}
