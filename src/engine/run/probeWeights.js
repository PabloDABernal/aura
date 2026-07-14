/**
 * Numeric difficulty weights per probe type — GDD v4.0 §4.1.
 * Higher = harder. Used to select probe 10 (max weight ≥7).
 * Mercy run uses the lowest-weight probe instead.
 */
export const PROBE_WEIGHTS = {
  // 4.1 Precision — always available
  bingo:            4,
  xopportunities:   5,
  // 4.5 Cálculo — always available
  suma100:          5,
  equilibrio:       5,
  banca:            6,
  doblenada:        6,
  // Cadena — grade 3+
  cadena:           6,
  // 4.2 Memoria — grade 4+
  memoria:          7,
  ciego:            7,
  cuentainterna:    6,
  // 4.4 Percepción — grade 4+
  pendulo:          6,
  espejo:           6,
  parpadeo:         7,
  rebote:           7,
  cadenciafantasma: 7,
  cargaenergia:     7,
  // 4.3 Ritmo — grade 7+
  ecovisual:        8,
  poliritmo:        8,
  sincroniafase:    9,
  // 4.6 Azar — grade 7+
  pacto:            8,
};
