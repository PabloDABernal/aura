/**
 * CadenaProbe — Chain mechanic. Sequential centésimas targets with shrinking time per link.
 * Hit each target within margin → advance. Miss (timeout or wrong stop) → fail.
 * Aura bonus: centésimas === auraNumber → +1 extra second on next link.
 * GDD v2.1 Sección 4: Cadena.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  COLORS_UI, COLORS_GAME,
  TYPOGRAPHY, SPACING, BORDERS,
} from '../../styles/tokens.js';

function randomCents() {
  return Math.floor(Math.random() * 100);
}

export default function CadenaProbe({ config, character, onComplete }) {
  const totalLinks    = config.links        ?? 4;
  const initTimeSec   = config.timeSec      ?? 12;
  const reductionSec  = config.reductionSec ?? 2;
  const margin        = config.margin       ?? 5;

  // phase: 'ready' | 'running' | 'frozen' | 'done'
  const [phase,        setPhase]        = useState('ready');
  const [currentLink,  setCurrentLink]  = useState(0);         // 0-indexed
  const [linkTarget,   setLinkTarget]   = useState(() => randomCents());
  const [linkTimeSec,  setLinkTimeSec]  = useState(initTimeSec);
  const [elapsed,      setElapsed]      = useState(0);
  const [history,      setHistory]      = useState([]);         // { cents, hit, aura }[]
  const [lastResult,   setLastResult]   = useState(null);       // { cents, hit, aura }
  const [auraFlash,    setAuraFlash]    = useState(false);

  const rafRef        = useRef(null);
  const rafStartRef   = useRef(0);
  const baseElapsed   = useRef(0);
  const linkTimeLimitRef = useRef(initTimeSec * 1000);
  const auraTriggered = useRef(false);
  const allPerfectRef = useRef(true);
  const phaseRef      = useRef('ready');

  // Keep phaseRef in sync
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // Cleanup on unmount
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // ── RAF helpers ─────────────────────────────────────────────────────────────
  const stopRAF = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    baseElapsed.current = baseElapsed.current + (performance.now() - rafStartRef.current);
  }, []);

  const startRAF = useCallback((timeLimitMs) => {
    baseElapsed.current = 0;
    rafStartRef.current = performance.now();
    const tick = () => {
      if (phaseRef.current !== 'running') return;
      const el = baseElapsed.current + (performance.now() - rafStartRef.current);
      if (el >= timeLimitMs) {
        baseElapsed.current = timeLimitMs;
        setElapsed(timeLimitMs);
        // Time ran out → fail
        setPhase('done');
        setTimeout(() => onComplete({ result: 'fail', auraTriggered: auraTriggered.current }), 800);
        return;
      }
      setElapsed(el);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [onComplete]);

  // ── Start first link ─────────────────────────────────────────────────────────
  const handleStart = () => {
    const target = randomCents();
    const timeMs = initTimeSec * 1000;
    linkTimeLimitRef.current = timeMs;
    setLinkTarget(target);
    setLinkTimeSec(initTimeSec);
    setCurrentLink(0);
    setElapsed(0);
    baseElapsed.current = 0;
    setPhase('running');
    phaseRef.current = 'running';
    startRAF(timeMs);
  };

  // ── PARAR ────────────────────────────────────────────────────────────────────
  const handleStop = () => {
    if (phaseRef.current !== 'running') return;
    stopRAF();

    const frozenMs = baseElapsed.current;
    const cents    = Math.floor((frozenMs % 1000) / 10);
    setElapsed(frozenMs);

    const absDiff = Math.abs(cents - linkTarget);
    const hit  = absDiff <= margin;
    const aura = cents === character?.auraNumber;
    if (aura) {
      auraTriggered.current = true;
      setAuraFlash(true);
      setTimeout(() => setAuraFlash(false), 2000);
    }

    const entry = { cents, hit, aura, target: linkTarget };
    setHistory(prev => [...prev, entry]);
    setLastResult(entry);
    setPhase('frozen');
    phaseRef.current = 'frozen';

    if (!hit) {
      // Miss → fail after feedback delay
      setTimeout(() => {
        setPhase('done');
        onComplete({ result: 'fail', auraTriggered: auraTriggered.current });
      }, 900);
      return;
    }

    if (absDiff > margin * 0.5) allPerfectRef.current = false;

    // Hit — check if last link
    const nextLink = currentLink + 1;
    if (nextLink >= totalLinks) {
      setTimeout(() => {
        setPhase('done');
        onComplete({ result: allPerfectRef.current ? 'perfect' : 'pass', auraTriggered: auraTriggered.current });
      }, 900);
      return;
    }

    // Advance to next link
    const auraBonusMs = aura ? 1000 : 0;
    const nextTimeSec = Math.max(2, linkTimeSec - reductionSec) + (aura ? 1 : 0);
    const nextTimeMs  = nextTimeSec * 1000 + auraBonusMs;

    setTimeout(() => {
      const nextTarget = randomCents();
      setCurrentLink(nextLink);
      setLinkTarget(nextTarget);
      setLinkTimeSec(nextTimeSec);
      setLastResult(null);
      linkTimeLimitRef.current = nextTimeMs;
      baseElapsed.current = 0;
      setElapsed(0);
      setPhase('running');
      phaseRef.current = 'running';
      startRAF(nextTimeMs);
    }, 850);
  };

  // ── Display values ────────────────────────────────────────────────────────────
  const currentCents = Math.floor((elapsed % 1000) / 10);
  const dispSecs     = Math.floor(elapsed / 1000);
  const dispCents    = String(currentCents).padStart(2, '0');
  const timeLeftMs   = Math.max(0, linkTimeLimitRef.current - elapsed);
  const timeLeftSec  = (timeLeftMs / 1000).toFixed(1);
  const timePct      = linkTimeLimitRef.current > 0
    ? Math.min(100, (elapsed / linkTimeLimitRef.current) * 100)
    : 0;

  const timerColor = phase === 'frozen' && lastResult
    ? lastResult.hit ? COLORS_GAME.verde : COLORS_GAME.rojo
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
          <motion.div key="aura-flash"
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              position:     'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)',
              background:   'rgba(255,215,0,0.12)', border: '1px solid #FFD700',
              borderRadius: BORDERS.radius.lg, padding: `${SPACING[2]} ${SPACING[5]}`,
              color:        '#FFD700', fontFamily: TYPOGRAPHY.fontFamily,
              fontWeight:   TYPOGRAPHY.weight.bold, fontSize: TYPOGRAPHY.size.md,
              zIndex:       300, whiteSpace: 'nowrap',
            }}>
            AURA — +1 segundo
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header: chain progress */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontFamily:   TYPOGRAPHY.fontFamily,
          fontSize:     TYPOGRAPHY.size.sm,
          fontWeight:   TYPOGRAPHY.weight.bold,
          color:        COLORS_UI.textSecondary,
          letterSpacing:'0.08em',
        }}>
          {phase === 'ready'
            ? `CADENA DE ${totalLinks} ESLABONES`
            : `Eslabón ${currentLink + 1} / ${totalLinks}`}
        </span>
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
            #{String(character.auraNumber).padStart(2, '0')} +1s
          </div>
        )}
      </div>

      {/* Link progress dots */}
      <div style={{ display: 'flex', gap: SPACING[2], justifyContent: 'center' }}>
        {Array.from({ length: totalLinks }, (_, i) => {
          const completed = history[i];
          const isCurrent = phase !== 'ready' && i === currentLink;
          return (
            <motion.div
              key={i}
              animate={isCurrent ? { scale: [1, 1.12, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.4 }}
              style={{
                width:        isCurrent ? '36px' : '28px',
                height:       isCurrent ? '36px' : '28px',
                borderRadius: BORDERS.radius.full,
                border:       completed
                  ? `2px solid ${completed.hit ? COLORS_GAME.verde : COLORS_GAME.rojo}`
                  : isCurrent
                    ? `2px solid ${COLORS_UI.text}`
                    : `1px solid ${COLORS_UI.border}`,
                background:   completed
                  ? completed.hit ? 'rgba(59,168,79,0.18)' : 'rgba(224,59,59,0.18)'
                  : isCurrent
                    ? COLORS_UI.bgElevated
                    : 'transparent',
                display:      'flex',
                alignItems:   'center',
                justifyContent:'center',
                fontFamily:   TYPOGRAPHY.fontFamilyMono,
                fontSize:     TYPOGRAPHY.size.xs,
                fontWeight:   TYPOGRAPHY.weight.bold,
                color:        completed
                  ? completed.hit ? COLORS_GAME.verde : COLORS_GAME.rojo
                  : isCurrent
                    ? COLORS_UI.text
                    : COLORS_UI.textMuted,
                transition:   'all 0.2s',
              }}
            >
              {completed
                ? completed.hit ? '✓' : '✗'
                : i + 1}
            </motion.div>
          );
        })}
      </div>

      {/* Current link target */}
      {phase !== 'ready' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily:   TYPOGRAPHY.fontFamilyMono,
            fontSize:     TYPOGRAPHY.size.xs,
            color:        COLORS_UI.textMuted,
            letterSpacing:'0.1em',
            marginBottom: SPACING[1],
          }}>
            OBJETIVO
          </div>
          <motion.div
            key={`target-${currentLink}`}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              fontFamily:  TYPOGRAPHY.fontFamilyMono,
              fontSize:    'clamp(52px, 14vw, 72px)',
              fontWeight:  TYPOGRAPHY.weight.black,
              color:       COLORS_UI.text,
              lineHeight:  1,
              letterSpacing: '0.02em',
            }}
          >
            .{String(linkTarget).padStart(2, '0')}
          </motion.div>
          <div style={{
            fontFamily:   TYPOGRAPHY.fontFamilyMono,
            fontSize:     TYPOGRAPHY.size.xs,
            color:        COLORS_UI.textMuted,
            marginTop:    SPACING[1],
          }}>
            margen ±{margin}
          </div>
        </div>
      )}

      {/* Countdown bar */}
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
                ? COLORS_GAME.rojo
                : COLORS_UI.textSecondary,
            }}>
              {timeLeftSec}s
            </span>
          </div>
          <div style={{
            height:       '8px',
            borderRadius: BORDERS.radius.full,
            background:   COLORS_UI.border,
            overflow:     'hidden',
          }}>
            <motion.div
              animate={{ width: `${100 - timePct}%` }}
              transition={{ duration: 0.05 }}
              style={{
                height:       '100%',
                borderRadius: BORDERS.radius.full,
                background:   Number(timeLeftSec) <= 3 ? COLORS_GAME.rojo : COLORS_GAME.verde,
                marginLeft:   'auto',
              }}
            />
          </div>
        </div>
      )}

      {/* Completed links history */}
      {history.length > 0 && (
        <div style={{ display: 'flex', gap: SPACING[2], flexWrap: 'wrap' }}>
          {history.map((h, i) => (
            <div key={i} style={{
              padding:      `${SPACING[1]} ${SPACING[3]}`,
              borderRadius: BORDERS.radius.md,
              background:   h.hit ? 'rgba(59,168,79,0.12)' : 'rgba(224,59,59,0.12)',
              border:       `1px solid ${h.hit ? 'rgba(59,168,79,0.35)' : 'rgba(224,59,59,0.35)'}`,
              fontFamily:   TYPOGRAPHY.fontFamilyMono,
              fontSize:     TYPOGRAPHY.size.xs,
              color:        h.hit ? COLORS_GAME.verde : COLORS_GAME.rojo,
              display:      'flex',
              alignItems:   'center',
              gap:          SPACING[1],
            }}>
              <span>{h.hit ? '✓' : '✗'}</span>
              <span>.{String(h.target).padStart(2, '0')}</span>
              {h.aura && <span style={{ color: '#FFD700' }}>★</span>}
            </div>
          ))}
        </div>
      )}

      {/* Big running timer */}
      {phase !== 'ready' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div
            animate={phase === 'frozen' && lastResult
              ? { scale: [1, 1.08, 1] }
              : {}}
            transition={{ duration: 0.3 }}
            style={{
              fontFamily:   TYPOGRAPHY.fontFamilyMono,
              fontSize:     'clamp(48px, 14vw, 72px)',
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

      {/* Feedback overlay */}
      <AnimatePresence>
        {phase === 'frozen' && lastResult && (
          <motion.div key="fb"
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ textAlign: 'center' }}
          >
            {lastResult.hit ? (
              <span style={{
                fontFamily: TYPOGRAPHY.fontFamily,
                fontSize:   TYPOGRAPHY.size.lg,
                fontWeight: TYPOGRAPHY.weight.bold,
                color:      COLORS_GAME.verde,
              }}>
                ACERTADO
              </span>
            ) : (
              <span style={{
                fontFamily: TYPOGRAPHY.fontFamily,
                fontSize:   TYPOGRAPHY.size.lg,
                fontWeight: TYPOGRAPHY.weight.bold,
                color:      COLORS_GAME.rojo,
              }}>
                FALLADO — .{String(lastResult.cents).padStart(2, '0')} vs .{String(lastResult.target).padStart(2, '0')}
              </span>
            )}
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
    </div>
  );
}
