import { applyViral }          from './viral.js';
import { applyTendencia }      from './tendencia.js';
import { applyInspirador }     from './inspirador.js';
import { applyPolemico }       from './polemico.js';

/**
 * Registro de keyword handlers. SDD sección 4.8.
 * Hooks: onActivate, onRest, onAllyEnter, onTargeted
 */
export const KEYWORD_HANDLERS = {
  viral:          { hook: 'onActivate',   apply: applyViral },
  tendencia:      { hook: 'onRest',       apply: applyTendencia },
  inspirador:     { hook: 'onAllyEnter',  apply: applyInspirador },
  polemico:       { hook: 'onActivate',   apply: applyPolemico },
  // desenmascarado es pasiva — se aplica en applyDamageToChar del reducer
};
