/**
 * RunScreen — ejecutor de la run.
 * BLOQUE 1: carta del personaje reactiva
 * BLOQUE 2: vidas grandes con animaciones
 * BLOQUE 3: habilidades activas + aura efectos
 * BLOQUE 4: transición entre pruebas
 * GDD v3.0 Sección 3.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../store/index.js';
import { generateProbeConfig }                    from '../../engine/run/runEngine.js';
import { PROBE_FAMILY, FAMILY_LABELS as FL }      from '../../engine/run/runEngine.js';
import { applyProbeConfig, applyRuntimeEffect }   from '../../engine/abilities/abilityEngine.js';
import { generateEcoOptions, applyEcoConfig }     from '../../engine/eco/runEcoEngine.js';
import { getEcoById, ECO_TIERS }                  from '../../data/probeEcos.js';
import { PROBE_MAP, PROBE_LABELS }                from '../probes/probeRegistry.js';
import * as audioEngine                           from '../../engine/audio/audioEngine.js';

import {
  COLORS_UI, COLORS_GAME,
  TYPOGRAPHY, SPACING, BORDERS,
} from '../../styles/tokens.js';

// Probes that run a visible countdown timer (aura glow applies)
const TIMER_PROBES = new Set(['bingo', 'espejo', 'pendulo', 'xopportunities', 'cadena', 'memoria', 'rebote', 'sincroniafase']);

const PERFECT_FLAVOR = ['Resonancia plena.', 'Vibráis como uno.', 'Sincronía absoluta.', 'El tiempo os reconoce.'];
const PASS_FLAVOR    = ['Sincronía estable.', 'Frecuencia alineada.', 'Conexión firme.', 'En sintonía.'];
const FAIL_FLAVOR    = ['La resonancia se quiebra.', 'Fuera de fase.', 'El tiempo se escapa.', 'Desincronizados.'];

// ── Daily challenge condition modifiers ───────────────────────────────────────
function applyDailyCondition(config, condition) {
  if (!condition) return config;
  const result = { ...config };
  if (condition.marginPenalty && result.margin !== undefined && Number.isInteger(result.margin)) {
    result.margin = Math.max(1, result.margin - condition.marginPenalty);
  }
  if (condition.speedPenalty > 0) {
    const factor = 1 - condition.speedPenalty;
    if (result.timeLimitSec !== undefined) result.timeLimitSec = Math.max(3, Math.round(result.timeLimitSec * factor));
    if (result.totalSec     !== undefined) result.totalSec     = Math.max(3, Math.round(result.totalSec     * factor));
    if (result.durationSec  !== undefined) result.durationSec  = Math.max(3, Math.round(result.durationSec  * factor));
    if (result.timeSec      !== undefined) result.timeSec      = Math.max(2, Math.round(result.timeSec      * factor));
    if (result.travelSec    !== undefined) result.travelSec    = Math.max(2, Math.round(result.travelSec    * factor));
  }
  return result;
}

// ── Infinite mode scaling ─────────────────────────────────────────────────────
function applyInfiniteScaling(config, infiniteScore) {
  if (!infiniteScore || infiniteScore <= 0) return config;
  const result      = { ...config };
  const speedSteps  = Math.floor(infiniteScore / 5);
  const marginSteps = Math.floor(infiniteScore / 10);

  if (speedSteps > 0) {
    const factor = 1 / (1 + speedSteps * 0.05);
    if (result.timeLimitSec !== undefined) result.timeLimitSec = Math.max(3,  Math.round(result.timeLimitSec * factor));
    if (result.totalSec     !== undefined) result.totalSec     = Math.max(3,  Math.round(result.totalSec     * factor));
    if (result.durationSec  !== undefined) result.durationSec  = Math.max(3,  Math.round(result.durationSec  * factor));
    if (result.timeSec      !== undefined) result.timeSec      = Math.max(2,  Math.round(result.timeSec      * factor));
    if (result.travelSec    !== undefined) result.travelSec    = Math.max(2,  Math.round(result.travelSec    * factor));
  }

  if (marginSteps > 0 && result.margin !== undefined && Number.isInteger(result.margin)) {
    result.margin = Math.max(1, result.margin - marginSteps);
  }

  return result;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getStreak(history) {
  let s = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].result === 'pass' || history[i].result === 'perfect') s++;
    else break;
  }
  return s;
}

function gradeStars(grade) {
  const filled = Math.ceil((grade ?? 1) / 2);
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function PlaceholderProbe({ onComplete }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: SPACING[4], padding: SPACING[6] }}>
      <div style={{ fontSize: '48px' }}>🔨</div>
      <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg, color: COLORS_UI.textSecondary, textAlign: 'center' }}>Prueba en construcción</div>
      <motion.button whileTap={{ scale: 0.97 }} onClick={() => setTimeout(() => onComplete({ result: 'pass', auraTriggered: false }), 300)}
        style={{ padding: `${SPACING[3]} ${SPACING[6]}`, background: COLORS_GAME.verde, border: 'none', borderRadius: BORDERS.radius.xl, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.bold, color: 'white', cursor: 'pointer' }}>
        Continuar →
      </motion.button>
    </div>
  );
}

// BLOQUE 1: carta del personaje con reacciones
function CharPanel({ char, reaction, streak, auraGlow }) {
  const initials = (char.name ?? '?').slice(0, 2).toUpperCase();
  const avatarAnim =
    reaction === 'fail'    ? { x: [0, -7, 7, -7, 7, 0], transition: { duration: 0.45 } } :
    reaction === 'pass'    ? { scale: [1, 1.14, 0.96, 1], y: [0, -5, 0, 0], transition: { duration: 0.4 } } :
    reaction === 'perfect' ? { scale: [1, 1.28, 1.1, 1], transition: { duration: 0.7 } } :
    reaction === 'aura'    ? { scale: [1, 1.22, 1.08, 1], transition: { duration: 0.6 } } : {};

  const borderColor =
    reaction === 'perfect' ? '#FFD700' :
    reaction === 'pass'    ? '#3BA84F' :
    reaction === 'fail'    ? '#E03B3B' :
    reaction === 'aura'    ? '#FFD700' :
    streak >= 3             ? '#60A5FA' :
    COLORS_UI.border;

  const baseBoxShadow =
    reaction === 'perfect' ? '0 0 28px #FFD700CC, 0 0 56px #FFD70055' :
    reaction === 'aura'    ? '0 0 24px #FFD700, 0 0 48px #FFD70044' :
    reaction === 'pass'    ? '0 0 14px #3BA84F88' :
    reaction === 'fail'    ? '0 0 14px #E03B3B88' :
    streak >= 3             ? `0 0 ${Math.min(20, 6 + streak * 3)}px #60A5FA55` :
    'none';
  // Aura glow: subtle gold pulse when centiseconds pass through char's aura number
  const glowLayer = auraGlow ? '0 0 10px 3px rgba(255,215,0,0.45)' : null;
  const boxShadow = glowLayer
    ? (baseBoxShadow !== 'none' ? `${baseBoxShadow}, ${glowLayer}` : glowLayer)
    : baseBoxShadow;

  const imgFilter = reaction === 'fail' ? 'saturate(0.15)' : 'none';

  return (
    <div style={{ display: 'flex', gap: SPACING[2], alignItems: 'center', flex: 1, minWidth: 0 }}>
      {/* Avatar */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <motion.div
          animate={avatarAnim}
          style={{
            width: '48px', height: '48px',
            borderRadius: BORDERS.radius.lg,
            overflow: 'hidden',
            border: `2px solid ${borderColor}`,
            boxShadow,
            transition: 'box-shadow 0.3s, border-color 0.3s',
          }}
        >
          {char.image ? (
            <img src={char.image} alt={char.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: imgFilter, transition: 'filter 0.35s' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#22222E,#1A1A2E)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.textSecondary }}>
              {initials}
            </div>
          )}
        </motion.div>

        {/* Aura explosion ring */}
        <AnimatePresence>
          {reaction === 'aura' && (
            <motion.div key="aura-ring"
              initial={{ scale: 1, opacity: 0.9 }} animate={{ scale: 2.8, opacity: 0 }}
              transition={{ duration: 0.75 }}
              style={{ position: 'absolute', inset: 0, borderRadius: BORDERS.radius.lg, border: '2px solid #FFD700', pointerEvents: 'none' }} />
          )}
        </AnimatePresence>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {char.name}
        </div>
        <div style={{ display: 'flex', gap: SPACING[1], alignItems: 'center', marginTop: '1px' }}>
          <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '10px', color: '#FFD700', fontWeight: TYPOGRAPHY.weight.black, textShadow: auraGlow ? '0 0 8px #FFD700, 0 0 16px rgba(255,215,0,0.6)' : 'none', transition: 'text-shadow 0.08s' }}>
            #{String(char.auraNumber).padStart(2, '0')}
          </span>
          <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '10px', color: char.grade >= 8 ? '#FFD700' : COLORS_UI.textMuted }}>
            {gradeStars(char.grade)}
          </span>
        </div>
        <AnimatePresence>
          {streak >= 2 && (
            <motion.div key="streak" initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '9px', color: '#60A5FA', letterSpacing: '0.04em', marginTop: '1px' }}>
              {streak}× racha 🔥
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// BLOQUE 2: corazones grandes con animaciones
function HeartsBar({ lives, max, breakIndex }) {
  const isLow = lives === 1;
  return (
    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
      {Array.from({ length: Math.max(max, 3) }, (_, i) => {
        const filled = i < lives;
        const justBroke = i === breakIndex;
        return (
          <motion.span key={i}
            animate={
              justBroke ? { scale: [1, 1.5, 0.7, 1], rotate: [0, -15, 15, 0] } :
              filled && isLow ? { scale: [1, 1.1, 1] } :
              {}
            }
            transition={
              justBroke ? { duration: 0.5 } :
              filled && isLow ? { duration: 0.7, repeat: Infinity, ease: 'easeInOut' } :
              {}
            }
            style={{
              fontSize: '24px',
              color: filled ? '#E03B3B' : COLORS_UI.bgElevated,
              filter: filled ? (isLow ? 'drop-shadow(0 0 8px rgba(224,59,59,0.9))' : 'drop-shadow(0 0 4px rgba(224,59,59,0.5))') : 'none',
              lineHeight: 1,
              display: 'block',
            }}
          >
            {filled ? '♥' : '♡'}
          </motion.span>
        );
      })}
    </div>
  );
}

