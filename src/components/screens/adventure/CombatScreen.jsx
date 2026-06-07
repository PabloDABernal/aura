import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence }           from 'framer-motion';
import useStore                              from '../../../store/index.js';
import TimingChallenge                       from '../../vibra/TimingChallenge.jsx';
import TutorialOverlay                       from '../../ui/TutorialOverlay.jsx';
import { CHARACTERS, PLACES }               from '../../../data/phase1Data.js';
import { ABILITIES }                        from '../../../data/abilities.js';
import { findCharSlot, findCharLocation }   from '../../../engine/combat/combatReducer.js';
import { guestAura }                        from '../../../engine/character/auraCalculator.js';
import { split }                            from '../../../engine/character/attributeSplit.js';
import {
  COLORS_UI, COLORS_GAME, TYPOGRAPHY, SPACING, BORDERS,
} from '../../../styles/tokens.js';

// Iconos para el log según palabras clave
function getLogIcon(msg) {
  if (!msg) return '';
  if (msg.includes('FLOW') || msg.includes('Flow'))        return '⚡';
  if (msg.includes('PIFIA') || msg.includes('Pifia') || msg.includes('pifia')) return '🌀';
  if (msg.includes('FALLO') || msg.includes('fallo') || msg.includes('Fallo') || msg.includes('Sin efecto') || msg.includes('timeout')) return '💨';
  if (msg.includes('VIBRA') || msg.includes('vibra'))      return '💚';
  if (msg.includes('esquiva') || msg.includes('PARRY') || msg.includes('ESQUIVAR')) return '🛡️';
  if (msg.includes('KO') || msg.includes('cae KO'))        return '💀';
  if (msg.includes('reanimado') || msg.includes('Reanimar')) return '💊';
  if (msg.includes('inflige') || msg.includes('daño') || msg.includes('reduce') || msg.includes('Acción Segura')) return '⚔️';
  if (msg.includes('descansa'))  return '💤';
  if (msg.includes('+1 Presencia') || msg.includes('+1 Influencia') || msg.includes('+1 Temple') || msg.includes('_up')) return '↑';
  if (msg.includes('Conquista') || msg.includes('conquistado')) return '🏆';
  return '•';
}

function getLogColor(msg) {
  if (msg.includes('FLOW'))     return '#FFD700';
  if (msg.includes('VIBRA'))    return '#3BA84F';
  if (msg.includes('PIFIA') || msg.includes('Pifia') || msg.includes('KO')) return '#E03B3B';
  if (msg.includes('FALLO') || msg.includes('Sin efecto')) return '#E0823B';
  if (msg.includes('esquiva') || msg.includes('PARRY'))    return '#3BA84F';
  if (msg.includes('Conquista')) return '#FFD700';
  return null; // usa textSecondary
}

const KEYWORD_DESCRIPTIONS = {
  viral:          'Activa: +X Presencia por aliado en zona',
  tendencia:      'Pasiva: +X Temple al Descansar',
  inspirador:     'Pasiva: +X Aura al aliado que entra',
  polemico:       'Activa: +X Influencia por aliado en Lugar',
  desenmascarado: 'Pasiva: daño extra si enemigo con doble daño',
};

const KW_ICONS = {
  viral:          '⚡',
  tendencia:      '🌀',
  inspirador:     '✨',
  polemico:       '💢',
  desenmascarado: '🔍',
};

const INTENT_ICONS = {
  rest:            '🛡️',
  presencia_up:    '⬆️',
  influencia_up:   '🌀',
  temple_up:       '🔰',
  attack_place:    '⚔️',
  intervene_place: '✨',
};

// ─── util ────────────────────────────────────────────────────────────────────

const COLOR_HEX = {
  rojo:    COLORS_GAME.rojo,
  verde:   COLORS_GAME.verde,
  morado:  COLORS_GAME.morado,
  negro:   '#4A4A5A',
  naranja: COLORS_GAME.naranja,
};

function auraTotal(slot) { return (slot?.presencia ?? 0) + (slot?.influencia ?? 0) + (slot?.temple ?? 0); }

function msToMinSec(ms) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function vibTimeColor(ms) {
  if (ms >= 480000) return '#E03B3B';   // >8min rojo
  if (ms >= 300000) return '#E0823B';   // >5min naranja
  return '#3BA84F';                      // verde
}

// ─── componentes pequeños ────────────────────────────────────────────────────

function AuraBar({ current, max, color = '#3BA84F', height = 6 }) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;
  return (
    <div style={{ width: '100%', height, background: '#222230', borderRadius: 3, overflow: 'hidden' }}>
      <motion.div
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.3 }}
        style={{ height: '100%', background: color, borderRadius: 3 }}
      />
    </div>
  );
}

function AttrPips({ presencia, influencia, temple }) {
  const total = presencia + influencia + temple;
  return (
    <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
      {Array.from({ length: Math.min(total, 12) }, (_, i) => {
        let bg = '#777';
        if (i < presencia) bg = COLORS_GAME.rojo;
        else if (i < presencia + influencia) bg = COLORS_GAME.morado;
        else bg = COLORS_GAME.verde;
        return <div key={i} style={{ width: 5, height: 5, borderRadius: 1, background: bg }} />;
      })}
    </div>
  );
}

