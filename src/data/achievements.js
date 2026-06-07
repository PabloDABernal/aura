export const ACHIEVEMENTS = {
  // Logros de Run
  run_duo:        { id: 'run_duo',        icon: '👑', name: 'Dúo',              desc: 'Completa una run con 2 líderes',          reward: 'Eco especial' },
  run_trio:       { id: 'run_trio',       icon: '👑👑', name: 'Trío',             desc: 'Completa una run con 3 líderes',          reward: 'Eco especial' },
  run_quartet:    { id: 'run_quartet',    icon: '👑👑👑', name: 'Cuarteto',         desc: 'Completa una run con 4 líderes',          reward: 'Eco especial' },
  run_quintet:    { id: 'run_quintet',    icon: '👑👑👑👑', name: 'Quinteto',         desc: 'Completa una run con 5 líderes',          reward: 'Eco especial' },
  // Logros de Vibra
  en_el_flow:     { id: 'en_el_flow',     icon: '✨', name: 'En el Flow',        desc: 'Consigue 10 Flows en una misma run',      reward: 'Eco Adrenalina' },
  manos_limpias:  { id: 'manos_limpias',  icon: '🤍', name: 'Manos Limpias',     desc: 'Completa una run sin ninguna Pifia',      reward: 'Eco Manos Limpias' },
  relampago:      { id: 'relampago',      icon: '⚡', name: 'Relámpago',         desc: 'Completa una run con menos de 3min de Vibración', reward: 'Eco Relámpago' },
  perfeccionista: { id: 'perfeccionista', icon: '💎', name: 'Perfeccionista',    desc: '5 Flows seguidos en un mismo combate',    reward: '+5 puntos' },
  sin_red:        { id: 'sin_red',        icon: '🎯', name: 'Sin Red',           desc: 'Gana un combate usando solo Vibra (nunca Acción Segura)', reward: '+3 puntos' },
  // Logros de Colección
  primer_set:     { id: 'primer_set',     icon: '📦', name: 'Primer Set',        desc: 'Confirma tu primer Set',                  reward: '+10 puntos' },
  coleccionista:  { id: 'coleccionista',  icon: '🏆', name: 'Coleccionista Serio', desc: 'Confirma 5 Sets',                       reward: 'Slot de Set extra' },
  el_archivo:     { id: 'el_archivo',     icon: '🗂️', name: 'El Archivo',        desc: 'Gana con 10 Ecos activos',                reward: 'Eco El Archivo' },
  abraza_caos:    { id: 'abraza_caos',    icon: '🌀', name: 'Abraza el Caos',    desc: 'Completa una run con 3+ Ecos de doble filo', reward: 'Eco Abraza el Caos' },
  // Logros de Corrupción
  purificador:    { id: 'purificador',    icon: '✨', name: 'Purificador',       desc: 'Derrota al Fusionado por primera vez',    reward: '+5 puntos' },
  sin_piedad:     { id: 'sin_piedad',     icon: '☠️', name: 'Sin Piedad',        desc: 'Derrota un boss sin recibir daño',        reward: '+3 puntos' },
  col_completo:   { id: 'col_completo',   icon: '📚', name: 'Coleccionista Completo', desc: 'Todos los personajes de un Set en grado 5', reward: '+10 puntos' },
  psa_10:         { id: 'psa_10',         icon: '💰', name: 'PSA 10',            desc: 'Un personaje llega al grado 10',          reward: '+20 puntos' },
};

/** Comprueba logros tras una run. Devuelve array de ids desbloqueados. */
export function checkRunAchievements(runResult, currentAchievements) {
  const unlocked = [];
  const already  = (id) => currentAchievements[id]?.unlocked;

  if (!already('primer_set') && runResult.setsConfirmed > 0) unlocked.push('primer_set');
  if (!already('run_duo') && runResult.leadersUsed === 2 && runResult.win) unlocked.push('run_duo');
  if (!already('run_trio') && runResult.leadersUsed === 3 && runResult.win) unlocked.push('run_trio');
  if (!already('en_el_flow') && runResult.totalFlows >= 10) unlocked.push('en_el_flow');
  if (!already('manos_limpias') && runResult.totalPifias === 0 && runResult.win) unlocked.push('manos_limpias');
  if (!already('relampago') && runResult.vibrationTimeMs < 180000 && runResult.win) unlocked.push('relampago');
  if (!already('purificador') && runResult.defeatedFused) unlocked.push('purificador');

  return unlocked;
}