// BLOQUE 2: flash −1 CONCENTRACIÓN + borde rojo + flavor text
function LifeLostFeedback({ show, flavorText }) {
  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Borde rojo */}
          <motion.div key="edge"
            initial={{ opacity: 0.7 }} animate={{ opacity: 0 }} transition={{ duration: 0.7 }}
            style={{ position: 'fixed', inset: 0, zIndex: 5, pointerEvents: 'none', boxShadow: 'inset 0 0 70px rgba(224,59,59,0.55)' }} />
          {/* Texto */}
          <motion.div key="text"
            initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -36 }} transition={{ duration: 1.1, ease: 'easeOut' }}
            style={{ position: 'fixed', top: '36%', left: '50%', transform: 'translateX(-50%)', zIndex: 250, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size['2xl'], fontWeight: TYPOGRAPHY.weight.black, color: '#E03B3B', textShadow: '0 0 24px rgba(224,59,59,0.8)', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
              −1 CONCENTRACIÓN
            </span>
            {flavorText && (
              <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: 'rgba(224,59,59,0.75)', letterSpacing: '0.05em' }}>
                {flavorText}
              </span>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Brief pass feedback
function PassFlashOverlay({ flavorText }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      style={{ position: 'fixed', top: '30%', left: '50%', transform: 'translateX(-50%)', zIndex: 300, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
    >
      <div style={{ background: 'rgba(96,165,250,0.12)', border: '1.5px solid rgba(96,165,250,0.45)', borderRadius: BORDERS.radius.xl, padding: `${SPACING[2]} ${SPACING[5]}`, textAlign: 'center' }}>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.black, color: '#60A5FA', letterSpacing: '0.08em' }}>
          ✓ SINCRONÍA ESTABLE
        </div>
        {flavorText && (
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: 'rgba(96,165,250,0.7)', marginTop: '3px' }}>
            {flavorText}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Sync start overlay
function SyncStartOverlay({ charName }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(14,14,18,0.75)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}
    >
      <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.12em', fontStyle: 'italic' }}>
        Sincronizando con {charName}...
      </div>
    </motion.div>
  );
}

// BLOQUE 2: borde permanente a 1 vida
function DangerBorder({ active }) {
  if (!active) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 4, pointerEvents: 'none', boxShadow: 'inset 0 0 50px rgba(224,59,59,0.22)', transition: 'opacity 0.3s' }} />
  );
}

