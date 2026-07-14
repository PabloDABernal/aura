/**
 * MemoriaProbe — two-stop memory game.
 * Phase 1: stop timer, see centésimas briefly, then they're hidden.
 * Phase 2: timer restarts, stop again at the same centésimas (hidden display).
 * GDD v2.1 — Memoria.
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  COLORS_UI, COLORS_GAME,
  TYPOGRAPHY, SPACING, BORDERS,
} from '../../styles/tokens.js';
import { evaluateResult } from '../../engine/run/resultEvaluator.js';

export default function MemoriaProbe({ config, character, onComplete }) {
  const totalMs    = (config.totalSec  ?? 10) * 1000;
  const delayMs    = config.delayMs    ?? 3000;
  const visibleMs  = config.visibleMs  ?? 1500;
  const baseMargin = config.margin     ?? 5;

  // phases: ready → first → memorize → second → done
  const [phase,       setPhase]       = useState('ready');
  const [elapsed,     setElapsed]     = useState(0);
  const [firstCents,  setFirstCents]  = useState(null);  // centésimas from first stop
  const [showCents,   setShowCents]   = useState(false); // whether centésimas are shown in memorize phase
  const [delayLeft,   setDelayLeft]   = useState(delayMs); // countdown before second attempt
  const [margin,      setMargin]      = useState(baseMargin);
  const [auraFlash,   setAuraFlash]   = useState(null);
  const [result,      setResult]      = useState(null);

  const rafRef         = useRef(null);
  const rafStartRef    = useRef(0);
  const baseElapsed    = useRef(0);
  const marginRef      = useRef(baseMargin);
  const auraTriggered  = useRef(false);
  const phaseRef       = useRef('ready');
  const firstCentsRef  = useRef(null);
  const delayTimerRef  = useRef(null);
  const visibleTimerRef= useRef(null);

  useEffect(() => { marginRef.current = margin; }, [margin]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  useEffect(() => () => {
    if (rafRef.current)          cancelAnimationFrame(rafRef.current);
    if (delayTimerRef.current)   clearTimeout(delayTimerRef.current);
    if (visibleTimerRef.current) clearTimeout(visibleTimerRef.current);
  }, []);

  // ── RAF ───────────────────────────────────────────────────────────────────────
  const startRAF = () => {
    baseElapsed.current = 0;
    rafStartRef.current = performance.now();
    const tick = () => {
      const el = baseElapsed.current + (performance.now() - rafStartRef.current);
      if (el >= totalMs) {
        baseElapsed.current = totalMs;
        setElapsed(totalMs);
        // auto-fail if time runs out during 'first' or 'second'
        if (phaseRef.current === 'first') {
          doStopRAF();
          doEnd('fail');
        } else if (phaseRef.current === 'second') {
          doStopRAF();
          doEnd('fail');
        }
        return;
      }
      setElapsed(el);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const doStopRAF = () => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    baseElapsed.current = baseElapsed.current + (performance.now() - rafStartRef.current);
  };

  const doEnd = (res) => {
    setPhase('done');
    setTimeout(() => onComplete({ result: res, auraTriggered: auraTriggered.current }), 800);
  };

  // ── Phase: first stop ─────────────────────────────────────────────────────────
  const handleStart = () => {
    setPhase('first');
    phaseRef.current = 'first';
    startRAF();
  };

  const handleFirstStop = () => {
    if (phaseRef.current !== 'first') return;
    doStopRAF();

    const frozenMs = baseElapsed.current;
    const cents    = Math.floor((frozenMs % 1000) / 10);

    // Aura check on first stop
    if (cents === character?.auraNumber && !auraTriggered.current) {
      auraTriggered.current = true;
      setMargin(m => m + 5);
      marginRef.current += 5;
      setAuraFlash(character?.auraAbility?.name ?? `#${String(character.auraNumber).padStart(2,'0')}`);
      setTimeout(() => setAuraFlash(null), 2500);
    }

    setElapsed(frozenMs);
    setFirstCents(cents);
    firstCentsRef.current = cents;

    // Transition: memorize phase
    setPhase('memorize');
    phaseRef.current = 'memorize';
    setShowCents(true);

    // After visibleMs, hide centésimas
    visibleTimerRef.current = setTimeout(() => {
      setShowCents(false);
    }, visibleMs);

    // Delay countdown
    const delayStart = performance.now();
    const delayTick = () => {
      const left = delayMs - (performance.now() - delayStart);
      if (left <= 0) {
        setDelayLeft(0);
        // Begin second attempt
        setPhase('second');
        phaseRef.current = 'second';
        baseElapsed.current = 0;
        rafStartRef.current = performance.now();
        setElapsed(0);
        startSecondRAF();
        return;
      }
      setDelayLeft(left);
      delayTimerRef.current = setTimeout(delayTick, 50);
    };
    delayTimerRef.current = setTimeout(delayTick, 50);
  };

  // ── Second RAF (separate so we can track fresh elapsed) ──────────────────────
  const startSecondRAF = () => {
    baseElapsed.current  = 0;
    rafStartRef.current  = performance.now();
    const tick = () => {
      const el = baseElapsed.current + (performance.now() - rafStartRef.current);
      if (el >= totalMs) {
        baseElapsed.current = totalMs;
        setElapsed(totalMs);
        doStopRAF();
        doEnd('fail');
        return;
      }
      setElapsed(el);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const handleSecondStop = () => {
    if (phaseRef.current !== 'second') return;
    doStopRAF();

    const frozenMs    = baseElapsed.current;
    const secondCents = Math.floor((frozenMs % 1000) / 10);

    // Aura check on second stop too
    if (secondCents === character?.auraNumber && !auraTriggered.current) {
      auraTriggered.current = true;
      setMargin(m => m + 5);
      marginRef.current += 5;
      setAuraFlash(character?.auraAbility?.name ?? `#${String(character.auraNumber).padStart(2,'0')}`);
      setTimeout(() => setAuraFlash(null), 2500);
    }

    setElapsed(frozenMs);

    const diff      = Math.abs(secondCents - firstCentsRef.current);
    const resultStr = evaluateResult(diff, marginRef.current);

    setResult({ result: resultStr, firstCents: firstCentsRef.current, secondCents, diff });
    setPhase('done');
    setFirstCents(firstCentsRef.current);
    setTimeout(() => onComplete({ result: resultStr, auraTriggered: auraTriggered.current }), 800);
  };

  // ── Display values ────────────────────────────────────────────────────────────
  const dispSecs   = Math.floor(elapsed / 1000);
  const dispCents  = Math.floor((elapsed % 1000) / 10);

  // In second phase, centésimas are hidden: show "X.--"
  const secondDisplay = `${dispSecs}.--`;
  const firstDisplay  = firstCents !== null ? String(firstCents).padStart(2,'0') : '--';

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

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs,
          color: COLORS_UI.textMuted, letterSpacing: '0.06em',
        }}>
          MEMORIA
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

      {/* Phase instruction card */}
      <div style={{
        background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`,
        borderRadius: BORDERS.radius.xl,
        padding: `${SPACING[3]} ${SPACING[5]}`,
        textAlign: 'center',
      }}>
        {phase === 'ready' && (
          <>
            <div style={{
              fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm,
              color: COLORS_UI.textMuted, letterSpacing: '0.1em', marginBottom: SPACING[2],
            }}>
              CÓMO FUNCIONA
            </div>
            <div style={{
              fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md,
              color: COLORS_UI.textSecondary, lineHeight: 1.5,
            }}>
              Para el cronómetro, memoriza las centésimas y reprodúcelas en el segundo intento.
            </div>
          </>
        )}

        {phase === 'first' && (
          <div style={{
            fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg,
            color: COLORS_UI.textSecondary, fontWeight: TYPOGRAPHY.weight.bold,
            letterSpacing: '0.06em',
          }}>
            MEMORIZA EL VALOR
          </div>
        )}

        {phase === 'memorize' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
            <div style={{
              fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.sm,
              color: COLORS_UI.textMuted, letterSpacing: '0.08em',
            }}>
              VALOR CAPTURADO
            </div>
            <AnimatePresence mode="wait">
              {showCents ? (
                <motion.div key="show"
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }}
                  style={{
                    fontFamily: TYPOGRAPHY.fontFamilyMono,
                    fontSize:   TYPOGRAPHY.size['2xl'],
                    fontWeight: TYPOGRAPHY.weight.black,
                    color:      '#FFD700',
                    letterSpacing: '0.04em',
                  }}
                >
                  .{firstDisplay}
                </motion.div>
              ) : (
                <motion.div key="hide"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{
                    fontFamily: TYPOGRAPHY.fontFamilyMono,
                    fontSize:   TYPOGRAPHY.size['2xl'],
                    fontWeight: TYPOGRAPHY.weight.black,
                    color:      COLORS_UI.textMuted,
                    letterSpacing: '0.04em',
                  }}
                >
                  .??
                </motion.div>
              )}
            </AnimatePresence>
            <div style={{
              fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs,
              color: COLORS_UI.textMuted,
            }}>
              siguiente intento en {(delayLeft / 1000).toFixed(1)}s
            </div>
          </div>
        )}

        {phase === 'second' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[1] }}>
            <div style={{
              fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg,
              color: COLORS_UI.textSecondary, fontWeight: TYPOGRAPHY.weight.bold,
              letterSpacing: '0.06em',
            }}>
              REPRODUCE EL VALOR
            </div>
            <div style={{
              fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.sm,
              color: COLORS_UI.textMuted,
            }}>
              centésimas ocultas — para cuando sientas .{firstDisplay}
            </div>
          </div>
        )}

        {phase === 'done' && result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
            <div style={{
              fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg,
              fontWeight: TYPOGRAPHY.weight.bold,
              color: result.result === 'fail' ? COLORS_GAME.rojo : result.result === 'perfect' ? '#FFD700' : COLORS_GAME.verde,
              letterSpacing: '0.1em',
            }}>
              {result.result === 'fail' ? '✗ FALLADO' : result.result === 'perfect' ? '✦ PERFECTO' : '✓ EXACTO'}
            </div>
            <div style={{
              fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.sm,
              color: COLORS_UI.textSecondary,
            }}>
              <span style={{ color: COLORS_UI.textMuted }}>memorizado </span>
              <span style={{ color: '#FFD700' }}>.{String(result.firstCents).padStart(2,'0')}</span>
              <span style={{ color: COLORS_UI.textMuted }}> → reproducido </span>
              <span style={{ color: result.pass ? COLORS_GAME.verde : COLORS_GAME.rojo,
                fontWeight: TYPOGRAPHY.weight.bold }}>
                .{String(result.secondCents).padStart(2,'0')}
              </span>
              {!result.pass && (
                <span style={{ color: COLORS_UI.textMuted, fontSize: TYPOGRAPHY.size.xs }}>
                  {' '}(Δ{result.diff})
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Timer display */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {phase === 'ready' && (
          <div style={{
            fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size['2xl'],
            color: COLORS_UI.textMuted, letterSpacing: '0.06em',
          }}>
            0.00
          </div>
        )}

        {phase === 'first' && (
          <div style={{
            fontFamily:    TYPOGRAPHY.fontFamilyMono,
            fontSize:      'clamp(64px, 18vw, 96px)',
            fontWeight:    TYPOGRAPHY.weight.black,
            color:         COLORS_UI.text,
            letterSpacing: '0.02em',
            lineHeight:    1,
          }}>
            {dispSecs}.{String(dispCents).padStart(2,'0')}
          </div>
        )}

        {phase === 'memorize' && (
          <div style={{
            fontFamily:    TYPOGRAPHY.fontFamilyMono,
            fontSize:      'clamp(64px, 18vw, 96px)',
            fontWeight:    TYPOGRAPHY.weight.black,
            color:         COLORS_UI.textMuted,
            letterSpacing: '0.02em',
            lineHeight:    1,
          }}>
            {dispSecs}.{String(dispCents).padStart(2,'0')}
          </div>
        )}

        {phase === 'second' && (
          <div style={{
            fontFamily:    TYPOGRAPHY.fontFamilyMono,
            fontSize:      'clamp(64px, 18vw, 96px)',
            fontWeight:    TYPOGRAPHY.weight.black,
            color:         COLORS_UI.text,
            letterSpacing: '0.02em',
            lineHeight:    1,
          }}>
            {secondDisplay}
          </div>
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
            {dispSecs}.{String(dispCents).padStart(2,'00')}
          </motion.div>
        )}
      </div>

      {/* Delay progress bar during memorize */}
      {phase === 'memorize' && (
        <div style={{
          height: '4px', borderRadius: BORDERS.radius.full,
          background: COLORS_UI.border, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: BORDERS.radius.full,
            width: `${(delayLeft / delayMs) * 100}%`,
            background: COLORS_UI.textMuted,
            transition: 'width 0.05s linear',
          }} />
        </div>
      )}

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

      {phase === 'first' && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleFirstStop}
          style={{
            width: '100%', minHeight: '88px',
            background: COLORS_GAME.rojo, border: 'none',
            borderRadius: BORDERS.radius.xl, fontFamily: TYPOGRAPHY.fontFamily,
            fontSize: 'clamp(22px, 6vw, 32px)', fontWeight: TYPOGRAPHY.weight.black,
            color: 'white', letterSpacing: '0.14em', cursor: 'pointer',
            boxShadow: `0 6px 32px ${COLORS_GAME.rojo}80`,
          }}>
          PARAR
        </motion.button>
      )}

      {phase === 'memorize' && (
        <div style={{
          width: '100%', minHeight: '88px',
          background: COLORS_UI.bgElevated,
          border: `1px solid ${COLORS_UI.border}`,
          borderRadius: BORDERS.radius.xl,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg,
          color: COLORS_UI.textMuted, letterSpacing: '0.1em',
        }}>
          ESPERA...
        </div>
      )}

      {phase === 'second' && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleSecondStop}
          style={{
            width: '100%', minHeight: '88px',
            background: COLORS_GAME.rojo, border: 'none',
            borderRadius: BORDERS.radius.xl, fontFamily: TYPOGRAPHY.fontFamily,
            fontSize: 'clamp(22px, 6vw, 32px)', fontWeight: TYPOGRAPHY.weight.black,
            color: 'white', letterSpacing: '0.14em', cursor: 'pointer',
            boxShadow: `0 6px 32px ${COLORS_GAME.rojo}80`,
          }}>
          PARAR
        </motion.button>
      )}
    </div>
  );
}
