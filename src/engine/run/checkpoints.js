/**
 * Sistema de checkpoints. GDD sección 5.
 * Checkpoint 1: primer boss, Checkpoint 2: segundo boss, Checkpoint 3: fusionado.
 */
export const CHECKPOINT_NODES = ['boss', 'boss', 'fusionado'];

export function checkCheckpoint(run) {
  const passed = run.checkpointsPassed?.length ?? 0;
  if (passed >= 3) return null;

  const area  = run.areas[run.currentAreaIndex];
  const node  = area?.nodes[area.currentNodeIndex ?? 0];
  if (!node?.completed) return null;

  if (node.type === 'fusionado' && passed < 3) return 3;
  if (node.type === 'boss' && passed < 2) return passed + 1;
  return null;
}

/** Experiencia ganada por personaje según checkpoint más alto. */
export function getRunExperience(checkpointsPassed) {
  const highest = Math.max(0, ...checkpointsPassed);
  if (highest === 0) return 'minimal';
  if (highest === 1) return 'low';
  if (highest === 2) return 'medium';
  return 'high';
}

/** Subida de nivel de run de una carta. */
export function getRunLevelUp(currentLevel, experience) {
  const order = ['comun', 'infrecuente', 'rara', 'legendaria'];
  const steps = { minimal: 0, low: 1, medium: 1, high: 2 };
  const idx = order.indexOf(currentLevel ?? 'comun');
  const newIdx = Math.min(order.length - 1, idx + (steps[experience] ?? 0));
  return order[newIdx];
}