// BLOQUE 4.4: transición entre pruebas
function ProbeTransitionOverlay({ probeNumber, probeType, showPreview, infiniteMode }) {
  const family = PROBE_FAMILY[probeType];
  const familyLabel = FL[family] ?? '⏱ CRONÓMETRO';
  const infiniteN = probeNumber - 10;
  return (
    <motion.div
      key="probe-transition"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{ position: 'fixed', inset: 0, zIndex: 140, background: 'rgba(14,14,18,0.97)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: SPACING[2] }}
    >
      <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: infiniteMode ? '#FFD700' : COLORS_UI.textMuted, letterSpacing: '0.12em' }}>
        {infiniteMode ? '∞ MODO INFINITO' : familyLabel}
      </div>
      <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size['4xl'], fontWeight: TYPOGRAPHY.weight.black, color: infiniteMode ? '#FFD700' : COLORS_UI.text, lineHeight: 1 }}>
        {infiniteMode ? String(infiniteN) : String(Math.min(probeNumber, 10)).padStart(2, ' ')}
      </div>
      <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, letterSpacing: '0.08em' }}>
        {infiniteMode ? 'PRUEBA INFINITA' : 'DE 10'}
      </div>
      <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.textSecondary, marginTop: SPACING[2] }}>
        {PROBE_LABELS[probeType] ?? probeType.toUpperCase()}
      </div>
      {showPreview && (
        <div style={{ marginTop: SPACING[3], padding: `${SPACING[2]} ${SPACING[4]}`, background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.35)', borderRadius: BORDERS.radius.lg, textAlign: 'center' }}>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '9px', color: '#FFD700', letterSpacing: '0.1em', fontWeight: TYPOGRAPHY.weight.bold }}>ECO VISTA PREVIA</div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: 'rgba(255,215,0,0.7)', marginTop: '3px' }}>Observa antes de empezar</div>
        </div>
      )}
    </motion.div>
  );
}

function EcoSelectOverlay({ options, onSelect }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: SPACING[4], gap: SPACING[4] }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text, letterSpacing: '0.08em' }}>Resonancias cercanas se filtran…</div>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, marginTop: '3px', letterSpacing: '0.06em' }}>elige una para llevarla contigo</div>
      </div>
      {options.map(eco => {
        const tier   = ECO_TIERS[eco.tier] ?? ECO_TIERS.basic;
        const isLeg  = eco.tier === 'legendary';
        return (
          <motion.button key={eco.id} whileTap={{ scale: 0.97 }} onClick={() => onSelect(eco.id)}
            style={{ width: '100%', maxWidth: '380px', background: COLORS_UI.bgElevated, border: `1.5px solid ${tier.color}`, borderRadius: BORDERS.radius.xl, padding: SPACING[4], cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: SPACING[1], boxShadow: isLeg ? `0 0 18px ${tier.color}33` : 'none' }}>
            <div style={{ display: 'flex', gap: SPACING[2], alignItems: 'center' }}>
              <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '9px', fontWeight: TYPOGRAPHY.weight.bold, color: tier.color, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 6px', background: `${tier.color}22`, borderRadius: BORDERS.radius.sm }}>{tier.label}</span>
              <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.text }}>{eco.name}</span>
            </div>
            {eco.scope !== 'general' && (
              <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '9px', color: tier.color, opacity: 0.7, letterSpacing: '0.05em' }}>PARA: {eco.scope.toUpperCase()}</span>
            )}
            <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textSecondary }}>{eco.description}</span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}

function EcoDiscardOverlay({ currentEcoIds, onDiscard }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: SPACING[4], gap: SPACING[3] }}>
      <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text, letterSpacing: '0.1em' }}>DESCARTA UN ECO</div>
      <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textMuted, textAlign: 'center' }}>Tienes 5 ecos activos. Elige uno para descartar.</div>
      {currentEcoIds.map(ecoId => {
        const eco  = getEcoById(ecoId);
        if (!eco) return null;
        const tier = ECO_TIERS[eco.tier] ?? ECO_TIERS.basic;
        return (
          <div key={ecoId} style={{ width: '100%', maxWidth: '380px', background: COLORS_UI.bgElevated, border: `1px solid ${tier.color}44`, borderRadius: BORDERS.radius.xl, padding: SPACING[3], display: 'flex', alignItems: 'center', gap: SPACING[3] }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color: tier.color }}>{eco.name}</div>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '11px', color: COLORS_UI.textMuted, marginTop: '2px', lineHeight: 1.3 }}>{eco.description}</div>
            </div>
            <motion.button whileTap={{ scale: 0.94 }} onClick={() => onDiscard(ecoId)}
              style={{ flexShrink: 0, padding: `${SPACING[2]} ${SPACING[3]}`, background: 'rgba(224,59,59,0.15)', border: '1px solid rgba(224,59,59,0.45)', borderRadius: BORDERS.radius.lg, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, color: '#E03B3B', cursor: 'pointer', letterSpacing: '0.04em' }}>
              Descartar
            </motion.button>
          </div>
        );
      })}
    </motion.div>
  );
}

