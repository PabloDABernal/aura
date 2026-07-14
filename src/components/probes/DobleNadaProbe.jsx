/**
 * DobleNadaProbe — Double or Nothing mechanic. Each stop accumulates the full elapsed
 * seconds (X.XX float). Exceed explosionLimit → instant fail. Reach targetIdeal ± margin → pass.
 * Aura bonus: centésimas === auraNumber → that stop's value is halved.
 * GDD v2.1 Sección 4: Doble o Nada.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  COLORS_UI, COLORS_GAME,
  TYPOGRAPHY, SPACING, BORDERS,
} from '../../styles/tokens.js';

function fmt2(n) {
  return n.toFixed(2);
}

export default function DobleNadaProbe({ config, character, onComplete }) {
  const maxStops       = config.maxStops       ?? 3;
  const explosionLimit = config.explosionLimit ?? 9.00;
  const targetIdeal    = config.targetIdeal    ?? 8.50;
  const margin         = config.margin         ?? 0.30;
  const totalSec       = config.totalSec       ?? 10;

  // phase: 'ready' | 'running' | 'stopped' | 'done'
  const [phase,        setPhase]        = useState('ready');
  const [elapsed,      setElapsed]      = useState(0);
  const [total,        setTotal]        = useState(0);
  const [stopsUsed,    setStopsUsed]    = useState(0);
  const [stopHistory,  setStopHistory]  = useState([]);   // { added, halfed, newTotal }[]
  const [lastAdded,    setLastAdded]    = useState(null);
  const [auraFlash,    setAuraFlash]    = useState(false);
  const [exploded,     setExploded]     = useState(false);
  const [finalResult,  setFinalResult]  = useState(null); // 'pass' | 'fail'

  const rafRef        = useRef(null);
  const rafStartRef   = useRef(0);
  const baseElapsed   = useRef(0);
  const auraTriggered = useRef(false);
  const phaseRef      = useRef('ready');
  const totalRef      = useRef(0);
  const stopsRef      = useRef(0);
  const totalMs       = totalSec * 1000;

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { totalRef.current = total; }, [total]);
  useEffect(() => { stopsRef.current = stopsUsed; }, [stopsUsed]);
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // ── RAF — loops between stops ─────────────────────────────────────────────────
  const startRAF = useCallback(() => {
    baseElapsed.current = 0;
    rafStartRef.current = performance.now();
    setElapsed(0);
    const tick = () => {
      if (phaseRef.current !== 'running') return;
      const el = baseElapsed.current + (performance.now() - rafStartRef.current);
      if (el >= totalMs) {
        baseElapsed.current = totalMs;
        setElapsed(totalMs);
        // Time ran out on this leg — forced end
        forceEnd();
        return;
      }
      setElapsed(el);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [totalMs]); // forceEnd defined below — OK

  const stopRAFNow = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    baseElapsed.current = baseElapsed.current + (performance.now() - rafStartRef.current);
  }, []);

  const forceEnd = useCallback(() => {
    stopRAFNow();
    const tot = totalRef.current;
    const win = Math.abs(tot - targetIdeal) <= margin && tot <= explosionLimit;
    const result = win && Math.abs(tot - targetIdeal) <= margin / 2 ? 'perfect' : win ? 'pass' : 'fail';
    setFinalResult(result === 'fail' ? 'fail' : 'pass');
    setPhase('done');
    phaseRef.current = 'done';
    setTimeout(() => onComplete({ result, auraTriggered: auraTriggered.current }), 800);
  }, [stopRAFNow, targetIdeal, margin, explosionLimit, onComplete]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleStart = () => {
    baseElapsed.current = 0;
    setElapsed(0);
    setTotal(0);
    totalRef.current = 0;
    setStopsUsed(0);
    stopsRef.current = 0;
    setStopHistory([]);
    setPhase('running');
    phaseRef.current = 'running';
    startRAF();
  };

  const handleStop = () => {
    if (phaseRef.current !== 'running') return;
    stopRAFNow();

    const frozenMs  = baseElapsed.current;
    const cents     = Math.floor((frozenMs % 1000) / 10);
    const rawSec    = frozenMs / 1000;
    setElapsed(frozenMs);

    const aura = cents === character?.auraNumber;
    if (aura) {
      auraTriggered.current = true;
      setAuraFlash(true);
      setTimeout(() => setAuraFlash(false), 2000);
    }

    const added    = aura ? rawSec / 2 : rawSec;
    const newTotal = totalRef.current + added;

    totalRef.current = newTotal;
    setTotal(newTotal);

    const entry = { added, halved: aura, rawSec, newTotal };
    setLastAdded(entry);
    setStopHistory(prev => [...prev, entry]);

    const newStops = stopsRef.current + 1;
    stopsRef.current = newStops;
    setStopsUsed(newStops);

    setPhase('stopped');
    phaseRef.current = 'stopped';

    // Explosion check
    if (newTotal > explosionLimit) {
      setExploded(true);
      setTimeout(() => {
        setFinalResult('fail');
        setPhase('done');
        phaseRef.current = 'done';
        onComplete({ result: 'fail', auraTriggered: auraTriggered.current });
      }, 900);
      return;
    }

    // Max stops reached → forced finish
    if (newStops >= maxStops) {
      const win    = Math.abs(newTotal - targetIdeal) <= margin;
      const result = win && Math.abs(newTotal - targetIdeal) <= margin / 2 ? 'perfect' : win ? 'pass' : 'fail';
      setTimeout(() => {
        setFinalResult(result === 'fail' ? 'fail' : 'pass');
        setPhase('done');
        phaseRef.current = 'done';
        onComplete({ result, auraTriggered: auraTriggered.current });
      }, 900);
    }
  };

  const handleContinue = () => {
    if (phaseRef.current !== 'stopped') return;
    setLastAdded(null);
    setPhase('running');
    phaseRef.current = 'running';
    startRAF();
  };

  const handleTerminate = () => {
    if (phaseRef.current !== 'stopped') return;
    const tot    = totalRef.current;
    const win    = Math.abs(tot - targetIdeal) <= margin && tot <= explosionLimit;
    const result = win && Math.abs(tot - targetIdeal) <= margin / 2 ? 'perfect' : win ? 'pass' : 'fail';
    setFinalResult(result === 'fail' ? 'fail' : 'pass');
    setPhase('done');
    phaseRef.current = 'done';
    setTimeout(() => onComplete({ result, auraTriggered: auraTriggered.current }), 800);
  };

  // ── Display ──────────────────────────────────────────────────────────────────
  const currentCents    = Math.floor((elapsed % 1000) / 10);
  const dispSecs        = Math.floor(elapsed / 1000);
  const dispCents       = String(currentCents).padStart(2, '0');
  const stopsRemaining  = maxStops - stopsUsed;

  // Progress bar
  const totalPct        = Math.min(100, (total / explosionLimit) * 100);
  const targetMinPct    = Math.min(100, Math.max(0, ((targetIdeal - margin) / explosionLimit) * 100));
  const targetMaxPct    = Math.min(100, ((targetIdeal + margin) / explosionLimit) * 100);
  const targetZoneWidth = targetMaxPct - targetMinPct;

  const isDanger        = total > explosionLimit * 0.8;
  const totalColor      = exploded
    ? COLORS_GAME.rojo
    : isDanger
      ? '#FFD700'
      : COLORS_GAME.verde;

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
              position:     'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)',
              background:   'rgba(255,215,0,0.12)', border: '1px solid #FFD700',
              borderRadius: BORDERS.radius.lg, padding: `${SPACING[2]} ${SPACING[5]}`,
              color:        '#FFD700', fontFamily: TYPOGRAPHY.fontFamily,
              fontWeight:   TYPOGRAPHY.weight.bold, fontSize: TYPOGRAPHY.size.md,
              zIndex:       300, whiteSpace: 'nowrap',
            }}>
            AURA — valor a la mitad
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{
            fontFamily:   TYPOGRAPHY.fontFamily,
            fontSize:     TYPOGRAPHY.size.sm,
            fontWeight:   TYPOGRAPHY.weight.bold,
            color:        COLORS_UI.textSecondary,
            letterSpacing:'0.08em',
          }}>
            DOBLE O NADA
          </span>
          <span style={{
            fontFamily:  TYPOGRAPHY.fontFamilyMono,
            fontSize:    TYPOGRAPHY.size.xs,
            color:       COLORS_UI.textMuted,
          }}>
            objetivo: {fmt2(targetIdeal)} ±{fmt2(margin)} / límite: {fmt2(explosionLimit)}
          </span>
        </div>
        {character?.auraNumber != null && (
          <div style={{
            padding:      `1px ${SPACING[2]}`,
            background:   'rgba(255,215,0,0.08)',
            border:       '1px solid rgba(255,215,0,0.3)',
            borderRadius: BORDERS.radius.full,
            fontFamily:   TYPOGRAPHY.fontFamilyMono,
            fontSize:     '10px',
            color:        '#FFD700',
          }}>
            #{String(character.auraNumber).padStart(2,'0')} ÷2
          </div>
        )}
      </div>

      {/* Accumulated total */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily:   TYPOGRAPHY.fontFamilyMono,
          fontSize:     TYPOGRAPHY.size.xs,
          color:        COLORS_UI.textMuted,
          letterSpacing:'0.1em',
          marginBottom: SPACING[1],
        }}>
          TOTAL
        </div>
        <motion.div
          animate={exploded ? { x: [-6, 6, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
          style={{
            fontFamily:  TYPOGRAPHY.fontFamilyMono,
            fontSize:    'clamp(56px, 16vw, 80px)',
            fontWeight:  TYPOGRAPHY.weight.black,
            color:       totalColor,
            lineHeight:  1,
            transition:  'color 0.15s',
          }}
        >
          {fmt2(total)}
        </motion.div>
      </div>

      {/* Progress bar with target zone */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[1] }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{
            fontFamily:  TYPOGRAPHY.fontFamilyMono,
            fontSize:    TYPOGRAPHY.size.xs,
            color:       COLORS_UI.textMuted,
          }}>
            0
          </span>
          <span style={{
            fontFamily:  TYPOGRAPHY.fontFamilyMono,
            fontSize:    TYPOGRAPHY.size.xs,
            color:       COLORS_GAME.rojo,
            fontWeight:  TYPOGRAPHY.weight.bold,
          }}>
            LÍMITE {fmt2(explosionLimit)}
          </span>
        </div>
        <div style={{
          position:     'relative',
          height:       '24px',
          borderRadius: BORDERS.radius.full,
          background:   COLORS_UI.bgElevated,
          border:       `1px solid ${COLORS_UI.border}`,
          overflow:     'hidden',
        }}>
          {/* Target zone */}
          <div style={{
            position:   'absolute',
            left:       `${targetMinPct}%`,
            width:      `${targetZoneWidth}%`,
            top:        0,
            bottom:     0,
            background: 'rgba(59,168,79,0.25)',
            borderLeft: '2px solid rgba(59,168,79,0.8)',
            borderRight:'2px solid rgba(59,168,79,0.8)',
          }} />

          {/* Ideal center line */}
          <div style={{
            position:   'absolute',
            left:       `${Math.min(100, (targetIdeal / explosionLimit) * 100)}%`,
            top:        '10%',
            bottom:     '10%',
            width:      '2px',
            background: COLORS_GAME.verde,
            transform:  'translateX(-1px)',
            boxShadow:  `0 0 6px ${COLORS_GAME.verde}`,
          }} />

          {/* Total bar */}
          <motion.div
            animate={{ width: `${totalPct}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 15 }}
            style={{
              height:       '100%',
              borderRadius: BORDERS.radius.full,
              background:   isDanger || exploded
                ? `linear-gradient(90deg, ${COLORS_GAME.verde}80, ${exploded ? COLORS_GAME.rojo : '#FFA500'})`
                : `linear-gradient(90deg, ${COLORS_GAME.verde}60, ${COLORS_GAME.verde})`,
            }}
          />
        </div>
        {/* Target zone label */}
        <div style={{
          display:        'flex',
          justifyContent: 'center',
          gap:            SPACING[1],
        }}>
          <span style={{
            fontFamily:  TYPOGRAPHY.fontFamilyMono,
            fontSize:    TYPOGRAPHY.size.xs,
            color:       COLORS_GAME.verde,
          }}>
            zona: {fmt2(targetIdeal - margin)} – {fmt2(targetIdeal + margin)}
          </span>
        </div>
      </div>

      {/* Stop history */}
      {stopHistory.length > 0 && (
        <div style={{ display: 'flex', gap: SPACING[2], flexWrap: 'wrap' }}>
          {stopHistory.map((h, i) => (
            <div key={i} style={{
              padding:      `2px ${SPACING[2]}`,
              borderRadius: BORDERS.radius.md,
              background:   h.halved
                ? 'rgba(255,215,0,0.10)' : COLORS_UI.bgElevated,
              border:       `1px solid ${h.halved
                ? 'rgba(255,215,0,0.3)' : COLORS_UI.border}`,
              fontFamily:   TYPOGRAPHY.fontFamilyMono,
              fontSize:     TYPOGRAPHY.size.xs,
              color:        h.halved ? '#FFD700' : COLORS_UI.textSecondary,
              opacity:      i === stopHistory.length - 1 ? 1 : Math.max(0.3, 1 - (stopHistory.length - 1 - i) * 0.2),
            }}>
              +{fmt2(h.added)}{h.halved ? ' ★' : ''}
            </div>
          ))}
        </div>
      )}

      {/* Stops remaining */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontFamily:  TYPOGRAPHY.fontFamilyMono,
          fontSize:    TYPOGRAPHY.size.sm,
          color:       stopsRemaining <= 1
            ? COLORS_GAME.rojo : COLORS_UI.textSecondary,
          fontWeight:  TYPOGRAPHY.weight.bold,
        }}>
          {phase === 'done'
            ? 'FIN'
            : `${stopsRemaining} parada${stopsRemaining !== 1 ? 's' : ''} restante${stopsRemaining !== 1 ? 's' : ''}`}
        </span>
        {phase !== 'ready' && phase !== 'done' && (
          <span style={{
            fontFamily:  TYPOGRAPHY.fontFamilyMono,
            fontSize:    TYPOGRAPHY.size.sm,
            color:       COLORS_UI.textSecondary,
          }}>
            {totalSec}s / parada
          </span>
        )}
      </div>

      {/* Running timer */}
      {(phase === 'running') && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            fontFamily:   TYPOGRAPHY.fontFamilyMono,
            fontSize:     'clamp(48px, 14vw, 72px)',
            fontWeight:   TYPOGRAPHY.weight.black,
            color:        COLORS_UI.text,
            letterSpacing:'0.02em',
            lineHeight:   1,
          }}>
            {dispSecs}.{dispCents}
          </div>
        </div>
      )}

      {/* Stopped: show what was added */}
      <AnimatePresence>
        {phase === 'stopped' && lastAdded && !exploded && (
          <motion.div key="added"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              background:   COLORS_UI.bgCard,
              border:       `1px solid ${COLORS_UI.border}`,
              borderRadius: BORDERS.radius.lg,
              padding:      `${SPACING[3]} ${SPACING[4]}`,
              textAlign:    'center',
              display:      'flex',
              flexDirection:'column',
              gap:          SPACING[1],
            }}
          >
            <div style={{
              fontFamily:  TYPOGRAPHY.fontFamilyMono,
              fontSize:    TYPOGRAPHY.size.lg,
              fontWeight:  TYPOGRAPHY.weight.black,
              color:       lastAdded.halved ? '#FFD700' : COLORS_UI.text,
            }}>
              +{fmt2(lastAdded.added)}
              {lastAdded.halved && (
                <span style={{
                  fontSize:  TYPOGRAPHY.size.sm,
                  color:     '#FFD700',
                  marginLeft: SPACING[2],
                }}>
                  (mitad ★)
                </span>
              )}
            </div>
            <div style={{
              fontFamily:  TYPOGRAPHY.fontFamilyMono,
              fontSize:    TYPOGRAPHY.size.sm,
              color:       isDanger ? '#FFD700' : COLORS_UI.textSecondary,
            }}>
              Total: {fmt2(lastAdded.newTotal)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Explosion feedback */}
      <AnimatePresence>
        {exploded && (
          <motion.div key="exploded"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            style={{
              background:   'rgba(224,59,59,0.15)',
              border:       '1px solid rgba(224,59,59,0.5)',
              borderRadius: BORDERS.radius.lg,
              padding:      `${SPACING[3]} ${SPACING[4]}`,
              textAlign:    'center',
              fontFamily:   TYPOGRAPHY.fontFamily,
              fontSize:     TYPOGRAPHY.size.xl,
              fontWeight:   TYPOGRAPHY.weight.black,
              color:        COLORS_GAME.rojo,
              letterSpacing:'0.1em',
            }}
          >
            EXPLOSIÓN
          </motion.div>
        )}
      </AnimatePresence>

      {/* Done result */}
      <AnimatePresence>
        {phase === 'done' && finalResult && !exploded && (
          <motion.div key="result"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              background:   finalResult === 'pass'
                ? 'rgba(59,168,79,0.10)' : 'rgba(224,59,59,0.10)',
              border:       `1px solid ${finalResult === 'pass'
                ? 'rgba(59,168,79,0.4)' : 'rgba(224,59,59,0.4)'}`,
              borderRadius: BORDERS.radius.lg,
              padding:      `${SPACING[3]} ${SPACING[4]}`,
              textAlign:    'center',
            }}
          >
            <div style={{
              fontFamily:   TYPOGRAPHY.fontFamily,
              fontSize:     TYPOGRAPHY.size['2xl'],
              fontWeight:   TYPOGRAPHY.weight.black,
              color:        finalResult === 'pass' ? COLORS_GAME.verde : COLORS_GAME.rojo,
              letterSpacing:'0.08em',
              marginBottom: SPACING[1],
            }}>
              {finalResult === 'pass' ? 'ACERTADO' : 'FALLADO'}
            </div>
            <div style={{
              fontFamily:  TYPOGRAPHY.fontFamilyMono,
              fontSize:    TYPOGRAPHY.size.sm,
              color:       COLORS_UI.textSecondary,
            }}>
              {fmt2(total)} — zona {fmt2(targetIdeal - margin)}–{fmt2(targetIdeal + margin)}
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

      {phase === 'stopped' && stopsRemaining > 0 && !exploded && (
        <div style={{ display: 'flex', gap: SPACING[3] }}>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleContinue}
            style={{
              flex:         1,
              minHeight:    '80px',
              background:   COLORS_GAME.rojo,
              border:       'none',
              borderRadius: BORDERS.radius.xl,
              fontFamily:   TYPOGRAPHY.fontFamily,
              fontSize:     TYPOGRAPHY.size.xl,
              fontWeight:   TYPOGRAPHY.weight.black,
              color:        'white',
              letterSpacing:'0.10em',
              cursor:       'pointer',
              boxShadow:    `0 4px 20px ${COLORS_GAME.rojo}60`,
            }}>
            CONTINUAR
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleTerminate}
            style={{
              flex:         1,
              minHeight:    '80px',
              background:   COLORS_UI.bgElevated,
              border:       `1px solid ${COLORS_GAME.verde}`,
              borderRadius: BORDERS.radius.xl,
              fontFamily:   TYPOGRAPHY.fontFamily,
              fontSize:     TYPOGRAPHY.size.xl,
              fontWeight:   TYPOGRAPHY.weight.black,
              color:        COLORS_GAME.verde,
              letterSpacing:'0.10em',
              cursor:       'pointer',
            }}>
            TERMINAR
          </motion.button>
        </div>
      )}
    </div>
  );
}
