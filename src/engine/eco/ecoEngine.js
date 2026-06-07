import { ECO_LIBRARY } from '../../data/ecoLibrary.js';
import { ECO_HOOKS } from './ecoHooks.js';

// Maps each effect.type to the hook that fires it.
// UI-layer effects (timerSpeed, marginBonus, etc.) are null — handled outside the reducer.
const EFFECT_HOOK_MAP = {
  sameSecondBonus:       ECO_HOOKS.ON_VIBRA_RESULT,
  flowStreakMargin:       ECO_HOOKS.ON_VIBRA_RESULT,
  earlyStopMult:         ECO_HOOKS.ON_VIBRA_RESULT,
  perfectFlow:           ECO_HOOKS.ON_VIBRA_RESULT,
  randomTarget:          ECO_HOOKS.ON_VIBRA_RESULT,
  luckyNumber:           ECO_HOOKS.ON_VIBRA_RESULT,

  hqGuestAura:           ECO_HOOKS.ON_COMBAT_START,
  sameColorBonus:        ECO_HOOKS.ON_COMBAT_START,
  startAuraBonus:        ECO_HOOKS.ON_COMBAT_START,
  startBonus:            ECO_HOOKS.ON_COMBAT_START,

  leaderTempleFloor:     ECO_HOOKS.ON_KO,
  koChainBonus:          ECO_HOOKS.ON_KO,

  sameSetConquerLereles: ECO_HOOKS.ON_PLACE_CONQUERED,
  conquerHealAll:        ECO_HOOKS.ON_PLACE_CONQUERED,
  multiConquerBonus:     ECO_HOOKS.ON_PLACE_CONQUERED,

  endCombatLerelesBonus: ECO_HOOKS.ON_NODE_COMPLETE,
  ecoCountLereles:       ECO_HOOKS.ON_NODE_COMPLETE,
  goldEgg:               ECO_HOOKS.ON_NODE_COMPLETE,
};

// context = { state: CombatState, ...hookData }
// Each applier returns the updated context.
const EFFECT_APPLIERS = {
  // ON_PLACE_CONQUERED: heal all non-KO characters by eco.effect.aura
  conquerHealAll(ctx, eco) {
    const aura = eco.effect.aura ?? 1;
    const heal = slot => slot.isKO ? slot : { ...slot, presencia: slot.presencia + aura };
    const st = ctx.state;
    return {
      ...ctx,
      state: {
        ...st,
        hq:     st.hq.map(heal),
        pit:    st.pit.map(heal),
        places: st.places.map(p => ({ ...p, occupants: p.occupants.map(heal) })),
      },
    };
  },

  // ON_KO: mark that the next character to act gets +aura bonus
  koChainBonus(ctx, eco) {
    const bonus = eco.effect.aura ?? 2;
    return {
      ...ctx,
      state: { ...ctx.state, pendingKoBonus: (ctx.state.pendingKoBonus ?? 0) + bonus },
    };
  },
};

/**
 * Pure function. Iterates active ecos, applies those that react to `hook`.
 * @param {string} hook - ECO_HOOKS constant
 * @param {{ state: object, [key: string]: any }} context
 * @param {string[]} activeEcos - array of eco IDs from run
 * @returns updated context
 */
export function applyEcos(hook, context, activeEcos = []) {
  if (!activeEcos.length) return context;
  let ctx = context;
  for (const ecoId of activeEcos) {
    const eco = ECO_LIBRARY[ecoId];
    if (!eco) continue;
    if (EFFECT_HOOK_MAP[eco.effect?.type] !== hook) continue;
    const applier = EFFECT_APPLIERS[eco.effect.type];
    if (applier) ctx = applier(ctx, eco);
  }
  return ctx;
}