function EcoBar({ activeEcoIds, doubledEcos }) {
  const [tooltip, setTooltip] = useState(null);
  if (!activeEcoIds?.length) return null;
  return (
    <div style={{ padding: `${SPACING[1]} ${SPACING[4]}`, display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center', borderTop: `1px solid ${COLORS_UI.border}` }}>
      {activeEcoIds.map(ecoId => {
        const eco     = getEcoById(ecoId);
        if (!eco) return null;
        const tier    = ECO_TIERS[eco.tier] ?? ECO_TIERS.basic;
        const doubled = doubledEcos?.includes(ecoId);
        const active  = tooltip === ecoId;
        return (
          <div key={ecoId} onClick={() => setTooltip(active ? null : ecoId)}
            style={{ position: 'relative', cursor: 'pointer' }}>
            <div style={{ padding: '2px 6px', background: `${tier.color}18`, border: `1px solid ${tier.color}66`, borderRadius: '4px', fontFamily: TYPOGRAPHY.fontFamily, fontSize: '8px', color: tier.color, letterSpacing: '0.03em', whiteSpace: 'nowrap', boxShadow: tier.glow ? `0 0 6px ${tier.color}44` : 'none' }}>
              {eco.name.split(' ')[0]}{doubled ? ' ×2' : ''}
            </div>
            {active && (
              <div style={{ position: 'absolute', bottom: 'calc(100% + 4px)', left: '50%', transform: 'translateX(-50%)', zIndex: 60, background: COLORS_UI.bgElevated, border: `1px solid ${tier.color}`, borderRadius: BORDERS.radius.md, padding: `${SPACING[2]} ${SPACING[3]}`, minWidth: '140px', maxWidth: '210px', pointerEvents: 'none' }}>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '9px', fontWeight: TYPOGRAPHY.weight.bold, color: tier.color, letterSpacing: '0.04em' }}>{tier.label}: {eco.name}</div>
                {eco.scope !== 'general' && <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '8px', color: tier.color, opacity: 0.65, marginTop: '1px' }}>PRUEBA: {eco.scope.toUpperCase()}</div>}
                <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '9px', color: COLORS_UI.textSecondary, marginTop: '3px', lineHeight: 1.35 }}>{eco.description}</div>
                {doubled && <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '8px', color: '#FFD700', marginTop: '3px' }}>Efecto ×2 (Eco del pasado)</div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function InfiniteOfferOverlay({ onAccept, onDecline }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: SPACING[6], gap: SPACING[5], textAlign: 'center' }}>
      <div style={{ fontSize: '48px' }}>👑</div>
      <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size['2xl'], fontWeight: TYPOGRAPHY.weight.black, color: '#FFD700', letterSpacing: '0.1em' }}>¡SINCRONIZACIÓN COMPLETA!</div>
      <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, color: COLORS_UI.textSecondary, maxWidth: '300px' }}>Puedes continuar en modo infinito. Las pruebas se vuelven más difíciles.</div>
      <motion.button whileTap={{ scale: 0.97 }} onClick={onAccept}
        style={{ width: '100%', maxWidth: '300px', minHeight: '56px', background: '#FFD700', border: 'none', borderRadius: BORDERS.radius.xl, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: '#000', letterSpacing: '0.12em', cursor: 'pointer' }}>
        MODO INFINITO
      </motion.button>
      <button onClick={onDecline} style={{ background: 'transparent', border: 'none', color: COLORS_UI.textSecondary, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, cursor: 'pointer' }}>
        Terminar aquí
      </button>
    </motion.div>
  );
}

// BLOQUE 3: Aura flash + efecto
function AuraFlashOverlay({ auraNumber, abilityName, effectMessage }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}
      style={{ position: 'fixed', top: '22%', left: '50%', transform: 'translateX(-50%)', zIndex: 300, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: SPACING[2] }}
    >
      <div style={{ background: 'rgba(255,215,0,0.12)', border: '1.5px solid #FFD700', borderRadius: BORDERS.radius.xl, padding: `${SPACING[3]} ${SPACING[5]}`, textAlign: 'center' }}>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size['2xl'], fontWeight: TYPOGRAPHY.weight.black, color: '#FFD700', letterSpacing: '0.1em' }}>
          ✦ RESONANCIA PLENA — Frecuencia {String(auraNumber).padStart(2, '0')}
        </div>
        {abilityName && (
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: 'rgba(255,215,0,0.8)', marginTop: SPACING[1] }}>{abilityName}</div>
        )}
        {effectMessage && (
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: 'rgba(255,215,0,0.9)', marginTop: SPACING[1], fontWeight: TYPOGRAPHY.weight.bold }}>{effectMessage}</div>
        )}
      </div>
    </motion.div>
  );
}

// Residuos Temporales indicator (3 clock fragments)
function ResiduosBar({ count }) {
  return (
    <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: '8px', height: '8px', borderRadius: '2px',
          background: i < count ? '#60A5FA' : COLORS_UI.bgElevated,
          border: `1px solid ${i < count ? 'rgba(96,165,250,0.6)' : COLORS_UI.border}`,
          transition: 'background 0.3s, border-color 0.3s',
        }} />
      ))}
      <span style={{ fontSize: '10px', color: COLORS_UI.textMuted, marginLeft: '2px' }}>⏳</span>
    </div>
  );
}

// Perfect sync flash overlay
function PerfectFlashOverlay({ flavorText }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.3 }}
      style={{ position: 'fixed', top: '30%', left: '50%', transform: 'translateX(-50%)', zIndex: 300, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <div style={{ background: 'rgba(255,215,0,0.15)', border: '2px solid #FFD700', borderRadius: BORDERS.radius.xl, padding: `${SPACING[3]} ${SPACING[6]}`, textAlign: 'center' }}>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size['2xl'], fontWeight: TYPOGRAPHY.weight.black, color: '#FFD700', letterSpacing: '0.12em', textShadow: '0 0 24px #FFD700' }}>
          ✦ RESONANCIA
        </div>
        {flavorText && (
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: 'rgba(255,215,0,0.8)', marginTop: '3px', letterSpacing: '0.06em' }}>
            {flavorText}
          </div>
        )}
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: 'rgba(255,215,0,0.65)', marginTop: SPACING[1], letterSpacing: '0.08em' }}>
          +1 CONCENTRACIÓN
        </div>
      </div>
    </motion.div>
  );
}

// Mercy run banner (auto-dismissing toast)
function MercyRunBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      style={{ position: 'fixed', top: '14%', left: '50%', transform: 'translateX(-50%)', zIndex: 300, pointerEvents: 'none', width: '90%', maxWidth: '360px' }}
    >
      <div style={{ background: 'rgba(167,139,250,0.15)', border: '1.5px solid rgba(167,139,250,0.5)', borderRadius: BORDERS.radius.xl, padding: `${SPACING[3]} ${SPACING[5]}`, textAlign: 'center' }}>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: '#A78BFA', letterSpacing: '0.06em' }}>
          🕊 Sincronización de Misericordia
        </div>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: 'rgba(167,139,250,0.8)', marginTop: SPACING[1] }}>
          El tiempo fue clemente esta vez.
        </div>
      </div>
    </motion.div>
  );
}

