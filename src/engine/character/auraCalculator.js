/**
 * Calcula el Aura total de un personaje según sus habilidades.
 * Funciones puras - sin React. SDD sección 4.5.
 */

export function leaderAura(character) {
  let aura = 8;
  if (character.leader.activeAbility)        aura -= 1;
  if (character.leader.passiveAbility)       aura -= 1;
  if ((character.leader.ultimate?.cost) >= 5) aura -= 1;
  return aura; // 5..8
}

export function guestAura(character) {
  const g = character.guest;
  let count = 0;
  if ((g.inheritedAbilityIds?.length ?? 0) > 0) count++;
  if (g.onDrawOrInHQ?.ability)                 count++;
  if (g.onDiscard?.fromHQ)                     count++;
  if (g.onDiscard?.fromZone)                   count++;
  return Math.max(1, 5 - count);
}

export function corruptAura(character, combatType = 'basic') {
  const base = leaderAura(character);
  const mults = { basic: 3, elite: 10, boss: 20, fused: 10 };
  return base * (mults[combatType] ?? 3);
}
