/** Desenmascarado (pasiva): reduce el daño entrante en Math.ceil(presencia/2). */
export function getDrawReduction(slot) {
  return Math.ceil((slot?.presencia ?? 0) / 2);
}