// Free probe 1 overlay (temporalResidues consumed)
function FreeProbe1Overlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: SPACING[4], padding: SPACING[6] }}
    >
      <div style={{ fontSize: '48px' }}>⏳</div>
      <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: '#60A5FA', letterSpacing: '0.08em', textAlign: 'center' }}>
        El tiempo te debía una.
      </div>
      <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, color: COLORS_UI.textSecondary, textAlign: 'center' }}>
        Residuos liberados — primera prueba superada.
      </div>
    </motion.div>
  );
}

// BLOQUE 3: Barra de habilidades (pasiva siempre visible + activa clickable)
function AbilityBar({ passiveAbility, activeAbility, activeUsed, usedViaAura, onActiveUse }) {
  if (!passiveAbility && !activeAbility) return null;
  const activeLabel = activeUsed
    ? (usedViaAura ? `${activeAbility?.name} — USADA VÍA AURA` : `${activeAbility?.name} — USADA`)
    : activeAbility?.name?.toUpperCase();
  return (
    <div style={{ padding: `${SPACING[2]} ${SPACING[4]} ${SPACING[3]}`, display: 'flex', flexDirection: 'column', gap: SPACING[1] }}>
      {passiveAbility && (
        <div style={{ width: '100%', minHeight: '36px', background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: BORDERS.radius.xl, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: SPACING[2], fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: '#60A5FA', letterSpacing: '0.05em' }}>
          🛡 {passiveAbility.name} — PASIVA ACTIVA
        </div>
      )}
      {activeAbility && (
        <div
          onClick={!activeUsed ? onActiveUse : undefined}
          style={{ width: '100%', minHeight: '44px', background: activeUsed ? COLORS_UI.bgElevated : 'rgba(167,139,250,0.15)', border: activeUsed ? `1px solid ${COLORS_UI.border}` : '1px solid rgba(167,139,250,0.5)', borderRadius: BORDERS.radius.xl, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: SPACING[2], fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color: activeUsed ? COLORS_UI.textMuted : '#A78BFA', letterSpacing: '0.05em', cursor: activeUsed ? 'default' : 'pointer' }}>
          <span>⚡</span>
          {activeLabel}
        </div>
      )}
    </div>
  );
}

