/**
 * PenduloProbe v2 — GDD v3.0 §4.3 Péndulo.
 * Pendulum 0↔swingDuration. N complete swings (dots). Manual PARAR/REANUDAR.
 * Target: random second S + auraNumber centésimas. Any pass counts.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  COLORS_UI, COLORS_GAME,
  TYPOGRAPHY, SPACING, BORDERS,
} from '../../styles/tokens.js';

export default function PenduloProbe({ config, character, onComplete }) {
  const cfgSwings       = config.swings        ?? 5;
  const cfgSwingDurMs   = Math.max(2, config.swingDuration ?? 3) * 1000;
  const cfgMargin       = config.margin        ?? 2;
  const cfgMaxStops     = config.maxStops      ?? null; // null = unlimited
  const cfgRequiredHits = config.requiredHits  ?? 1;
  const cfgShowAid      = config.showVisualAid ?? false;

  const auraNumber = character?.auraNumber ?? 0;

  // If aura=00, targets land at turn-arounds → easier → one fewer swing & exclude extremes
  const effectiveSwings = auraNumber === 0 ? Math.max(1, cfgSwings - 1) : cfgSwings;

  // Random target second (S.auraNumber)
  const [targetSec] = useState(() => {
    // Never pick the extremo superior (swingDuration), so [0, dur-1] for aura≠00, [1, dur-1] for aura=00
    const dur = Math.floor(cfgSwingDurMs / 1000);
    if (auraNumber === 0) {
      return 1 + Math.floor(Math.random() * Math.max(1, dur - 1));
    }
    return Math.floor(Math.random() * dur);
  });

  const [phase,         setPhase]        = useState('ready');
  const [pendulumMs,    setPendulumMs]   = useState(0);
  const [direction,     setDirection]    = useState(1);      // 1 = up, -1 = down
  const [halfSwings,    setHalfSwings]   = useState(0);      // half-swings completed
  const [hits,          setHits]         = useState(0);
  const [stopsLeft,     setStopsLeft]    = useState(cfgMaxStops ?? Infinity);
  const [feedbacks,     setFeedbacks]    = useState([]);
  const [feedKey,       setFeedKey]      = useState(0);
  const [shaking,       setShaking]      = useState(false);

  // Refs
  const rafRef        = useRef(null);
  const lastTimeRef   = useRef(0);
  const pendulumRef   = useRef(0);
  const directionRef  = useRef(1);
  const halfSwingsRef = useRef(0);
  const phaseRef      = useRef('ready');
  const hitsRef       = useRef(0);
  const perfectRef    = useRef(false);
  const stopsRef      = useRef(cfgMaxStops ?? Infinity);
  const auraHitRef    = useRef(false);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const endProbe = useCallback(() => {
    phaseRef.current = 'done';
    setPhase('done');
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    const enough = hitsRef.current >= cfgRequiredHits;
    let res = 'fail';
    if (enough) {
      res = perfectRef.current ? 'perfect' : 'pass';
    }
    setTimeout(() => onComplete({ result: res, auraTriggered: auraHitRef.current }), 750);
  }, [onComplete, cfgRequiredHits]);

  const startRAF = useCallback(() => {
    lastTimeRef.current = performance.now();
    const tick = (now) => {
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      let pMs  = pendulumRef.current + delta * directionRef.current;
      let dir  = directionRef.current;
      let hs   = halfSwingsRef.current;

      // Bounce handling (may happen multiple times for large deltas, but delta ≤ 16ms normally)
      if (pMs >= cfgSwingDurMs) {
        pMs = cfgSwingDurMs;
        dir = -1;
        hs += 1;
      } else if (pMs <= 0) {
        pMs = 0;
        dir = 1;
        hs += 1;
      }

      pendulumRef.current  = pMs;
      directionRef.current = dir;
      halfSwingsRef.current = hs;

      const completedSwings = Math.floor(hs / 2);

      setPendulumMs(pMs);
      setDirection(dir);
      setHalfSwings(hs);

      // End: all swings exhausted
      if (hs >= effectiveSwings * 2) {
        endProbe();
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [cfgSwingDurMs, effectiveSwings, cfgRequiredHits, endProbe]);

  const stopRAF = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    // lastTimeRef stays as-is; startRAF resets it
  }, []);

  const handleStart = () => {
    pendulumRef.current   = 0;
    directionRef.current  = 1;
    halfSwingsRef.current = 0;
    phaseRef.current = 'running';
    setPhase('running');
    setPendulumMs(0);
    setDirection(1);
    setHalfSwings(0);
    startRAF();
  };

  const handleResume = useCallback(() => {
    if (phaseRef.current !== 'frozen') return;
    setFeedbacks([]);
    phaseRef.current = 'running';
    setPhase('running');
    startRAF();
  }, [startRAF]);

  const handleStop = useCallback(() => {
    if (phaseRef.current !== 'running') return;
    stopRAF();
    phaseRef.current = 'frozen';
    setPhase('frozen');

    const frozenMs    = pendulumRef.current;
    const frozenSecs  = Math.floor(frozenMs / 1000);
    const frozenCents = Math.floor((frozenMs % 1000) / 10);

    const secMatch  = frozenSecs === targetSec;
    const centsDiff = Math.abs(frozenCents - auraNumber);
    const isHit     = secMatch && centsDiff <= cfgMargin;

    const newFb = [];

    if (isHit) {
      auraHitRef.current = true;
      hitsRef.current   += 1;
      if (centsDiff <= cfgMargin * 0.5) perfectRef.current = true;
      setHits(hitsRef.current);
      newFb.push({
        id:   'hit',
        text: `✓ ${targetSec}.${String(auraNumber).padStart(2,'0')} conseguido!`,
      });
    } else {
      setShaking(true);
      setTimeout(() => setShaking(false), 450);
      newFb.push({
        id:   'miss',
        text: `${frozenSecs}.${String(frozenCents).padStart(2,'0')}`,
      });
    }

    // Decrement stop counter if limited
    if (cfgMaxStops !== null) {
      stopsRef.current -= 1;
      setStopsLeft(stopsRef.current);
    }

    setFeedbacks(newFb);
    setFeedKey(k => k + 1);

    if (hitsRef.current >= cfgRequiredHits)            { endProbe(); return; }
    if (cfgMaxStops !== null && stopsRef.current <= 0) { endProbe(); return; }
    // NO auto-resume
  }, [targetSec, auraNumber, cfgMargin, cfgMaxStops, stopRAF, endProbe]);

  // ── Display ──────────────────────────────────────────────────────────────────
  const dispSecs     = Math.floor(pendulumMs / 1000);
  const dispCents    = Math.floor((pendulumMs % 1000) / 10);
  const dispStr      = `${dispSecs}.${String(dispCents).padStart(2,'0')}`;
  const barPct       = (pendulumMs / cfgSwingDurMs) * 100;
  const completedSwings = Math.floor(halfSwings / 2);
  const targetPct    = ((targetSec * 1000 + auraNumber * 10) / cfgSwingDurMs) * 100;

  const isRunning    = phase === 'running';
  const isFrozen     = phase === 'frozen';
  const targetFull   = `${targetSec}.${String(auraNumber).padStart(2,'0')}`;
  const rangeLo      = `${targetSec}.${String(Math.max(0, auraNumber - cfgMargin)).padStart(2,'0')}`;
  const rangeHi      = `${targetSec}.${String(Math.min(99, auraNumber + cfgMargin)).padStart(2,'0')}`;

  const timerColor = phase === 'done'
    ? (hitsRef.current >= cfgRequiredHits ? COLORS_GAME.verde : COLORS_GAME.rojo)
    : isFrozen ? '#60A5FA' : COLORS_UI.text;

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      padding: SPACING[4], gap: SPACING[3], userSelect: 'none',
    }}>

      {/* Objetivo */}
      <div style={{
        background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`,
        borderRadius: BORDERS.radius.xl, padding: `${SPACING[3]} ${SPACING[5]}`, textAlign: 'center',
      }}>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textMuted, letterSpacing: '0.1em', marginBottom: SPACING[1] }}>
          PARA EN
        </div>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size['2xl'], fontWeight: TYPOGRAPHY.weight.black, color: '#FFD700', letterSpacing: '0.04em' }}>
          {targetFull}
        </div>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, marginTop: SPACING[1] }}>
          ({rangeLo}–{rangeHi})
        </div>
      </div>

      {/* Dots — vueltas restantes */}
      {phase !== 'ready' && (
        <div style={{ display: 'flex', gap: SPACING[2], justifyContent: 'center', alignItems: 'center' }}>
          {Array.from({ length: effectiveSwings }).map((_, i) => (
            <motion.div
              key={i}
              animate={{ scale: i === completedSwings ? [1, 1.4, 1] : 1 }}
              transition={{ duration: 0.25 }}
              style={{
                width:        '12px',
                height:       '12px',
                borderRadius: BORDERS.radius.full,
                background:   i < completedSwings ? COLORS_UI.textMuted : COLORS_UI.border,
                border:       `1px solid ${COLORS_UI.border}`,
                transition:   'background 0.2s',
              }}
            />
          ))}
        </div>
      )}

      {/* Flecha dirección + timer grande */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: SPACING[2] }}>
        {phase !== 'ready' && (
          <motion.div
            key={`dir-${direction}`}
            initial={{ opacity: 0.3, y: direction === 1 ? 6 : -6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xl, color: COLORS_UI.textSecondary, lineHeight: 1 }}
          >
            {direction === 1 ? '↑' : '↓'}
          </motion.div>
        )}

        <motion.div
          animate={phase === 'done' ? { scale: [1, 1.08, 1] } : {}}
          transition={{ duration: 0.35 }}
          style={{
            fontFamily:    TYPOGRAPHY.fontFamilyMono,
            fontSize:      'clamp(60px, 17vw, 90px)',
            fontWeight:    TYPOGRAPHY.weight.black,
            color:         timerColor,
            letterSpacing: '0.02em',
            lineHeight:    1,
            transition:    'color 0.15s',
          }}
        >
          {phase === 'ready' ? '0.00' : dispStr}
        </motion.div>

        {/* Hits counter */}
        {phase !== 'ready' && cfgRequiredHits > 1 && (
          <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.sm, color: hits > 0 ? '#FFD700' : COLORS_UI.textMuted }}>
            {hits}/{cfgRequiredHits} aciertos
          </span>
        )}

        {/* Max stops counter */}
        {phase !== 'ready' && cfgMaxStops !== null && (
          <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.sm, color: stopsLeft <= 2 ? '#E03B3B' : COLORS_UI.textMuted }}>
            ⚡ {stopsLeft} paradas
          </span>
        )}
      </div>

      {/* Feedbacks */}
      <AnimatePresence>
        {feedbacks.map((fb, idx) => (
          <motion.div
            key={`${feedKey}-${fb.id}`}
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -40 }}
            exit={{}}
            transition={{ duration: 0.85, delay: idx * 0.05 }}
            style={{
              position:      'fixed',
              top:           '40%',
              left:          '50%',
              transform:     'translateX(-50%)',
              fontFamily:    TYPOGRAPHY.fontFamily,
              fontSize:      fb.id === 'hit' ? TYPOGRAPHY.size.lg : TYPOGRAPHY.size.sm,
              fontWeight:    TYPOGRAPHY.weight.bold,
              color:         fb.id === 'hit' ? '#FFD700' : COLORS_UI.textMuted,
              textShadow:    fb.id === 'hit' ? '0 0 16px #FFD70099' : 'none',
              whiteSpace:    'nowrap',
              pointerEvents: 'none',
              zIndex:        50,
            }}
          >
            {fb.text}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Barra péndulo */}
      <div>
        <div style={{
          position: 'relative', height: '8px',
          borderRadius: BORDERS.radius.full,
          background: COLORS_UI.border, overflow: 'visible',
          marginBottom: SPACING[1],
        }}>
          {/* Visual aid: margin zone */}
          {cfgShowAid && (
            <div style={{
              position:    'absolute',
              left:        `${Math.max(0, targetPct - (cfgMargin / 100 / (cfgSwingDurMs / 1000)) * 100)}%`,
              width:       `${(cfgMargin * 2 / 100 / (cfgSwingDurMs / 1000)) * 100}%`,
              top:         '-4px',
              height:      '16px',
              background:  'rgba(255,215,0,0.2)',
              borderRadius: BORDERS.radius.full,
            }} />
          )}

          {/* Progress thumb */}
          {phase !== 'ready' && (
            <div style={{
              position:     'absolute',
              top:          0,
              left:         0,
              height:       '100%',
              width:        `${barPct}%`,
              borderRadius: BORDERS.radius.full,
              background:   phase === 'done'
                ? (hitsRef.current >= cfgRequiredHits ? COLORS_GAME.verde : COLORS_GAME.rojo)
                : isFrozen ? '#60A5FA' : COLORS_GAME.verde,
              transition:   'background 0.15s',
            }} />
          )}

          {/* Target marker — visual aid only */}
          {cfgShowAid && (
            <div style={{
              position:     'absolute',
              top:          '-4px',
              left:         `${targetPct}%`,
              transform:    'translateX(-50%)',
              width:        '3px',
              height:       '16px',
              background:   '#FFD700',
              borderRadius: BORDERS.radius.full,
            }} />
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '8px', color: COLORS_UI.textMuted }}>
          <span>0</span>
          <span>{Math.floor(cfgSwingDurMs / 1000)}</span>
        </div>
      </div>

      {/* EMPEZAR */}
      {phase === 'ready' && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleStart}
          style={{
            width: '100%', minHeight: '72px', background: COLORS_GAME.verde,
            border: 'none', borderRadius: BORDERS.radius.xl,
            fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl,
            fontWeight: TYPOGRAPHY.weight.black, color: 'white',
            letterSpacing: '0.12em', cursor: 'pointer',
            boxShadow: `0 6px 28px ${COLORS_GAME.verde}60`,
          }}
        >
          EMPEZAR
        </motion.button>
      )}

      {/* PARAR / REANUDAR */}
      {(isRunning || isFrozen) && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={isRunning ? handleStop : handleResume}
          style={{
            width:         '100%',
            minHeight:     '80px',
            background:    isFrozen ? 'rgba(96,165,250,0.15)' : COLORS_GAME.rojo,
            border:        isFrozen ? '2px solid #60A5FA' : 'none',
            borderRadius:  BORDERS.radius.xl,
            fontFamily:    TYPOGRAPHY.fontFamily,
            fontSize:      'clamp(20px, 6vw, 30px)',
            fontWeight:    TYPOGRAPHY.weight.black,
            color:         isFrozen ? '#60A5FA' : 'white',
            letterSpacing: '0.14em',
            cursor:        'pointer',
            boxShadow:     isFrozen ? 'none' : `0 6px 32px ${COLORS_GAME.rojo}80`,
            transition:    'background 0.2s, border-color 0.2s, color 0.2s, box-shadow 0.2s',
          }}
        >
          {isRunning ? 'PARAR' : 'REANUDAR'}
        </motion.button>
      )}
    </div>
  );
}
