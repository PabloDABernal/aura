/**
 * ReboteProbe — Bounce/Delay mechanic. Timer stops `delayMs` after the click.
 * Player must compensate for the delay. Aura bonus: +5 margin.
 * GDD v2.1 Sección 4: Rebote.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  COLORS_UI, COLORS_GAME,
  TYPOGRAPHY, SPACING, BORDERS,
} from '../../styles/tokens.js';
import { evaluateResult } from '../../engine/run/resultEvaluator.js';

export default function ReboteProbe({ config, character, onComplete }) {
  const rawTarget  = config.target   ?? null;
  const baseMargin = config.margin   ?? 5;
  const delayMs    = config.delayMs  ?? 500;
  const showDelay  = config.showDelay ?? true;
  const totalSec   = config.totalSec  ?? 10;

  const [target]        = useState(() =>
    rawTarget !== null ? rawTarget : Math.floor(Math.random() * 100)
  );

  // phase: 'ready' | 'running' | 'processing' | 'result' | 'done'
  const [phase,         setPhase]         = useState('ready');
  const [elapsed,       setElapsed]       = useState(0);
  const [stoppedCents,  setStoppedCents]  = useState(null);
  const [passed,        setPassed]        = useState(false);
  const [auraTriggered, setAuraTriggeredState] = useState(false);

  const rafRef         = useRef(null);
  const rafStartRef    = useRef(0);
  const baseElapsed    = useRef(0);
  const delayTimerRef  = useRef(null);
  const auraRef        = useRef(false);
  const phaseRef       = useRef('ready');
  const totalMs        = totalSec * 1000;

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => () => {
    if (rafRef.current)    cancelAnimationFrame(rafRef.current);
    if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
  }, []);

  // ── RAF ──────────────────────────────────────────────────────────────────────
  const startRAF = useCallback(() => {
    rafStartRef.current = performance.now();
    const tick = () => {
      const el = baseElapsed.current + (performance.now() - rafStartRef.current);
      if (el >= totalMs) {
        baseElapsed.current = totalMs;
        setElapsed(totalMs);
        // Time ran out without stopping → fail
        if (phaseRef.current === 'running') {
          setPhase('result');
          phaseRef.current = 'result';
          setPassed(false);
          setTimeout(() => onComplete({ result: 'fail', auraTriggered: auraRef.current }), 800);
        }
        return;
      }
      setElapsed(el);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [totalMs, onComplete]);

  const stopRAFNow = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    baseElapsed.current = baseElapsed.current + (performance.now() - rafStartRef.current);
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleStart = () => {
    baseElapsed.current = 0;
    setElapsed(0);
    setPhase('running');
    phaseRef.current = 'running';
    startRAF();
  };

  const handleStop = () => {
    if (phaseRef.current !== 'running') return;
    // Don't stop RAF — timer keeps running during delay
    setPhase('processing');
    phaseRef.current = 'processing';

    delayTimerRef.current = setTimeout(() => {
      // Record actual value after delay
      stopRAFNow();
      const frozenMs = baseElapsed.current;
      const cents    = Math.floor((frozenMs % 1000) / 10);
      setElapsed(frozenMs);
      setStoppedCents(cents);

      const aura = cents === character?.auraNumber;
      if (aura) {
        auraRef.current = true;
        setAuraTriggeredState(true);
      }

      const effectiveMargin = baseMargin + (aura ? 5 : 0);
      const res = evaluateResult(Math.abs(cents - target), effectiveMargin);
      setPassed(res !== 'fail');
      setPhase('result');
      phaseRef.current = 'result';

      setTimeout(() => {
        onComplete({ result: res, auraTriggered: auraRef.current });
      }, 800);
    }, delayMs);
  };

  // ── Display ──────────────────────────────────────────────────────────────────
  const currentCents = Math.floor((elapsed % 1000) / 10);
  const dispSecs     = Math.floor(elapsed / 1000);
  const dispCents    = String(currentCents).padStart(2, '0');
  const timeLeftMs   = Math.max(0, totalMs - elapsed);
  const timeLeftSec  = (timeLeftMs / 1000).toFixed(1);
  const timePct      = Math.min(100, (elapsed / totalMs) * 100);

  const timerColor = phase === 'result'
    ? passed ? COLORS_GAME.verde : COLORS_GAME.rojo
    : phase === 'processing'
      ? '#FFD700'
      : COLORS_UI.text;

  const diff = stoppedCents !== null ? stoppedCents - target : null;

  return (
    <div style={{
      flex:          1,
      display:       'flex',
      flexDirection: 'column',
      padding:       SPACING[4],
      gap:           SPACING[4],
      userSelect:    'none',
    }}>

      {/* Aura flash */}
      <AnimatePresence>
        {auraTriggered && (
          <motion.div key="aura"
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              position:     'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)',
              background:   'rgba(255,215,0,0.12)', border: '1px solid #FFD700',
              borderRadius: BORDERS.radius.lg, padding: `${SPACING[2]} ${SPACING[5]}`,
              color:        '#FFD700', fontFamily: TYPOGRAPHY.fontFamily,
              fontWeight:   TYPOGRAPHY.weight.bold, fontSize: TYPOGRAPHY.size.md,
              zIndex:       300, whiteSpace: 'nowrap',
            }}>
            AURA — margen +5
          </motion.div>
        )}
      </AnimatePresence>

      {/* Target + delay badge */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: SPACING[2] }}>
        <div style={{
          fontFamily:   TYPOGRAPHY.fontFamilyMono,
          fontSize:     TYPOGRAPHY.size.xs,
          color:        COLORS_UI.textMuted,
          letterSpacing:'0.1em',
        }}>
          OBJETIVO
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[3] }}>
          <div style={{
            fontFamily:  TYPOGRAPHY.fontFamilyMono,
            fontSize:    'clamp(52px, 14vw, 72px)',
            fontWeight:  TYPOGRAPHY.weight.black,
            color:       COLORS_UI.text,
            lineHeight:  1,
          }}>
            .{String(target).padStart(2, '0')}
          </div>
          {showDelay && (
            <div style={{
              padding:      `${SPACING[1]} ${SPACING[3]}`,
              background:   'rgba(255,165,0,0.12)',
              border:       '1px solid rgba(255,165,0,0.35)',
              borderRadius: BORDERS.radius.md,
              fontFamily:   TYPOGRAPHY.fontFamilyMono,
              fontSize:     TYPOGRAPHY.size.sm,
              fontWeight:   TYPOGRAPHY.weight.bold,
              color:        '#FFA500',
              whiteSpace:   'nowrap',
            }}>
              Delay: {(delayMs / 1000).toFixed(1)}s
            </div>
          )}
        </div>
        <div style={{
          fontFamily:   TYPOGRAPHY.fontFamilyMono,
          fontSize:     TYPOGRAPHY.size.xs,
          color:        COLORS_UI.textMuted,
        }}>
          margen ±{baseMargin}
          {character?.auraNumber != null && (
            <span style={{ color: '#FFD700', marginLeft: SPACING[2] }}>
              #{String(character.auraNumber).padStart(2,'0')} +5
            </span>
          )}
        </div>
      </div>

      {/* Time bar */}
      {phase !== 'ready' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[1] }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{
              fontFamily:   TYPOGRAPHY.fontFamilyMono,
              fontSize:     TYPOGRAPHY.size.xs,
              color:        COLORS_UI.textMuted,
              letterSpacing:'0.06em',
            }}>
              TIEMPO
            </span>
            <span style={{
              fontFamily:  TYPOGRAPHY.fontFamilyMono,
              fontSize:    TYPOGRAPHY.size.sm,
              fontWeight:  TYPOGRAPHY.weight.bold,
              color:       Number(timeLeftSec) <= 3
                ? COLORS_GAME.rojo : COLORS_UI.textSecondary,
            }}>
              {timeLeftSec}s
            </span>
          </div>
          <div style={{
            height:       '6px',
            borderRadius: BORDERS.radius.full,
            background:   COLORS_UI.border,
            overflow:     'hidden',
          }}>
            <motion.div
              animate={{ width: `${timePct}%` }}
              transition={{ duration: 0.05 }}
              style={{
                height:       '100%',
                borderRadius: BORDERS.radius.full,
                background:   phase === 'processing'
                  ? '#FFA500'
                  : Number(timeLeftSec) <= 3
                    ? COLORS_GAME.rojo
                    : COLORS_GAME.verde,
              }}
            />
          </div>
        </div>
      )}

      {/* Big timer */}
      {phase !== 'ready' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div
            animate={phase === 'result' ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 0.3 }}
            style={{
              fontFamily:   TYPOGRAPHY.fontFamilyMono,
              fontSize:     'clamp(56px, 16vw, 80px)',
              fontWeight:   TYPOGRAPHY.weight.black,
              color:        timerColor,
              letterSpacing:'0.02em',
              lineHeight:   1,
              transition:   'color 0.15s',
            }}
          >
            {dispSecs}.{dispCents}
          </motion.div>
        </div>
      )}

      {/* Processing state */}
      <AnimatePresence>
        {phase === 'processing' && (
          <motion.div key="proc"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              textAlign:   'center',
              fontFamily:  TYPOGRAPHY.fontFamily,
              fontSize:    TYPOGRAPHY.size.md,
              fontWeight:  TYPOGRAPHY.weight.bold,
              color:       '#FFA500',
              letterSpacing:'0.1em',
            }}
          >
            Procesando...
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result feedback */}
      <AnimatePresence>
        {phase === 'result' && stoppedCents !== null && (
          <motion.div key="result"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              background:   passed
                ? 'rgba(59,168,79,0.10)' : 'rgba(224,59,59,0.10)',
              border:       `1px solid ${passed
                ? 'rgba(59,168,79,0.4)' : 'rgba(224,59,59,0.4)'}`,
              borderRadius: BORDERS.radius.lg,
              padding:      `${SPACING[3]} ${SPACING[4]}`,
              textAlign:    'center',
              display:      'flex',
              flexDirection:'column',
              gap:          SPACING[2],
            }}
          >
            <div style={{
              fontFamily:   TYPOGRAPHY.fontFamily,
              fontSize:     TYPOGRAPHY.size.lg,
              fontWeight:   TYPOGRAPHY.weight.black,
              color:        passed ? COLORS_GAME.verde : COLORS_GAME.rojo,
              letterSpacing:'0.08em',
            }}>
              {passed ? 'ACERTADO' : 'FALLADO'}
            </div>
            <div style={{
              fontFamily:  TYPOGRAPHY.fontFamilyMono,
              fontSize:    TYPOGRAPHY.size.sm,
              color:       COLORS_UI.textSecondary,
            }}>
              <span style={{ color: COLORS_UI.textMuted }}>tú </span>
              .{String(stoppedCents).padStart(2, '0')}
              <span style={{ color: COLORS_UI.textMuted }}> vs </span>
              .{String(target).padStart(2, '0')}
              {diff !== null && (
                <span style={{
                  marginLeft: SPACING[2],
                  color:      Math.abs(diff) <= baseMargin
                    ? COLORS_GAME.verde : COLORS_UI.textMuted,
                }}>
                  ({diff >= 0 ? '+' : ''}{diff})
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buttons */}
      {phase === 'ready' && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleStart}
          style={{
            width:        '100%',
            minHeight:    '72px',
            background:   COLORS_GAME.verde,
            border:       'none',
            borderRadius: BORDERS.radius.xl,
            fontFamily:   TYPOGRAPHY.fontFamily,
            fontSize:     TYPOGRAPHY.size.xl,
            fontWeight:   TYPOGRAPHY.weight.black,
            color:        'white',
            letterSpacing:'0.12em',
            cursor:       'pointer',
            boxShadow:    `0 6px 28px ${COLORS_GAME.verde}60`,
          }}>
          EMPEZAR
        </motion.button>
      )}

      {phase === 'running' && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleStop}
          style={{
            width:        '100%',
            minHeight:    '88px',
            background:   COLORS_GAME.rojo,
            border:       'none',
            borderRadius: BORDERS.radius.xl,
            fontFamily:   TYPOGRAPHY.fontFamily,
            fontSize:     'clamp(22px, 6vw, 32px)',
            fontWeight:   TYPOGRAPHY.weight.black,
            color:        'white',
            letterSpacing:'0.14em',
            cursor:       'pointer',
            boxShadow:    `0 6px 32px ${COLORS_GAME.rojo}80`,
          }}>
          PARAR
        </motion.button>
      )}

      {phase === 'processing' && (
        <div style={{
          width:        '100%',
          minHeight:    '88px',
          background:   COLORS_UI.bgElevated,
          border:       `1px solid ${COLORS_UI.border}`,
          borderRadius: BORDERS.radius.xl,
          display:      'flex',
          alignItems:   'center',
          justifyContent:'center',
          fontFamily:   TYPOGRAPHY.fontFamily,
          fontSize:     TYPOGRAPHY.size.xl,
          fontWeight:   TYPOGRAPHY.weight.black,
          color:        COLORS_UI.textMuted,
          letterSpacing:'0.12em',
        }}>
          Procesando...
        </div>
      )}
    </div>
  );
}