// ── RunScreen principal ───────────────────────────────────────────────────────
export default function RunScreen() {
  const {
    activeRun, characters, meta,
    finishProbe, addRunEco, removeRunEco, enableInfiniteMode, endRun, setScreen, abandonRun,
    useActiveAbility, clearActiveAbilityEffect, applyAuraAbilityEffect, clearAuraEffect,
  } = useStore();

  const [phase,             setPhase]            = useState('running');
  const [ecoOptions,        setEcoOptions]        = useState([]);
  const [probeKey,          setProbeKey]          = useState(0);
  const [auraFlash,         setAuraFlash]         = useState(false);
  const [auraEffectMsg,     setAuraEffectMsg]     = useState(null);
  const [perfectFlash,      setPerfectFlash]      = useState(false);
  const [perfectFlavor,     setPerfectFlavor]     = useState(null);
  const [passFlash,         setPassFlash]         = useState(false);
  const [passFlavor,        setPassFlavor]        = useState(null);
  const [failFlavor,        setFailFlavor]        = useState(null);
  const [showSyncStart,     setShowSyncStart]     = useState(() => !!(activeRun?.currentProbe === 1 && !activeRun?.infiniteMode && !activeRun?.isPerfectSync));
  const [showMercyBanner,   setShowMercyBanner]   = useState(() => !!(activeRun?.mercyRun));

  // BLOQUE 1
  const [reaction,          setReaction]          = useState(null);

  // BLOQUE 2
  const prevLivesRef                               = useRef(null);
  const [lifeLostFlash,     setLifeLostFlash]     = useState(false);
  const [breakIndex,        setBreakIndex]        = useState(null);

  // BLOQUE 4
  const [showTransition,    setShowTransition]    = useState(false);
  const [transitionInfo,    setTransitionInfo]    = useState(null);
  const [exitModal,         setExitModal]         = useState(false);

  // Aura glow: cosmetic pulse when timer centiseconds pass through char's auraNumber
  const [auraGlow,          setAuraGlow]          = useState(false);
  const probeStartTimeRef  = useRef(null);
  const lastAuraCsRef      = useRef(-1);
  const probeTypeRef       = useRef(null);
  const charRef            = useRef(null);

  const prevProbeRef   = useRef(null);
  const prevEcosRef    = useRef([]);
  const runRef         = useRef(activeRun);
  runRef.current       = activeRun;

  const run  = activeRun;
  const char = run ? characters[run.characterId] : null;

  useEffect(() => {
    if (!run || !char) setScreen('home');
  }, [run, char, setScreen]);

  // Track life changes for animations
  useEffect(() => {
    if (!run) return;
    const prev = prevLivesRef.current;
    if (prev === null) { prevLivesRef.current = run.lives; return; }
    if (run.lives < prev) {
      const lostIdx = run.lives; // index of just-emptied heart
      setBreakIndex(lostIdx);
      setLifeLostFlash(true);
      setTimeout(() => { setBreakIndex(null); setLifeLostFlash(false); }, 1000);
    }
    prevLivesRef.current = run.lives;
  }, [run?.lives]); // eslint-disable-line

  const historyLen = run?.probeHistory?.length ?? 0;

  const advanceToNextProbe = useCallback(() => {
    const currentRun  = runRef.current;
    if (!currentRun) return;
    const nextN       = currentRun.currentProbe;
    const seqIdx      = (nextN - 1) % currentRun.probeSequence.length;
    const nextType    = currentRun.probeSequence[seqIdx];
    const hasPreview  = prevEcosRef.current.includes('eco-preview');
    const duration    = hasPreview ? 4300 : 1300;
    setTransitionInfo({ probeNumber: nextN, probeType: nextType, showPreview: hasPreview, infiniteMode: currentRun.infiniteMode ?? false });
    prevEcosRef.current = [];   // consume preview flag
    setShowTransition(true);
    setTimeout(() => {
      setShowTransition(false);
      setProbeKey(k => k + 1);
    }, duration);
  }, []);

  useEffect(() => {
    const prev = prevProbeRef.current;
    if (prev === null) return;
    prevProbeRef.current = null;

    const currentRun = runRef.current;
    if (!currentRun) return;

    if (currentRun.status === 'failed') {
      setTimeout(() => { endRun(); setScreen('run-result'); }, 900);
      return;
    }
    if (currentRun.status === 'completed') {
      if ((meta?.collectorLevel ?? 1) >= 10) {
        setTimeout(() => setPhase('infinite-offer'), 600);
      } else {
        setTimeout(() => { endRun(); setScreen('run-result'); }, 800);
      }
      return;
    }

    // Retry: real fail didn't advance currentProbe — re-mount same probe, skip eco-select
    if (currentRun.currentProbe === prev) {
      setTimeout(advanceToNextProbe, 250);
      return;
    }

    if ([3, 6].includes(prev) && !currentRun.isPerfectSync) {
      setTimeout(() => {
        const char      = characters[currentRun.characterId];
        const tierBoost = !!(currentRun.nextEcoTierBoost);
        const opts      = generateEcoOptions(char, currentRun.activeEcos ?? [], tierBoost);
        setEcoOptions(opts);
        if ((currentRun.activeEcos ?? []).length >= (currentRun.maxEcoSlots ?? 5)) {
          setPhase('eco-discard');
        } else {
          setPhase('eco-select');
        }
      }, 400);
      return;
    }

    setTimeout(advanceToNextProbe, 250);
  }, [historyLen, endRun, setScreen, advanceToNextProbe]);

  const handleProbeComplete = useCallback((result) => {
    prevProbeRef.current = runRef.current?.currentProbe ?? 1;
    prevEcosRef.current  = runRef.current?.activeEcos ?? [];

    // Clear any active ability effect (was already applied to this probe's config)
    clearActiveAbilityEffect();
    clearAuraEffect();

    // Reaction animation (BLOQUE 1)
    const reactionType = result.auraTriggered ? 'aura' :
      result.result === 'perfect' ? 'perfect' :
      result.result === 'pass' ? 'pass' : 'fail';
    setReaction(reactionType);
    setTimeout(() => setReaction(null), result.result === 'perfect' ? 1800 : 1400);

    // Audio feedback (GDD §12.2)
    if (result.result === 'perfect')     audioEngine.playPerfectSound();
    else if (result.result === 'pass')   audioEngine.playPassSound();
    else                                 audioEngine.playFailSound();

    // Perfect flash + flavor
    if (result.result === 'perfect') {
      const f = PERFECT_FLAVOR[Math.floor(Math.random() * PERFECT_FLAVOR.length)];
      setPerfectFlavor(f);
      setPerfectFlash(true);
      setTimeout(() => { setPerfectFlash(false); setPerfectFlavor(null); }, 2200);
    }

    // Pass flash + flavor
    if (result.result === 'pass' && !result.auraTriggered) {
      const f = PASS_FLAVOR[Math.floor(Math.random() * PASS_FLAVOR.length)];
      setPassFlavor(f);
      setPassFlash(true);
      setTimeout(() => { setPassFlash(false); setPassFlavor(null); }, 1200);
    }

    // Fail flavor
    if (result.result === 'fail') {
      const f = FAIL_FLAVOR[Math.floor(Math.random() * FAIL_FLAVOR.length)];
      setFailFlavor(f);
      setTimeout(() => setFailFlavor(null), 1200);
    }

    // Aura flash + apply effect (BLOQUE 3)
    if (result.auraTriggered) {
      setAuraFlash(true);
      setTimeout(() => setAuraFlash(false), 1800);
      audioEngine.playAuraSound(char?.auraNumber ?? 0);
      const currentProbeType = runRef.current?.probeSequence[
        ((runRef.current?.currentProbe ?? 1) - 1) % (runRef.current?.probeSequence?.length ?? 1)
      ] ?? 'bingo';
      const msg = applyAuraAbilityEffect(currentProbeType);
      if (msg) { setAuraEffectMsg(msg); setTimeout(() => setAuraEffectMsg(null), 2200); }
    }

    finishProbe(result);
  }, [finishProbe, applyAuraAbilityEffect, clearActiveAbilityEffect, clearAuraEffect]);

  // BLOQUE 3: active ability button handler
  const handleAbilityUse = useCallback(() => {
    const currentRun = runRef.current;
    const currentProbeType = currentRun
      ? currentRun.probeSequence[((currentRun.currentProbe ?? 1) - 1) % currentRun.probeSequence.length]
      : null;
    const effect = useActiveAbility(currentProbeType);
    if (!effect) return;

    // Shield: set runState flag; no remount needed
    if (effect.type === 'shield') return;

    // Preview: show next probe info overlay (future: setPreviewOverlay)
    // For now, treat same as no-remount
    if (effect.type === 'preview') return;

    // All others that affect current probe config need a remount
    setTimeout(() => {
      setProbeKey(k => k + 1);
      setTimeout(clearActiveAbilityEffect, 80);
    }, 40);
  }, [useActiveAbility, clearActiveAbilityEffect]);

  // nextProbeAutoPass: aa05 aura effect — auto-advance next probe
  useEffect(() => {
    if (!run?.nextProbeAutoPass) return;
    const t = setTimeout(() => {
      handleProbeComplete({ result: 'pass', auraTriggered: false });
    }, 1200);
    return () => clearTimeout(t);
  }, [run?.nextProbeAutoPass, handleProbeComplete]); // eslint-disable-line

  // FreeProbe1: auto-advance when temporalResidues were >= 3 at run start
  const freeProbe1Active = !!(run?.freeProbe1 && run?.currentProbe === 1);
  useEffect(() => {
    if (!freeProbe1Active) return;
    const t = setTimeout(() => {
      handleProbeComplete({ result: 'pass', auraTriggered: false });
    }, 1800);
    return () => clearTimeout(t);
  }, [freeProbe1Active, handleProbeComplete]);

  // Mercy run banner: auto-dismiss after 3 s
  useEffect(() => {
    if (!showMercyBanner) return;
    const t = setTimeout(() => setShowMercyBanner(false), 3000);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line

  // Sync start overlay: auto-dismiss after 600ms
  useEffect(() => {
    if (!showSyncStart) return;
    const t = setTimeout(() => setShowSyncStart(false), 600);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line

  // Ambient drone: start/stop with run
  useEffect(() => {
    audioEngine.startDrone(0.06);
    return () => audioEngine.stopDrone();
  }, []); // eslint-disable-line

  // Drone volume: increases with lives lost and infinite score (tension/intensity)
  useEffect(() => {
    if (!run) return;
    const livesLost    = (run.maxLives ?? 3) - run.lives;
    const infiniteBoost = Math.min(0.02, (run.infiniteScore ?? 0) * 0.002);
    const vol = 0.06 + Math.min(0.03, livesLost * 0.01) + infiniteBoost;
    audioEngine.setDroneVolume(vol);
  }, [run?.lives, run?.infiniteScore]); // eslint-disable-line

  // Aura glow: reset probe start time when a new probe mounts
  useEffect(() => {
    probeStartTimeRef.current = Date.now();
    lastAuraCsRef.current     = -1;
  }, [probeKey]);

  // Aura glow: RAF loop to detect centiseconds crossing char's auraNumber
  useEffect(() => {
    if (!run) return;
    let rafId;
    const tick = () => {
      const c  = charRef.current;
      const pt = probeTypeRef.current;
      if (c && TIMER_PROBES.has(pt) && probeStartTimeRef.current !== null) {
        const auraNumber = c.auraNumber;
        if (auraNumber != null) {
          const elapsed = Date.now() - probeStartTimeRef.current;
          const cs      = Math.floor(elapsed / 10) % 100;
          if (cs === auraNumber && lastAuraCsRef.current !== auraNumber) {
            setAuraGlow(true);
            setTimeout(() => setAuraGlow(false), 140);
          }
          lastAuraCsRef.current = cs;
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [!!run]); // eslint-disable-line

  if (!run || !char) return null;

  const probeNumber = run.currentProbe;
  const seqIndex    = (probeNumber - 1) % run.probeSequence.length;
  const probeType   = run.probeSequence[seqIndex] ?? 'bingo';

  // Keep refs current for RAF loop
  probeTypeRef.current = probeType;
  charRef.current      = char;

  const passiveAbility = char.passiveAbility ?? (char.ability?.type === 'passive' ? char.ability : null);
  const activeAbility  = char.activeAbility  ?? (char.ability?.type === 'active'  ? char.ability : null);

  // Build probe config: raw → passive abilities → eco effects → infinite scaling → runtime effects
  const probeGrade    = (run.infiniteMode || run.isPerfectSync) ? 10 : (char.grade ?? 1);
  const rawConfig     = generateProbeConfig(probeType, probeGrade, probeNumber, run.activeEcos ?? [], passiveAbility);
  const passiveConfig = applyProbeConfig(rawConfig, char, probeType, run.flowMarginBonus ?? 0);
  const ecoConfig     = applyEcoConfig(passiveConfig, run.activeEcos ?? [], probeType, run.doubledEcos ?? []);
  const scaledConfig  = run.infiniteMode ? applyInfiniteScaling(ecoConfig, run.infiniteScore ?? 0) : ecoConfig;
  const dailyConfig   = run.isDailyChallenge ? applyDailyCondition(scaledConfig, run.dailyCondition) : scaledConfig;
  const runtimeEffect = run.activeAbilityEffect ?? run.activeAuraEffect;
  const config        = applyRuntimeEffect(dailyConfig, runtimeEffect);

  const infiniteN     = run.infiniteMode ? (run.currentProbe - 10) : 0;
  const speedSteps    = run.infiniteMode ? Math.floor((run.infiniteScore ?? 0) / 5) : 0;
  const marginSteps   = run.infiniteMode ? Math.floor((run.infiniteScore ?? 0) / 10) : 0;

  const ProbeComponent = PROBE_MAP[probeType] ?? PlaceholderProbe;
  const streak = getStreak(run.probeHistory ?? []);

  return (
    <div style={{ minHeight: '100dvh', background: COLORS_UI.bg, display: 'flex', flexDirection: 'column', maxWidth: '460px', margin: '0 auto', position: 'relative' }}>

      {/* BLOQUE 2: danger border permanente a 1 vida */}
      <DangerBorder active={run.lives === 1} />

      {/* Header: char panel + lives + progress */}
      <div style={{ padding: `${SPACING[3]} ${SPACING[3]} ${SPACING[2]}`, borderBottom: `1px solid ${COLORS_UI.border}`, background: COLORS_UI.bg, position: 'relative', zIndex: 10 }}>

        {/* Row 1: char panel + residuos + hearts */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SPACING[2], marginBottom: SPACING[2] }}>
          <CharPanel char={char} reaction={reaction} streak={streak} auraGlow={auraGlow} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: SPACING[1] }}>
            <HeartsBar lives={run.lives} max={run.maxLives ?? 3} breakIndex={breakIndex} />
            <ResiduosBar count={char.temporalResidues ?? 0} />
          </div>
        </div>

        {/* Row 2: probe info + ecos */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: SPACING[2], alignItems: 'center' }}>
            <motion.button whileTap={{ scale: 0.94 }} onClick={() => setExitModal(true)}
              style={{ background: 'transparent', border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.md, color: COLORS_UI.textMuted, fontFamily: TYPOGRAPHY.fontFamily, fontSize: '9px', padding: '2px 6px', cursor: 'pointer', letterSpacing: '0.04em', flexShrink: 0 }}>
              ✕ Salir
            </motion.button>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: run.infiniteMode ? '#FFD700' : run.isPerfectSync ? '#FFD700' : run.isDailyChallenge ? '#A78BFA' : COLORS_UI.textMuted, letterSpacing: '0.06em' }}>
              {run.infiniteMode
                ? `∞ Prueba ${infiniteN}`
                : run.isPerfectSync
                  ? `✦ ${Math.min(probeNumber, 10)}/10`
                  : run.isDailyChallenge
                    ? `☀ ${Math.min(probeNumber, 10)}/10`
                    : `PRUEBA ${Math.min(probeNumber, 10)}/10`}
            </div>
            {run.infiniteMode && (speedSteps > 0 || marginSteps > 0) && (
              <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '9px', color: 'rgba(255,215,0,0.55)', letterSpacing: '0.03em' }}>
                {speedSteps > 0 && `×${(1 + speedSteps * 0.05).toFixed(2)}`}
                {speedSteps > 0 && marginSteps > 0 && ' '}
                {marginSteps > 0 && `−${marginSteps}m`}
              </div>
            )}
            {run.isDailyChallenge && run.dailyCondition?.id !== 'standard' && (
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '9px', color: 'rgba(167,139,250,0.7)', letterSpacing: '0.03em' }}>
                {run.dailyCondition?.label}
              </div>
            )}
          </div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textSecondary }}>
            {PROBE_LABELS[probeType] ?? probeType.toUpperCase()}
          </div>
        </div>

        {/* Barra progreso */}
        <div style={{ height: '3px', background: COLORS_UI.bgElevated, borderRadius: BORDERS.radius.full, overflow: 'hidden', marginTop: SPACING[2] }}>
          <motion.div animate={{ width: `${Math.min(100, ((probeNumber - 1) / 10) * 100)}%` }} transition={{ duration: 0.4 }}
            style={{ height: '100%', background: run.lives > 1 ? COLORS_GAME.verde : COLORS_GAME.rojo, borderRadius: BORDERS.radius.full }} />
        </div>
      </div>

      {/* Probe area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <ProbeComponent
          key={`probe-${probeKey}-${probeNumber}`}
          config={config}
          character={char}
          onComplete={handleProbeComplete}
        />
      </div>

      {/* Ecos activos */}
      <EcoBar activeEcoIds={run.activeEcos ?? []} doubledEcos={run.doubledEcos ?? []} />

      {/* BLOQUE 3: habilidades bar */}
      <AbilityBar
        passiveAbility={passiveAbility}
        activeAbility={activeAbility}
        activeUsed={run.abilityUsed}
        usedViaAura={run.abilityUsedViaAura}
        onActiveUse={handleAbilityUse}
      />

      {/* BLOQUE 2: life lost feedback */}
      <LifeLostFeedback show={lifeLostFlash} flavorText={failFlavor} />

      {/* BLOQUE 4: transición entre pruebas */}
      <AnimatePresence>
        {showTransition && transitionInfo && (
          <ProbeTransitionOverlay
            key="transition"
            probeNumber={transitionInfo.probeNumber}
            probeType={transitionInfo.probeType}
            showPreview={transitionInfo.showPreview}
            infiniteMode={transitionInfo.infiniteMode}
          />
        )}
      </AnimatePresence>

      {/* Mercy run banner */}
      <AnimatePresence>
        {showMercyBanner && <MercyRunBanner key="mercy-banner" />}
      </AnimatePresence>

      {/* Perfect sync flash */}
      <AnimatePresence>
        {perfectFlash && <PerfectFlashOverlay key="perfect-flash" flavorText={perfectFlavor} />}
      </AnimatePresence>

      {/* Pass flash */}
      <AnimatePresence>
        {passFlash && <PassFlashOverlay key="pass-flash" flavorText={passFlavor} />}
      </AnimatePresence>

      {/* Sync start overlay */}
      <AnimatePresence>
        {showSyncStart && <SyncStartOverlay key="sync-start" charName={char?.name ?? ''} />}
      </AnimatePresence>

      {/* Free probe 1 overlay */}
      <AnimatePresence>
        {freeProbe1Active && <FreeProbe1Overlay key="free-probe1" />}
      </AnimatePresence>

      {/* BLOQUE 3: Aura flash */}
      <AnimatePresence>
        {auraFlash && (
          <AuraFlashOverlay key="aura-flash"
            auraNumber={char.auraNumber}
            abilityName={char.auraAbility?.name}
            effectMessage={auraEffectMsg}
          />
        )}
      </AnimatePresence>

      {/* Eco discard (obligatorio al tener 5 ecos) */}
      <AnimatePresence>
        {phase === 'eco-discard' && (
          <EcoDiscardOverlay key="eco-discard"
            currentEcoIds={run.activeEcos ?? []}
            onDiscard={(ecoId) => {
              removeRunEco(ecoId);
              setPhase('eco-select');
            }}
          />
        )}
      </AnimatePresence>

      {/* Eco select */}
      <AnimatePresence>
        {phase === 'eco-select' && (
          <EcoSelectOverlay key="eco-select" options={ecoOptions}
            onSelect={(ecoId) => {
              addRunEco(ecoId);
              setPhase('running');
              setTimeout(advanceToNextProbe, 200);
            }}
          />
        )}
      </AnimatePresence>

      {/* Infinite offer */}
      <AnimatePresence>
        {phase === 'infinite-offer' && (
          <InfiniteOfferOverlay key="infinite-offer"
            onAccept={() => { enableInfiniteMode(); setPhase('running'); setProbeKey(k => k + 1); }}
            onDecline={() => { endRun(); setScreen('run-result'); }}
          />
        )}
      </AnimatePresence>

      {/* Exit confirmation */}
      <AnimatePresence>
        {exitModal && (
          <motion.div key="exit-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setExitModal(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 250, display: 'flex', alignItems: 'flex-end' }}>
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: '460px', margin: '0 auto', background: COLORS_UI.bgElevated, borderRadius: `${BORDERS.radius.xl} ${BORDERS.radius.xl} 0 0`, padding: SPACING[5], display: 'flex', flexDirection: 'column', gap: SPACING[4], paddingBottom: SPACING[8] }}>
              <div style={{ width: '40px', height: '4px', background: COLORS_UI.border, borderRadius: BORDERS.radius.full, margin: '0 auto' }} />
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text, textAlign: 'center' }}>
                ¿Interrumpir la sincronización?
              </div>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textSecondary, textAlign: 'center', lineHeight: 1.5 }}>
                El progreso de esta sincronización se perderá, pero el grado de tu personaje quedará intacto.
              </div>
              <div style={{ display: 'flex', gap: SPACING[2] }}>
                <button onClick={() => setExitModal(false)}
                  style={{ flex: 1, minHeight: '48px', background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, color: COLORS_UI.text, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={() => { abandonRun(); setScreen('home'); }}
                  style={{ flex: 1, minHeight: '48px', background: 'rgba(224,59,59,0.18)', border: '1px solid rgba(224,59,59,0.45)', borderRadius: BORDERS.radius.lg, color: '#E03B3B', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, cursor: 'pointer' }}>
                  Salir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