function AttrBars({ presencia, influencia, temple }) {
  const max = Math.max(presencia + influencia + temple, 1);
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2, marginTop: 3 }}>
      {[
        { v: presencia,  c: COLORS_GAME.rojo },
        { v: influencia, c: COLORS_GAME.morado },
        { v: temple,     c: COLORS_GAME.verde },
      ].map(({ v, c }, i) => (
        <div key={i} style={{ width: '100%', height: 3, background: '#222230', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${(v / max) * 100}%`, height: '100%', background: c, borderRadius: 2 }} />
        </div>
      ))}
    </div>
  );
}

function EnemyAttrRow({ enemy }) {
  const prevRef = useRef({ presencia: enemy.presencia, influencia: enemy.influencia, temple: enemy.temple });
  const [delta, setDelta] = useState(null);

  useEffect(() => {
    const prev = prevRef.current;
    let changed = null;
    if (enemy.presencia > prev.presencia)   changed = 'presencia';
    else if (enemy.influencia > prev.influencia) changed = 'influencia';
    else if (enemy.temple > prev.temple)    changed = 'temple';
    prevRef.current = { presencia: enemy.presencia, influencia: enemy.influencia, temple: enemy.temple };
    if (changed) setDelta(changed);
  }, [enemy.presencia, enemy.influencia, enemy.temple]);

  useEffect(() => {
    if (!delta) return;
    const t = setTimeout(() => setDelta(null), 1200);
    return () => clearTimeout(t);
  }, [delta]);

  const attrColor = { presencia: COLORS_GAME.rojo, influencia: COLORS_GAME.morado, temple: COLORS_GAME.verde };
  const labels    = { presencia: 'P', influencia: 'I', temple: 'T' };

  return (
    <div style={{ display: 'flex', gap: SPACING[2], marginTop: 3, fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '9px' }}>
      {['presencia', 'influencia', 'temple'].map(attr => (
        <span key={attr} style={{ color: attrColor[attr], position: 'relative' }}>
          {labels[attr]}:{enemy[attr] ?? 0}
          {delta === attr && (
            <motion.span
              initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -8 }}
              transition={{ duration: 1 }}
              style={{ position: 'absolute', left: '100%', top: -2, color: attrColor[attr], fontWeight: 'bold', fontSize: '8px', whiteSpace: 'nowrap' }}
            >
              +1
            </motion.span>
          )}
        </span>
      ))}
    </div>
  );
}

function resultColor(r) {
  if (r === 'flow')    return '#FFD700';
  if (r === 'hit')     return COLORS_GAME.verde;
  if (r === 'pifia')   return COLORS_GAME.rojo;
  return COLORS_GAME.naranja;
}
function resultIcon(r) {
  if (r === 'flow')   return '⚡';
  if (r === 'hit')    return '💚';
  if (r === 'pifia')  return '🌀';
  return '💨';
}
function resultLabel(r) {
  if (r === 'flow')    return 'FLOW';
  if (r === 'hit')     return 'HIT';
  if (r === 'fail')    return 'FALLO';
  if (r === 'timeout') return 'TIMEOUT';
  if (r === 'pifia')   return 'PIFIA';
  return r?.toUpperCase() ?? '';
}

function CharCard({ slot, charDef, selected, onSelect, compact = false }) {
  if (!slot || !charDef) return null;
  const total     = auraTotal(slot);
  const color     = COLOR_HEX[charDef.colorId] ?? COLORS_UI.border;
  const isKO      = slot.isKO;
  const exhst     = slot.exhausted;
  const clickable = !isKO || slot.isLeader;

  const [tooltip, setTooltip] = useState(false);
  const lpRef = useRef(null);

  const onPtrDown = () => { lpRef.current = setTimeout(() => setTooltip(true), 500); };
  const onPtrUp   = () => { clearTimeout(lpRef.current); };
  const onPtrLeave= () => { clearTimeout(lpRef.current); setTooltip(false); };

  const hasActive  = !!charDef.leader?.activeAbility;
  const hasPassive = !!charDef.leader?.passiveAbility;

  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      onClick={() => clickable && onSelect?.()}
      onPointerDown={onPtrDown}
      onPointerUp={onPtrUp}
      onPointerLeave={onPtrLeave}
      style={{
        width:         compact ? 72  : 88,
        minHeight:     compact ? 72  : 96,
        background:    selected ? `${color}22` : COLORS_UI.bgCard,
        border:        `2px solid ${selected ? color : isKO ? '#661111' : exhst ? '#3a3a4a' : COLORS_UI.border}`,
        borderRadius:  BORDERS.radius.md,
        padding:       SPACING[2],
        cursor:        clickable ? 'pointer' : 'not-allowed',
        opacity:       isKO ? 0.2 : exhst ? 0.4 : 1,
        position:      'relative',
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        gap:           2,
        flexShrink:    0,
        userSelect:    'none',
      }}
    >
      {isKO && (
        <div style={{ position:'absolute', top: 2, right: 4, fontSize: '10px', color: '#E03B3B' }}>KO</div>
      )}
      <div style={{ fontSize: compact ? 18 : 22 }}>{charDef.basics.emoji}</div>
      <div style={{
        fontFamily:  TYPOGRAPHY.fontFamily,
        fontSize:    TYPOGRAPHY.size.xs,
        fontWeight:  TYPOGRAPHY.weight.bold,
        color:       isKO ? '#664444' : color,
        textAlign:   'center',
        lineHeight:  1.1,
        maxWidth:    '100%',
        overflow:    'hidden',
        textOverflow:'ellipsis',
        whiteSpace:  'nowrap',
      }}>
        {charDef.basics.name}
      </div>
      {/* Aura total grande */}
      <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: compact ? TYPOGRAPHY.size.sm : TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.bold, color: isKO ? '#664444' : COLORS_UI.textSecondary }}>
        {total}
      </div>
      {!compact && <AttrBars presencia={slot.presencia} influencia={slot.influencia} temple={slot.temple} />}

      {/* Ability buttons — disabled "próximamente" (2.2) */}
      {slot.activeAbilities?.length > 0 && !compact && (
        <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', marginTop: 2 }}>
          {slot.activeAbilities.slice(0, 2).map(abilityId => {
            const ab = ABILITIES[abilityId];
            if (!ab) return null;
            return (
              <div key={abilityId} title="Próximamente" style={{
                fontSize: '8px', background: '#1e1e2a', color: COLORS_UI.textMuted,
                borderRadius: 2, padding: '1px 4px', fontFamily: TYPOGRAPHY.fontFamily,
                border: '1px solid #3a3a4a', cursor: 'not-allowed', opacity: 0.6,
              }}>
                {ab.icon} {ab.name}
              </div>
            );
          })}
        </div>
      )}

      {/* Keywords visibles */}
      {(() => {
        const kwIds = [
          ...(charDef.leader?.activeAbility?.keywordIds ?? []),
          ...(charDef.leader?.passiveAbility?.keywordIds ?? []),
          ...(charDef.guest?.inheritedAbilityIds ?? []),
        ].filter(Boolean);
        if (kwIds.length === 0) return null;
        return (
          <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', marginTop: 2 }}>
            {kwIds.slice(0, 2).map(kw => (
              <span key={kw} style={{
                fontSize: '9px', background: color + '22', color,
                borderRadius: 2, padding: '1px 3px', fontFamily: TYPOGRAPHY.fontFamily,
              }}>
                {KW_ICONS[kw] ?? '◆'}
              </span>
            ))}
          </div>
        );
      })()}

      {/* Tooltip habilidades (long press) */}
      {tooltip && (hasActive || hasPassive) && (
        <div
          onPointerDown={e => e.stopPropagation()}
          style={{
            position:   'absolute',
            top:        '105%',
            left:       '50%',
            transform:  'translateX(-50%)',
            zIndex:     500,
            background: COLORS_UI.bgElevated,
            border:     `1px solid ${color}66`,
            borderRadius: BORDERS.radius.md,
            padding:    SPACING[2],
            minWidth:   160,
            maxWidth:   240,
            boxShadow:  '0 4px 16px rgba(0,0,0,0.6)',
            fontFamily: TYPOGRAPHY.fontFamily,
            fontSize:   TYPOGRAPHY.size.xs,
            color:      COLORS_UI.text,
            lineHeight: 1.4,
          }}
        >
          {hasActive && (
            <div style={{ marginBottom: hasPassive ? 6 : 0 }}>
              <span style={{ fontWeight: TYPOGRAPHY.weight.bold, color }}>
                {charDef.leader.activeAbility.keywordIds[0]}
              </span>
              {' — '}
              {KEYWORD_DESCRIPTIONS[charDef.leader.activeAbility.keywordIds[0]] ?? ''}
            </div>
          )}
          {hasPassive && (
            <div>
              <span style={{ fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.textSecondary }}>
                {charDef.leader.passiveAbility.keywordIds[0]}
              </span>
              {' — '}
              {KEYWORD_DESCRIPTIONS[charDef.leader.passiveAbility.keywordIds[0]] ?? ''}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function EmptySlot({ label }) {
  return (
    <div style={{
      width: 72, minHeight: 72,
      background: 'rgba(255,255,255,0.02)',
      border: `1px dashed ${COLORS_UI.border}`,
      borderRadius: BORDERS.radius.md,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: COLORS_UI.textMuted, fontSize: TYPOGRAPHY.size.xs,
      flexShrink: 0,
    }}>
      {label}
    </div>
  );
}

// ─── panel de acciones del personaje seleccionado ────────────────────────────

function ActionPanel({ sel, combat, onAction, onClose, chars, placeDefs }) {
  const { characterId, zone, zoneIndex } = sel;
  const slot    = findCharSlot(combat, characterId);
  const charDef = chars[characterId];
  if (!slot || !charDef) return null;

  const enemy     = combat.enemies[0];
  const place     = combat.places[0];
  const pitFull   = combat.pit.length >= 5;
  const placeFull = (place?.occupants.length ?? 5) >= 5;
  const hqFull    = combat.hq.length >= 5;

  const canMoveToFoso   = zone === 'hq' && !pitFull && !slot.isKO;
  const canMoveToLugar  = zone === 'hq' && !placeFull && !slot.isKO;
  const canMoveToHQ     = (zone === 'pit' || zone === 'place') && slot.isLeader && !hqFull;
  const canRest         = zone === 'hq' && slot.exhausted && !slot.isKO;
  const canRevive       = slot.isKO && slot.isLeader && combat.lereles >= 5;
  const hasActiveKw     = !!charDef.leader?.activeAbility && !slot.exhausted && (zone === 'pit' || zone === 'place');

  const btnStyle = (color = COLORS_UI.bgElevated) => ({
    padding:      `${SPACING[2]} ${SPACING[3]}`,
    background:   color,
    border:       `1px solid ${COLORS_UI.border}`,
    borderRadius: BORDERS.radius.md,
    color:        COLORS_UI.text,
    fontFamily:   TYPOGRAPHY.fontFamily,
    fontSize:     TYPOGRAPHY.size.sm,
    fontWeight:   TYPOGRAPHY.weight.bold,
    cursor:       'pointer',
    textAlign:    'center',
  });

  const dispatch = (type, payload) => { onAction({ type, payload }); };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      style={{
        position:      'fixed',
        bottom:        0,
        left:          0,
        right:         0,
        background:    COLORS_UI.bgElevated,
        border:        `1px solid ${COLORS_UI.border}`,
        borderRadius:  `${BORDERS.radius.lg} ${BORDERS.radius.lg} 0 0`,
        padding:       SPACING[4],
        zIndex:        200,
        display:       'flex',
        flexDirection: 'column',
        gap:           SPACING[3],
        maxWidth:      460,
        margin:        '0 auto',
      }}
    >
      {/* header con P/I/T */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontWeight: TYPOGRAPHY.weight.black, color: COLOR_HEX[charDef.colorId] }}>
            {charDef.basics.emoji} {charDef.basics.name}
          </span>
          <div style={{ display: 'flex', gap: SPACING[2], fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, marginTop: 2 }}>
            <span style={{ color: COLORS_GAME.rojo }}>P:{slot.presencia}</span>
            <span style={{ color: COLORS_GAME.morado }}>I:{slot.influencia}</span>
            <span style={{ color: COLORS_GAME.verde }}>T:{slot.temple}</span>
          </div>
        </div>
        <button onClick={onClose} style={{ ...btnStyle(), padding: '2px 10px', color: COLORS_UI.textMuted }}>✕</button>
      </div>

      {/* botones de acción */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SPACING[2] }}>

        {hasActiveKw && (
          <button style={btnStyle(COLORS_GAME.verde + '22')}
            onClick={() => dispatch('USE_ACTIVE_KEYWORD', { characterId })}>
            ✨ {charDef.leader.activeAbility.keywordIds[0].toUpperCase()}
          </button>
        )}

        {canMoveToFoso && (
          <button style={btnStyle()} onClick={() => dispatch('MOVE_CHARACTER', { characterId, from: 'hq', to: 'pit' })}>
            → Foso
          </button>
        )}
        {canMoveToLugar && (
          <button style={btnStyle()} onClick={() => dispatch('MOVE_CHARACTER', { characterId, from: 'hq', to: 'place', toPlaceIndex: 0 })}>
            → Lugar
          </button>
        )}
        {canMoveToHQ && zone === 'pit' && (
          <button style={btnStyle()} onClick={() => dispatch('MOVE_CHARACTER', { characterId, from: 'pit', to: 'hq' })}>
            ← HQ
          </button>
        )}
        {canMoveToHQ && zone === 'place' && (
          <button style={btnStyle()} onClick={() => dispatch('MOVE_CHARACTER', { characterId, from: 'place', to: 'hq', fromPlaceIndex: zoneIndex ?? 0 })}>
            ← HQ
          </button>
        )}
        {canRest && (
          <button style={btnStyle(COLORS_GAME.verde + '22')} onClick={() => dispatch('REST_CHARACTER', { characterId })}>
            💤 Descansar
          </button>
        )}
        {canRevive && (
          <button style={{ ...btnStyle(COLORS_GAME.rojo + '22'), gridColumn: '1/3' }}
            onClick={() => dispatch('REVIVE_LEADER', { characterId })}>
            💊 Reanimar (-5L)
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── overlay de victoria / derrota ───────────────────────────────────────────

function VictoryOverlay({ victory, onRestart, onNewGame }) {
  const isWin = victory === 'win';
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(6,6,10,0.95)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        zIndex: 500, gap: SPACING[6],
      }}
    >
      <div style={{ fontSize: 64 }}>{isWin ? '🏆' : '💀'}</div>
      <div style={{
        fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size['3xl'],
        fontWeight: TYPOGRAPHY.weight.black, color: isWin ? COLORS_GAME.verde : COLORS_GAME.rojo,
        letterSpacing: '0.1em',
      }}>
        {isWin ? 'VICTORIA' : 'DERROTA'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2], alignItems: 'center' }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onRestart}
          style={{
            padding: `${SPACING[4]} ${SPACING[8]}`, background: isWin ? '#FFD700' : COLORS_GAME.rojo,
            border: 'none', borderRadius: BORDERS.radius.xl, color: isWin ? '#000' : 'white',
            fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg,
            fontWeight: TYPOGRAPHY.weight.black, letterSpacing: '0.1em', cursor: 'pointer',
            boxShadow: `0 6px 32px ${isWin ? '#FFD700' : COLORS_GAME.rojo}66`,
          }}
        >
          {isWin ? 'VER RECOMPENSAS ✨' : 'VER RESULTADO'}
        </motion.button>
        <button onClick={onNewGame} style={{ background: 'none', border: 'none', color: COLORS_UI.textMuted, cursor: 'pointer', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm }}>
          Nueva partida
        </button>
      </div>
    </motion.div>
  );
}

// ─── pantalla principal ───────────────────────────────────────────────────────

export default function CombatScreen() {
  const combat         = useStore(s => s.combat);
  const dispatchCombat = useStore(s => s.dispatchCombat);
  const resetCombat    = useStore(s => s.resetCombat);
  const setScreen      = useStore(s => s.setScreen);
  const run            = useStore(s => s.run);
  const completeNode   = useStore(s => s.completeNode);
  const updateRun      = useStore(s => s.updateRun);
  const setRun         = useStore(s => s.setRun);
  const collection     = useStore(s => s.collection);

  const chars     = useMemo(() => ({ ...CHARACTERS, ...(collection?.characters ?? {}) }), [collection]);
  const placeDefs = useMemo(() => ({ ...PLACES,     ...(collection?.places ?? {}) }),     [collection]);

  const [selected,   setSelected]  = useState(null);
  const [deckOpen,   setDeckOpen]  = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => !localStorage.getItem('aura_tutorial_seen'));
  const [abandonConfirm, setAbandonConfirm] = useState(false);
  const [vibraResult, setVibraResult] = useState(null);
  const logRef = useRef(null);

  const [hqHintSeen,  setHqHintSeen]  = useState(() => !!localStorage.getItem('aura_hint_move_seen'));
  const [pitHintSeen, setPitHintSeen] = useState(() => !!localStorage.getItem('aura_hint_pit_seen'));
  const [enemyTurnCount, setEnemyTurnCount] = useState(0);
  const prevTurnRef = useRef(combat.turn);

  useEffect(() => {
    if (prevTurnRef.current === 'enemy' && combat.turn === 'player') {
      setEnemyTurnCount(n => n + 1);
    }
    prevTurnRef.current = combat.turn;
  }, [combat.turn]);

  const totalInZones = (combat.pit ?? []).length;

  useEffect(() => {
    if (!hqHintSeen && totalInZones > 0) {
      localStorage.setItem('aura_hint_move_seen', '1');
      setHqHintSeen(true);
    }
  }, [hqHintSeen, totalInZones]);

  useEffect(() => {
    if (!pitHintSeen && selected?.zone === 'pit') {
      localStorage.setItem('aura_hint_pit_seen', '1');
      setPitHintSeen(true);
    }
  }, [pitHintSeen, selected]);

  const showHqHint  = !hqHintSeen  && enemyTurnCount >= 2 && totalInZones === 0 && combat.hq.length > 0 && !combat.victory;
  const showPitHint = !pitHintSeen && combat.pit.length > 0 && !combat.victory;

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [combat.log]);

  const dispatch = useCallback((action) => {
    dispatchCombat(action);
    setSelected(null);
  }, [dispatchCombat]);

  // Auto-ejecutar turno del rival después de 1.5s
  useEffect(() => {
    if (
      combat.turn !== 'enemy' ||
      combat.pendingDefensiveVibra ||
      combat.pendingVibra ||
      combat.victory
    ) return;

    const t = setTimeout(() => dispatch({ type: 'ENEMY_TURN' }), 1500);
    return () => clearTimeout(t);
  }, [combat.turn, combat.pendingDefensiveVibra, combat.pendingVibra, combat.victory, dispatch]);

  const enemy   = combat.enemies[0];
  const place   = combat.places[0];
  const vibPct  = Math.min(100, (combat.vibrationTime / 600000) * 100);
  const vColor  = vibTimeColor(combat.vibrationTime);
  const placeDef = placeDefs[place?.placeId];
  const enemyDef = chars[enemy?.characterId];

  const pitActiveChars   = combat.pit.filter(s => !s.exhausted && !s.isKO);
  const placeActiveChars = (place?.occupants ?? []).filter(s => !s.exhausted && !s.isKO);
  const pitTotalP        = pitActiveChars.reduce((sum, s) => sum + Math.max(s.presencia, 2), 0);
  const placeTotalI      = placeActiveChars.reduce((sum, s) => sum + Math.max(s.influencia, 2), 0);

  // ── Selección de personaje ─────────────────────────────────────────────────
  function handleSelectChar(characterId) {
    if (combat.turn !== 'player' || combat.victory) return;
    const loc = findCharLocation(combat, characterId);
    if (!loc) return;
    setSelected(prev =>
      prev?.characterId === characterId ? null
      : { characterId, zone: loc.zone, zoneIndex: loc.zoneIndex }
    );
  }

  return (
    <div style={{
      height:        '100vh',
      background:    COLORS_UI.bg,
      display:       'flex',
      flexDirection: 'column',
      maxWidth:      460,
      margin:        '0 auto',
      position:      'relative',
      overflowX:     'hidden',
      overflowY:     'auto',
    }}>

      {/* ── HEADER ── */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        `${SPACING[2]} ${SPACING[3]}`,
        background:     COLORS_UI.bgCard,
        borderBottom:   `1px solid ${COLORS_UI.border}`,
        gap:            SPACING[2],
      }}>
        {/* Tiempo de Vibración */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: vColor }}>
              Vibración
            </span>
            <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: vColor, fontWeight: TYPOGRAPHY.weight.bold }}>
              {msToMinSec(combat.vibrationTime)}/10:00
            </span>
          </div>
          <div style={{ width: '100%', height: 4, background: '#222230', borderRadius: 2, overflow: 'hidden' }}>
            <motion.div
              animate={{ width: `${vibPct}%` }}
              style={{ height: '100%', background: vColor, borderRadius: 2 }}
            />
          </div>
        </div>

        {/* Lereles */}
        <div style={{
          fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.md,
          fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.flow,
          background: COLORS_UI.bgElevated, borderRadius: BORDERS.radius.md,
          padding: `${SPACING[1]} ${SPACING[2]}`,
        }}>
          ⭐{combat.lereles}
        </div>

        {/* Turno */}
        <div style={{
          fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs,
          fontWeight: TYPOGRAPHY.weight.bold,
          color:      combat.turn === 'player' ? COLORS_GAME.verde : COLORS_GAME.rojo,
          background: COLORS_UI.bgElevated,
          borderRadius: BORDERS.radius.sm,
          padding:    `2px 8px`,
        }}>
          {combat.turn === 'player' ? 'TU TURNO' : 'RIVAL'}
        </div>

        {/* Nueva partida */}
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => setAbandonConfirm(true)}
          title="Abandonar run"
          style={{
            background:   COLORS_UI.bgElevated,
            border:       `1px solid ${COLORS_UI.border}`,
            borderRadius: BORDERS.radius.sm,
            color:        COLORS_UI.textMuted,
            fontSize:     '14px',
            padding:      '2px 6px',
            cursor:       'pointer',
            flexShrink:   0,
          }}
        >🚪</motion.button>
      </div>

      {/* ── PANEL RIVAL ── */}
      <div style={{
        margin:       SPACING[2],
        background:   COLORS_UI.bgCard,
        borderRadius: BORDERS.radius.lg,
        border:       `1px solid ${COLORS_UI.border}`,
        padding:      SPACING[3],
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[3] }}>
          {/* Avatar */}
          <div style={{
            width: 48, height: 48,
            background: COLORS_GAME.rojo + '22',
            borderRadius: BORDERS.radius.full ?? 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, border: `2px solid ${COLORS_GAME.rojo}44`,
            flexShrink: 0,
          }}>
            {enemyDef?.basics?.emoji ?? '🔴'}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <div>
                <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_GAME.rojo, fontSize: TYPOGRAPHY.size.md }}>
                  {enemyDef?.basics?.name ?? 'Corrupto'}
                </span>
                <span style={{
                  marginLeft: SPACING[1], fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs,
                  background: COLORS_GAME.rojo + '33', color: COLORS_GAME.rojo,
                  borderRadius: BORDERS.radius.sm, padding: '1px 5px', fontWeight: TYPOGRAPHY.weight.bold,
                }}>CORRUPTO</span>
              </div>
              <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.sm, color: COLORS_GAME.rojo }}>
                {enemy.auraCurrent}/{enemy.auraMax}
              </span>
            </div>
            <AuraBar current={enemy.auraCurrent} max={enemy.auraMax} color={COLORS_GAME.rojo} height={8} />
            {/* P/I/T real del rival (1.1) */}
            <EnemyAttrRow enemy={enemy} />
          </div>
        </div>

        {/* Intención con icono */}
        {enemy.intention && (
          <div style={{
            marginTop: SPACING[2],
            padding:   `${SPACING[1]} ${SPACING[2]}`,
            background: COLORS_UI.bgElevated,
            borderRadius: BORDERS.radius.sm,
            fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs,
            color: COLORS_UI.text,
            display: 'flex', alignItems: 'center', gap: SPACING[1],
          }}>
            <span>{INTENT_ICONS[enemy.intention.action] ?? '❓'}</span>
            <span style={{ fontWeight: TYPOGRAPHY.weight.bold, flex: 1 }}>
              {enemy.intention.action === 'rest'            ? `+${enemy.intention.value} Aura` :
               enemy.intention.action === 'presencia_up'   ? `+1 Presencia (→${(enemy.presencia ?? 1) + 1})` :
               enemy.intention.action === 'influencia_up'  ? `+1 Influencia (→${(enemy.influencia ?? 1) + 1})` :
               enemy.intention.action === 'temple_up'      ? `+1 Temple (→${(enemy.temple ?? 2) + 1})` :
               enemy.intention.action === 'attack_place'   ? `Lugar −${enemy.intention.value}` :
               enemy.intention.action === 'intervene_place'? `Res +${enemy.intention.value}` :
               enemy.intention.action}
            </span>
            {enemy.doubleDamage && (
              <span style={{ fontSize: '10px', background: '#E03B3B33', color: '#E03B3B', borderRadius: 3, padding: '1px 5px', fontWeight: TYPOGRAPHY.weight.bold }}>
                ×2 ACTIVO
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── TABLERO: FOSO + LUGAR ── */}
      <div style={{ display: 'flex', gap: SPACING[2], margin: `0 ${SPACING[2]}` }}>

        {/* Foso */}
        <div style={{
          flex: 1,
          background:   COLORS_UI.bgCard,
          borderRadius: BORDERS.radius.lg,
          border:       `1px solid ${COLORS_UI.border}`,
          padding:      SPACING[2],
          minHeight:    90,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: SPACING[1] }}>
            <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.textSecondary }}>
              EL FOSO ({combat.pit.length}/5)
            </span>
            <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
              {msToMinSec(combat.pitTime ?? 0)}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING[1] }}>
            {combat.pit.map(slot => (
              <CharCard
                key={slot.characterId}
                slot={slot}
                charDef={chars[slot.characterId]}
                selected={selected?.characterId === slot.characterId}
                onSelect={() => handleSelectChar(slot.characterId)}
                compact
              />
            ))}
            {combat.pit.length === 0 && <EmptySlot label="Vacío" />}
          </div>
          {showPitHint && (
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.4 }}
              style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_GAME.naranja, marginTop: SPACING[1] }}
            >
              👆 Mueve al Foso y pulsa Confrontar
            </motion.div>
          )}
          {pitActiveChars.length > 0 && combat.turn === 'player' && !combat.victory && (
            <div style={{ marginTop: SPACING[1], display: 'flex', gap: SPACING[1] }}>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { setSelected(null); dispatch({ type: 'START_VIBRA', payload: {
                  type: 'confront',
                  characterId: pitActiveChars[0].characterId,
                  characterIds: pitActiveChars.map(s => s.characterId),
                  attribute: pitTotalP,
                  baseDamage: pitTotalP,
                  target: enemy.vibraTarget,
                  mode: 'centesimas',
                  timeLimit: 10,
                  timerModifiers: enemy.timerModifiers,
                }}); }}
                style={{ flex: 1, padding: `${SPACING[1]} ${SPACING[2]}`, background: COLORS_GAME.rojo + '22',
                  border: `1px solid ${COLORS_GAME.rojo}66`, borderRadius: BORDERS.radius.md,
                  color: COLORS_GAME.rojo, fontFamily: TYPOGRAPHY.fontFamily,
                  fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, cursor: 'pointer' }}
              >
                ⚔ Confrontar
              </motion.button>
            </div>
          )}
        </div>

        {/* Lugar */}
        <div style={{
          flex: 1,
          background:   COLORS_UI.bgCard,
          borderRadius: BORDERS.radius.lg,
          border:       `1px solid ${COLORS_UI.border}`,
          padding:      SPACING[2],
          minHeight:    90,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: SPACING[1] }}>
            <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.textSecondary }}>
              {placeDef?.icon} {placeDef?.name ?? 'Lugar'}
              {place?.conquered && <span style={{ color: COLORS_GAME.verde, marginLeft: 4 }}>✓</span>}
            </span>
            <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
              {msToMinSec(place?.zoneTime ?? 0)}
            </span>
          </div>
          {/* Resonancia */}
          <div style={{ marginBottom: SPACING[1] }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>Res.</span>
              <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: place?.conquered ? COLORS_GAME.verde : COLORS_UI.textSecondary }}>
                {place?.resonanceCurrent}/{place?.resonanceMax}
              </span>
            </div>
            <AuraBar current={place?.resonanceCurrent ?? 0} max={place?.resonanceMax ?? 1} color={COLORS_GAME.morado} height={6} />
          </div>
          {/* Personajes en lugar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING[1] }}>
            {(place?.occupants ?? []).map(slot => (
              <CharCard
                key={slot.characterId}
                slot={slot}
                charDef={chars[slot.characterId]}
                selected={selected?.characterId === slot.characterId}
                onSelect={() => handleSelectChar(slot.characterId)}
                compact
              />
            ))}
            {(place?.occupants ?? []).length === 0 && !place?.conquered && <EmptySlot label="Vacío" />}
          </div>
          {placeActiveChars.length > 0 && combat.turn === 'player' && !combat.victory && (
            <div style={{ marginTop: SPACING[1], display: 'flex', gap: SPACING[1] }}>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { setSelected(null); dispatch({ type: 'START_VIBRA', payload: {
                  type: 'intervene',
                  characterId: placeActiveChars[0].characterId,
                  characterIds: placeActiveChars.map(s => s.characterId),
                  attribute: placeTotalI,
                  baseDamage: placeTotalI,
                  target: placeDef?.vibra?.target ?? 3000,
                  mode: placeDef?.vibra?.mode ?? 'punto',
                  timeLimit: placeDef?.vibra?.timeLimit ?? 7,
                  placeIndex: 0,
                }}); }}
                style={{ flex: 1, padding: `${SPACING[1]} ${SPACING[2]}`, background: COLORS_GAME.morado + '22',
                  border: `1px solid ${COLORS_GAME.morado}66`, borderRadius: BORDERS.radius.md,
                  color: COLORS_GAME.morado, fontFamily: TYPOGRAPHY.fontFamily,
                  fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, cursor: 'pointer' }}
              >
                🎯 Intervenir
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div style={{
        display:       'flex',
        gap:           SPACING[2],
        margin:        `${SPACING[2]} ${SPACING[2]} 0`,
        justifyContent:'space-between',
      }}>
        {[
          { label: `📥 Robar (${combat.deck.length})`, action: 'DRAW_CARD', disabled: combat.hq.length >= 5 || combat.deck.length === 0 },
          { label: `🗑 Desc. +1L (${combat.deck.length})`, action: 'DISCARD_CARD', disabled: combat.deck.length === 0 },
          { label: '⏭ Pasar', action: 'PASS_TURN', disabled: false },
        ].map(({ label, action, disabled }) => (
          <motion.button
            key={action}
            whileTap={{ scale: 0.95 }}
            disabled={disabled || combat.turn !== 'player' || !!combat.victory}
            onClick={() => dispatch({ type: action })}
            style={{
              flex: 1, padding: `${SPACING[2]} ${SPACING[1]}`,
              background: COLORS_UI.bgElevated,
              border: `1px solid ${COLORS_UI.border}`,
              borderRadius: BORDERS.radius.md,
              color: disabled || combat.turn !== 'player' ? COLORS_UI.textMuted : COLORS_UI.text,
              fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs,
              fontWeight: TYPOGRAPHY.weight.bold, cursor: disabled || combat.turn !== 'player' ? 'default' : 'pointer',
            }}
          >
            {label}
          </motion.button>
        ))}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setDeckOpen(true)}
          style={{
            flex: 1, padding: `${SPACING[2]} ${SPACING[1]}`,
            background: COLORS_UI.bgElevated,
            border: `1px solid ${COLORS_UI.border}`,
            borderRadius: BORDERS.radius.md,
            color: COLORS_UI.text,
            fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs,
            fontWeight: TYPOGRAPHY.weight.bold, cursor: 'pointer',
          }}
        >
          📋 Mazo
        </motion.button>
      </div>

      {/* ── LOG ── */}
      <div ref={logRef} style={{
        margin:        `${SPACING[1]} ${SPACING[2]}`,
        padding:       SPACING[2],
        background:    COLORS_UI.bgCard,
        borderRadius:  BORDERS.radius.md,
        border:        `1px solid ${COLORS_UI.border}`,
        maxHeight:     80,
        overflowY:     'auto',
        display:       'flex',
        flexDirection: 'column',
        gap:           1,
      }}>
        {combat.log.length === 0 && (
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
            Combate iniciado. ¡Elige una acción!
          </div>
        )}
        {combat.log.slice(-8).map((entry, i, arr) => {
          const icon  = getLogIcon(entry.msg);
          const isLast = i === arr.length - 1;
          const color = isLast ? (getLogColor(entry.msg) ?? COLORS_UI.text) : (getLogColor(entry.msg) ?? COLORS_UI.textSecondary);
          return (
            <div key={entry.id ?? i} style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color, lineHeight: 1.3, display: 'flex', gap: 4 }}>
              <span style={{ flexShrink: 0 }}>{icon}</span>
              <span>{entry.msg}</span>
            </div>
          );
        })}
      </div>

      {/* ── HQ ── */}
      <div style={{
        flexShrink:   0,
        position:     'sticky',
        bottom:       0,
        zIndex:       10,
        background:   COLORS_UI.bgCard,
        borderTop:    `2px solid ${COLORS_UI.border}`,
        padding:      `${SPACING[2]} ${SPACING[2]} ${SPACING[3]}`,
      }}>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.textSecondary, marginBottom: SPACING[1] }}>
          HQ ({combat.hq.length}/5)
        </div>
        {showHqHint && (
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 1.4 }}
            style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_GAME.naranja, marginBottom: SPACING[1] }}
          >
            👆 Toca una carta y muévela al Foso para atacar
          </motion.div>
        )}
        <div style={{ display: 'flex', gap: SPACING[2], overflowX: 'auto', paddingBottom: 2 }}>
          {combat.hq.map(slot => (
            <CharCard
              key={slot.characterId}
              slot={slot}
              charDef={chars[slot.characterId]}
              selected={selected?.characterId === slot.characterId}
              onSelect={() => handleSelectChar(slot.characterId)}
            />
          ))}
          {combat.hq.length === 0 && <EmptySlot label="HQ vacío" />}
        </div>
      </div>

      {/* ── PANEL DE ACCIÓN (personaje seleccionado) ── */}
      <AnimatePresence>
        {selected && combat.turn === 'player' && !combat.victory && (
          <ActionPanel
            sel={selected}
            combat={combat}
            onAction={dispatch}
            onClose={() => setSelected(null)}
            chars={chars}
            placeDefs={placeDefs}
          />
        )}
      </AnimatePresence>

      {/* ── RESULTADO VIBRA (overlay 2s, 1.3) ── */}
      <AnimatePresence>
        {vibraResult && (
          <motion.div
            key="vibra-result"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 350,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <div style={{
              background: 'rgba(6,6,10,0.93)',
              borderRadius: BORDERS.radius.xl,
              border: `2px solid ${resultColor(vibraResult.result)}`,
              padding: `${SPACING[5]} ${SPACING[8]}`,
              textAlign: 'center',
              boxShadow: `0 0 40px ${resultColor(vibraResult.result)}55`,
              minWidth: 160,
            }}>
              <div style={{ fontSize: 36 }}>{resultIcon(vibraResult.result)}</div>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size['2xl'], fontWeight: TYPOGRAPHY.weight.black, color: resultColor(vibraResult.result), letterSpacing: '0.12em', marginTop: 4 }}>
                {resultLabel(vibraResult.result)}
              </div>
              {(() => {
                const r  = vibraResult.result;
                const fd = vibraResult._failDamage ?? 0;
                const vt = vibraResult._type;
                if ((r === 'flow' || r === 'vibra') && vibraResult.finalValue > 0) {
                  return (
                    <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size['3xl'], color: COLORS_GAME.rojo, fontWeight: TYPOGRAPHY.weight.black }}>
                      −{vibraResult.finalValue}
                    </div>
                  );
                }
                if ((r === 'fail' || r === 'timeout' || r === 'pifia') && fd > 0) {
                  const dmg   = r === 'pifia' ? fd * 2 : fd;
                  const label = vt === 'confront'
                    ? `−${dmg} al equipo`
                    : `+${dmg} res.`;
                  return (
                    <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xl, color: COLORS_GAME.naranja, fontWeight: TYPOGRAPHY.weight.black, marginTop: 4 }}>
                      {label}
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TIMING CHALLENGE (Vibra del jugador) ── */}
      {combat.pendingVibra && !combat.victory && (
        <TimingChallenge
          mode={combat.pendingVibra.mode}
          target={combat.pendingVibra.target}
          attribute={combat.pendingVibra.attribute}
          baseDamage={combat.pendingVibra.baseDamage ?? combat.pendingVibra.attribute}
          marginSide="both"
          pifiaMargin={20}
          timeLimit={combat.pendingVibra.timeLimit}
          reveal={combat.pendingVibra.timerModifiers}
          actionLabel={combat.pendingVibra.type === 'confront' ? 'CONFRONTAR' : 'INTERVENIR'}
          failDamage={combat.pendingVibra.type === 'confront' ? (enemy?.presencia ?? 1) : (enemy?.influencia ?? 1)}
          actionType={combat.pendingVibra.type}
          actionContext={`vs ${enemyDef?.basics?.name ?? 'Corrupto'} · ${combat.pendingVibra.attribute}${combat.pendingVibra.type === 'confront' ? 'P' : 'I'}`}
          onResult={result => {
            const vType  = combat.pendingVibra.type;
            const failDmg = vType === 'confront' ? (enemy?.presencia ?? 1) : (enemy?.influencia ?? 1);
            setVibraResult({ ...result, _type: vType, _failDamage: failDmg });
            setTimeout(() => setVibraResult(null), 2000);
            dispatch({ type: 'RESOLVE_VIBRA', payload: {
              result,
              context: {
                type:         combat.pendingVibra.type,
                characterId:  combat.pendingVibra.characterId,
                characterIds: combat.pendingVibra.characterIds,
                placeIndex:   combat.pendingVibra.placeIndex ?? 0,
              },
            }});
          }}
        />
      )}

      {/* ── TIMING CHALLENGE DEFENSIVO (¡última oportunidad!) ── */}
      {combat.pendingDefensiveVibra && !combat.victory && (
        <TimingChallenge
          mode="centesimas"
          target={combat.pendingDefensiveVibra.vibraTarget}
          attribute={combat.pendingDefensiveVibra.attribute ?? 2}
          marginSide="both"
          pifiaMargin={20}
          timeLimit={10}
          actionLabel={combat.pendingDefensiveVibra.type === 'place_attack' ? '¡ESQUIVAR!' : '¡ESQUIVAR!'}
          actionContext={
            combat.pendingDefensiveVibra.type === 'place_attack'
              ? `Golpe −${combat.pendingDefensiveVibra.value} · T:${combat.pendingDefensiveVibra.attribute} · FLOW refleja`
              : `Golpe ${combat.pendingDefensiveVibra.value}${combat.enemyDoubleEffect ? ' ×2!' : ''} · Parry: para antes de ${combat.pendingDefensiveVibra.segundosUntil ?? 0}s`
          }
          baseDamage={combat.pendingDefensiveVibra.value}
          onResult={result => dispatch({ type: 'RESOLVE_DEFENSIVE_VIBRA', payload: { result } })}
        />
      )}

      {/* ── VICTORIA / DERROTA ── */}
      {combat.victory && (
        <VictoryOverlay
          victory={combat.victory}
          onRestart={() => {
            if (combat.victory === 'win') {
              const areaIdx = run?.currentAreaIndex ?? 0;
              const nodeIdx = run?.areas?.[areaIdx]?.currentNodeIndex ?? 0;
              const allSlots = [...combat.hq, ...combat.pit, ...(combat.places ?? []).flatMap(p => p.occupants ?? [])];
              const koLeaderIds = allSlots.filter(s => s.isKO && s.isLeader).map(s => s.characterId);
              updateRun({ deck: combat.deck, lereles: combat.lereles, koLeaderIds });
              completeNode(areaIdx, nodeIdx, 'win');
              setScreen('reward');
            } else {
              setScreen('run-end');
            }
          }}
          onNewGame={() => { localStorage.removeItem('aura-save-v1'); setScreen('set-selection'); }}
        />
      )}

      {/* ── MODAL VER MAZO ── */}
      {deckOpen && (
        <div
          onClick={() => setDeckOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)',
            zIndex: 600, overflowY: 'auto', padding: SPACING[4],
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: 440, margin: '0 auto',
              background: COLORS_UI.bgCard,
              borderRadius: BORDERS.radius.lg,
              border: `1px solid ${COLORS_UI.border}`,
              padding: SPACING[4],
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING[3] }}>
              <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text, fontSize: TYPOGRAPHY.size.md }}>
                Mazo ({combat.deck.length} cartas)
              </span>
              <button
                onClick={() => setDeckOpen(false)}
                style={{ background: 'none', border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.sm, color: COLORS_UI.textMuted, padding: '2px 10px', cursor: 'pointer', fontFamily: TYPOGRAPHY.fontFamily }}
              >✕</button>
            </div>

            {combat.deck.length === 0 && (
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textMuted, textAlign: 'center', padding: SPACING[4] }}>
                Mazo vacío
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
              {combat.deck.map((charId, i) => {
                const def   = chars[charId];
                if (!def) return null;
                const aura  = guestAura(def);
                const attrs = split(aura, def.colorId);
                const color = COLOR_HEX[def.colorId] ?? COLORS_UI.border;
                const kwIds = [
                  ...(def.guest?.inheritedAbilityIds ?? []),
                  def.guest?.onDrawOrInHQ?.ability ? 'Al robar' : null,
                  def.guest?.onDiscard?.fromHQ     ? 'Al descartar' : null,
                ].filter(Boolean);
                return (
                  <div key={charId} style={{
                    display: 'flex', alignItems: 'center', gap: SPACING[2],
                    background: COLORS_UI.bgElevated,
                    borderRadius: BORDERS.radius.md,
                    border: `1px solid ${color}33`,
                    padding: SPACING[2],
                  }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{def.basics.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color }}>
                        #{i + 1} {def.basics.name}
                      </div>
                      <div style={{ display: 'flex', gap: SPACING[2], fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, marginTop: 2 }}>
                        <span style={{ color: COLORS_GAME.rojo }}>P:{attrs.presencia}</span>
                        <span style={{ color: COLORS_GAME.morado }}>I:{attrs.influencia}</span>
                        <span style={{ color: COLORS_GAME.verde }}>T:{attrs.temple}</span>
                        <span style={{ color: COLORS_UI.textMuted }}>({aura} Aura)</span>
                      </div>
                      {kwIds.length > 0 && (
                        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '10px', color: COLORS_UI.textSecondary, marginTop: 2 }}>
                          {kwIds.map(kw => KEYWORD_DESCRIPTIONS[kw] ?? kw).join(' · ')}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tutorial primer combate */}
      {showTutorial && (
        <TutorialOverlay onDone={() => {
          localStorage.setItem('aura_tutorial_seen', '1');
          setShowTutorial(false);
        }} />
      )}

      {/* Modal confirmación abandonar run */}
      {abandonConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: SPACING[4],
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: COLORS_UI.bgCard,
              border: `1px solid ${COLORS_UI.border}`,
              borderRadius: BORDERS.radius.lg,
              padding: SPACING[5],
              width: '100%', maxWidth: 320,
              display: 'flex', flexDirection: 'column', gap: SPACING[4],
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: TYPOGRAPHY.size.xl, color: COLORS_UI.text, fontFamily: TYPOGRAPHY.fontFamily }}>
              ¿Abandonar la aventura?
            </div>
            <div style={{ fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textMuted, fontFamily: TYPOGRAPHY.fontFamily }}>
              El progreso del run se perderá.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setRun(null);
                  resetCombat();
                  setScreen('main-menu');
                }}
                style={{
                  background: COLORS_UI.error ?? '#c0392b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: BORDERS.radius.md,
                  padding: `${SPACING[3]} ${SPACING[4]}`,
                  fontFamily: TYPOGRAPHY.fontFamily,
                  fontSize: TYPOGRAPHY.size.base,
                  cursor: 'pointer',
                }}
              >
                Abandonar run
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setAbandonConfirm(false)}
                style={{
                  background: COLORS_UI.bgElevated,
                  color: COLORS_UI.textSecondary,
                  border: `1px solid ${COLORS_UI.border}`,
                  borderRadius: BORDERS.radius.md,
                  padding: `${SPACING[3]} ${SPACING[4]}`,
                  fontFamily: TYPOGRAPHY.fontFamily,
                  fontSize: TYPOGRAPHY.size.base,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
