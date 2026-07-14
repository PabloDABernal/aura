/**
 * CiegoProbe — timer goes dark after visibleSec seconds.
 * Player must stop at target centésimas purely by feel.
 * GDD v2.1 — A Ciegas.
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  COLORS_UI, COLORS_GAME,
  TYPOGRAPHY, SPACING, BORDERS,
} from '../../styles/tokens.js';
import { evaluateResult } from '../../engine/run/resultEvaluator.js';
import { playTickSound } from '../../engine/audio/audioEngine.js';

function autoTarget() {
  return Math.floor(Math.random() * 100);
}

export default function CiegoProbe({ config, character, onComplete }) {
  const totalMs    = (config.totalSec  ?? 10) * 1000;
  const visibleMs  = (config.visibleSec ?? 3) * 1000;
  const baseMargin = config.margin     ?? 5;

  const [target]       = useState(() => config.target != null ? config.target : autoTarget());
  // phases: ready → visible → dark → done
  const [phase,        setPhase]       = useState('ready');
  const [elapsed,      setElapsed]     = useState(0);
  const [margin,       setMargin]      = useState(baseMargin);
  const [auraFlash,    setAuraFlash]   = useState(null);
  const [result,       setResult]      = useState(null);

  const rafRef         = useRef(null);
  const rafStartRef    = useRef(0);
  const baseElapsed    = useRef(0);
  const marginRef      = useRef(baseMargin);
  const auraTriggered  = useRef(false);
  const phaseRef       = useRef('ready');
  const darkTimerRef   = useRef(null);

  useEffect(() => { marginRef.current = margin; }, [margin]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // Periodic tick during dark phase (audio timing cue)
  useEffect(() => {
    if (phase !== 'dark') return;
    const freq = config.tickFrequency ?? 1000;
    const id = setInterval(() => playTickSound(), freq);
    return () => clearInterval(id);
  }, [phase, config.tickFrequency]);

  useEffect(() => () => {
    if (rafRef.current)        cancelAnimationFrame(rafRef.current);
    if (darkTimerRef.current)  clearTimeout(darkTimerRef.current);
  }, []);

  // ── RAF tick ─────────────────────────────────────────────────────────────────
  const startRAF = () => {
    rafStartRef.current = performance.now();
    const tick = () => {
      const el = baseElapsed.current + (performance.now() - rafStartRef.current);

      // Transition to dark at visibleMs
      if (phaseRef.current === 'visible' && el >= visibleMs) {
        setPhase('dark');
        phaseRef.current = 'dark';
      }

      if (el >= totalMs) {
        baseElapsed.current = totalMs;
        setElapsed(totalMs);
        doEnd('fail', totalMs);
        return;
      }

      setElapsed(el);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const stopRAFInternal = () => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    baseElapsed.current = baseElapsed.current + (performance.now() - rafStartRef.current);
  };

  const doEnd = (res, frozenMs) => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    setPhase('done');
    setResult({ pass: res === 'pass', frozenMs });
    setTimeout(() => onComplete({ result: res, auraTriggered: auraTriggered.current }), 800);
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleStart = () => {
    baseElapsed.current = 0;
    setElapsed(0);
    setPhase('visible');
    phaseRef.current = 'visible';
    startRAF();
  };

  const handleStop = () => {
    const p = phaseRef.current;
    if (p !== 'visible' && p !== 'dark') return;
    stopRAFInternal();

    const frozenMs = baseElapsed.current;
    const cents    = Math.floor((frozenMs % 1000) / 10);

    setElapsed(frozenMs);

    // Aura check
    let effectiveMargin = marginRef.current;
    if (cents === character?.auraNumber && !auraTriggered.current) {
      auraTriggered.current = true;
      effectiveMargin += 5;
      setMargin(m => m + 5);
      setAuraFlash(character?.auraAbility?.name ?? `#${String(character.auraNumber).padStart(2,'0')}`);
      setTimeout(() => setAuraFlash(null), 2500);
    }

    const diff = Math.abs(cents - target);
    const res  = evaluateResult(diff, effectiveMargin);

    setResult({ result: res, frozenMs, cents, diff });
    setPhase('done');
    setTimeout(() => onComplete({ result: res, auraTriggered: auraTriggered.current }), 800);
  };

  // ── Display values ────────────────────────────────────────────────────────────
  const dispSecs   = Math.floor(elapsed / 1000);
  const dispCents  = Math.floor((elapsed % 1000) / 10);
  const dispStr    = `${dispSecs}.${String(dispCents).padStart(2,'0')}`;

  const timeLeftMs  = Math.max(0, totalMs - elapsed);
  const timeLeftPct = (timeLeftMs / totalMs) * 100;

  // Show the full timer only in ready/visible/done
  const showTimer   = phase === 'visible' || phase === 'done';
  const showDark    = phase === 'dark';

  const timerColor = phase === 'done'
    ? (result?.result === 'fail' ? COLORS_GAME.rojo : result?.result === 'perfect' ? '#FFD700' : COLORS_GAME.verde)
    : COLORS_UI.text;

  return (
    <div style={{
      flex:          1,
      display:       'flex',
      flexDirection: 'column',
      padding:       SPACING[4],
      gap:           SPACING[4],
      userSelect:    'none',
      // Dark overlay effect when in dark phase
      background:    showDark ? '#080810' : 'transparent',
      transition:    'background 0.4s ease',
      borderRadius:  BORDERS.radius.lg,
    }}>

      {/* Aura flash */}
      <AnimatePresence>
        {auraFlash && (
          <motion.div key="aura"
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: '12%', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(255,215,0,0.12)', border: '1px solid #FFD700',
              borderRadius: BORDERS.radius.lg, padding: `${SPACING[2]} ${SPACING[5]}`,
              color: '#FFD700', fontFamily: TYPOGRAPHY.fontFamily,
              fontWeight: TYPOGRAPHY.weight.bold, fontSize: TYPOGRAPHY.size.md,
              zIndex: 300, whiteSpace: 'nowrap',
            }}>
            ✨ AURA — {auraFlash} (+5 margen)
          </motion.div>
        )}
      </AnimatePresence>

      {/* Time-remaining bar at top — always visible when running */}
      {(phase === 'visible' || phase === 'dark') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[1] }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{
              fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs,
              color: showDark ? 'rgba(136,136,168,0.4)' : COLORS_UI.textMuted,
              letterSpacing: '0.06em',
              transition: 'color 0.4s',
            }}>
              {showDark ? 'A CIEGAS' : 'CIEGO'}
            </span>
            <span style={{
              fontFamily:  TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs,
              color:       showDark
                ? (timeLeftMs < 2000 ? 'rgba(224,59,59,0.6)' : 'rgba(136,136,168,0.4)')
                : (timeLeftMs < 3000 ? COLORS_GAME.rojo : COLORS_UI.textSecondary),
              fontWeight:  TYPOGRAPHY.weight.bold,
              transition:  'color 0.4s',
            }}>
              {(timeLeftMs / 1000).toFixed(1)}s
            </span>
          </div>
          <div style={{
            height: '8px', borderRadius: BORDERS.radius.full,
            background: showDark ? 'rgba(46,46,62,0.5)' : COLORS_UI.border,
            overflow: 'hidden',
            transition: 'background 0.4s',
          }}>
            <div style={{
              height: '100%', borderRadius: BORDERS.radius.full,
              width: `${timeLeftPct}%`,
              background: showDark
                ? (timeLeftMs < 2000 ? 'rgba(224,59,59,0.5)' : 'rgba(59,168,79,0.3)')
                : (timeLeftMs < 3000 ? COLORS_GAME.rojo : COLORS_GAME.verde),
              transition: 'width 0.05s linear, background 0.3s',
            }} />
          </div>
        </div>
      )}

      {/* Header (hidden in dark mode) */}
      {phase !== 'dark' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs,
            color: COLORS_UI.textMuted, letterSpacing: '0.06em',
          }}>
            A CIEGAS
          </span>
          <div style={{ display: 'flex', gap: SPACING[2], alignItems: 'center' }}>
            {character?.auraNumber != null && (
              <div style={{
                padding:      `1px ${SPACING[2]}`,
                background:   'rgba(255,215,0,0.08)',
                border:       '1px solid rgba(255,215,0,0.3)',
                borderRadius: BORDERS.radius.full,
                fontFamily:   TYPOGRAPHY.fontFamilyMono,
                fontSize:     '10px', color: '#FFD700', whiteSpace: 'nowrap',
              }}>
                ✨ #{String(character.auraNumber).padStart(2,'0')} +5 margen
              </div>
            )}
            <span style={{
              fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs,
              color: COLORS_UI.textMuted,
            }}>
              ±{margin}
            </span>
          </div>
        </div>
      )}

      {/* Target — always visible */}
      <div style={{
        background: showDark
          ? 'rgba(26,26,34,0.4)'
          : COLORS_UI.bgElevated,
        border: `1px solid ${showDark ? 'rgba(46,46,62,0.3)' : COLORS_UI.border}`,
        borderRadius: BORDERS.radius.xl,
        padding: `${SPACING[3]} ${SPACING[5]}`,
        textAlign: 'center',
        transition: 'background 0.4s, border-color 0.4s',
      }}>
        <div style={{
          fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm,
          color: showDark ? 'rgba(85,85,106,0.6)' : COLORS_UI.textMuted,
          letterSpacing: '0.1em', marginBottom: SPACING[1],
          transition: 'color 0.4s',
        }}>
          OBJETIVO
        </div>
        <div style={{
          fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size['2xl'],
          fontWeight: TYPOGRAPHY.weight.black,
          color: showDark ? 'rgba(255,215,0,0.5)' : '#FFD700',
          letterSpacing: '0.04em',
          transition: 'color 0.4s',
        }}>
          .{String(target).padStart(2,'0')}
        </div>
        <div style={{
          fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs,
          color: showDark ? 'rgba(85,85,106,0.5)' : COLORS_UI.textMuted,
          marginTop: SPACING[1],
          transition: 'color 0.4s',
        }}>
          ±{margin} centésimas
        </div>
      </div>

      {/* Visible seconds counter (shown in visible phase as hint) */}
      {phase === 'visible' && (
        <div style={{ textAlign: 'center' }}>
          <span style={{
            fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs,
            color: COLORS_UI.textMuted,
          }}>
            oscurece en {Math.max(0, ((visibleMs - elapsed) / 1000)).toFixed(1)}s
          </span>
        </div>
      )}

      {/* Main timer display */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

        {phase === 'ready' && (
          <div style={{
            fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size['2xl'],
            color: COLORS_UI.textMuted, letterSpacing: '0.06em',
          }}>
            0.00
          </div>
        )}

        {phase === 'visible' && (
          <div style={{
            fontFamily:    TYPOGRAPHY.fontFamilyMono,
            fontSize:      'clamp(64px, 18vw, 96px)',
            fontWeight:    TYPOGRAPHY.weight.black,
            color:         COLORS_UI.text,
            letterSpacing: '0.02em',
            lineHeight:    1,
          }}>
            {dispStr}
          </div>
        )}

        {phase === 'dark' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
            style={{
              fontFamily:    TYPOGRAPHY.fontFamilyMono,
              fontSize:      'clamp(64px, 18vw, 96px)',
              fontWeight:    TYPOGRAPHY.weight.black,
              color:         'rgba(85,85,106,0.25)',
              letterSpacing: '0.06em',
              lineHeight:    1,
            }}
          >
            ▓▓▓
          </motion.div>
        )}

        {phase === 'done' && (
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 0.35 }}
            style={{
              fontFamily:    TYPOGRAPHY.fontFamilyMono,
              fontSize:      'clamp(64px, 18vw, 96px)',
              fontWeight:    TYPOGRAPHY.weight.black,
              color:         timerColor,
              letterSpacing: '0.02em',
              lineHeight:    1,
            }}
          >
            {dispStr}
          </motion.div>
        )}
      </div>

      {/* Done result */}
      <AnimatePresence>
        {phase === 'done' && result && (
          <motion.div key="result"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ textAlign: 'center' }}
          >
            {result.result !== 'fail' ? (
              <span style={{
                fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg,
                fontWeight: TYPOGRAPHY.weight.bold,
                color: result.result === 'perfect' ? '#FFD700' : COLORS_GAME.verde,
                letterSpacing: '0.1em',
              }}>
                {result.result === 'perfect' ? '✦ PERFECTO' : '✓ EXACTO'}
              </span>
            ) : (
              <span style={{
                fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.md,
                color: COLORS_UI.textSecondary,
              }}>
                <span style={{ color: COLORS_UI.textMuted }}>objetivo </span>
                <span style={{ color: '#FFD700' }}>.{String(target).padStart(2,'00')}</span>
                <span style={{ color: COLORS_UI.textMuted }}> → tú </span>
                <span style={{ color: COLORS_GAME.rojo, fontWeight: TYPOGRAPHY.weight.bold }}>
                  .{String(result.cents).padStart(2,'00')}
                </span>
                <span style={{ color: COLORS_UI.textMuted, fontSize: TYPOGRAPHY.size.xs }}>
                  {' '}({result.diff > 0 ? '+' : ''}{result.cents - target})
                </span>
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buttons */}
      {phase === 'ready' && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleStart}
          style={{
            width: '100%', minHeight: '72px',
            background: COLORS_GAME.verde, border: 'none',
            borderRadius: BORDERS.radius.xl, fontFamily: TYPOGRAPHY.fontFamily,
            fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black,
            color: 'white', letterSpacing: '0.12em', cursor: 'pointer',
            boxShadow: `0 6px 28px ${COLORS_GAME.verde}60`,
          }}>
          EMPEZAR
        </motion.button>
      )}

      {(phase === 'visible' || phase === 'dark') && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleStop}
          style={{
            width: '100%', minHeight: '88px',
            background: showDark
              ? 'rgba(224,59,59,0.85)'
              : COLORS_GAME.rojo,
            border: showDark ? '1px solid rgba(224,59,59,0.4)' : 'none',
            borderRadius: BORDERS.radius.xl, fontFamily: TYPOGRAPHY.fontFamily,
            fontSize: 'clamp(22px, 6vw, 32px)', fontWeight: TYPOGRAPHY.weight.black,
            color: 'white', letterSpacing: '0.14em', cursor: 'pointer',
            boxShadow: showDark
              ? `0 6px 32px rgba(224,59,59,0.3)`
              : `0 6px 32px ${COLORS_GAME.rojo}80`,
            transition: 'background 0.4s, box-shadow 0.4s',
          }}>
          PARAR
        </motion.button>
      )}
    </div>
  );
}
