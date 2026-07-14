/**
 * EcoVisualProbe — Visual Echo
 * N circles flash in a sequence. Player observes cycleMostra times, then reproduces
 * the sequence by tapping circles in order at the same tempo.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  COLORS_UI, COLORS_GAME,
  TYPOGRAPHY, SPACING, BORDERS,
} from '../../styles/tokens.js';

const LIGHT_COLORS = ['#60A5FA', '#A78BFA', '#F59E0B', '#EC4899', '#34D399'];

function buildSequence(n) {
  // Sequence is always 0,1,2,...,n-1 in order (one pass)
  return Array.from({ length: n }, (_, i) => i);
}

export default function EcoVisualProbe({ config, character, onComplete }) {
  const n          = config.lights    ?? 3;
  const cycleMostra= config.cycleMostra ?? 2;
  const intervalMs = config.intervalMs ?? 1000;
  const baseMarginMs = config.marginMs ?? 200;

  const [phase,        setPhase]       = useState('ready');
  const [litIndex,     setLitIndex]    = useState(-1);    // which circle is lit during show
  const [activeTap,    setActiveTap]   = useState(-1);    // flash on tap
  const [tapResults,   setTapResults]  = useState([]);    // per-step: true/false
  const [nextExpected, setNextExpected]= useState(0);     // index in sequence player must tap next
  const [auraSteps,    setAuraSteps]   = useState(new Set()); // step indices with aura
  const [finalResult,  setFinalResult] = useState(null);

  const sequence     = useRef(buildSequence(n));
  const showTimers   = useRef([]);
  const tapTimesRef  = useRef([]);   // wall-clock ms of each tap
  const firstTapRef  = useRef(null);
  const expectedIntervalsRef = useRef([]); // intervalMs * stepIndex from first tap
  const auraRef      = useRef(false);
  const marginRef    = useRef(baseMarginMs);
  const phaseRef     = useRef('ready');
  const nextRef      = useRef(0);

  useEffect(() => { phaseRef.current = phase; }, [phase]);

  useEffect(() => () => {
    showTimers.current.forEach(t => clearTimeout(t));
  }, []);

  // Build expected intervals (each tap at intervalMs * i from first tap)
  useEffect(() => {
    expectedIntervalsRef.current = sequence.current.map((_, i) => i * intervalMs);
  }, [intervalMs]);

  const startShowing = () => {
    setPhase('showing');
    phaseRef.current = 'showing';
    setLitIndex(-1);

    const seq = sequence.current;
    const totalSteps = seq.length * cycleMostra;
    const onDuration = 300;
    const offGap     = 100;
    const cyclePause = 500;

    // Build schedule of blink events
    let t = 200; // initial delay
    for (let c = 0; c < cycleMostra; c++) {
      for (let i = 0; i < seq.length; i++) {
        const idx = seq[i];
        const on  = t;
        const off = t + onDuration;
        showTimers.current.push(setTimeout(() => setLitIndex(idx), on));
        showTimers.current.push(setTimeout(() => setLitIndex(-1), off));
        t += onDuration + offGap;
      }
      if (c < cycleMostra - 1) t += cyclePause;
    }

    // After all cycles: move to 'waiting'
    showTimers.current.push(setTimeout(() => {
      setLitIndex(-1);
      setPhase('waiting');
      phaseRef.current = 'waiting';
      showTimers.current.push(setTimeout(() => {
        setPhase('reproducing');
        phaseRef.current = 'reproducing';
        nextRef.current = 0;
        setNextExpected(0);
        tapTimesRef.current = [];
        firstTapRef.current = null;
      }, 1000));
    }, t));
  };

  const handleCircleTap = useCallback((circleIndex) => {
    if (phaseRef.current !== 'reproducing') return;

    const now = performance.now();
    const step = nextRef.current;
    const seq  = sequence.current;

    if (step >= seq.length) return;

    // Record tap time
    if (firstTapRef.current === null) {
      firstTapRef.current = now;
      tapTimesRef.current.push(0);
    } else {
      tapTimesRef.current.push(now - firstTapRef.current);
    }

    // Flash the tapped circle
    setActiveTap(circleIndex);
    setTimeout(() => setActiveTap(-1), 200);

    // Check correct circle
    const expectedCircle = seq[step];
    const correctCircle  = circleIndex === expectedCircle;

    // Check timing (skip for first tap — it defines the baseline)
    let timingOk = true;
    if (step > 0) {
      const actualInterval   = tapTimesRef.current[step];
      const expectedInterval = expectedIntervalsRef.current[step];
      const cents = Math.floor((now / 10) % 100); // centésimas of performance.now()

      let effectiveMargin = marginRef.current;
      if (cents === character?.auraNumber && !auraRef.current) {
        auraRef.current = true;
        effectiveMargin += 100;
        setAuraSteps(prev => new Set([...prev, step]));
      }
      timingOk = Math.abs(actualInterval - expectedInterval) <= effectiveMargin;
    }

    const stepPass = correctCircle && timingOk;
    const newResults = [...tapTimesRef.current.slice(0, step).map((_, i) => i < step - 1 ? null : null), stepPass];
    setTapResults(prev => {
      const updated = [...prev, stepPass];
      return updated;
    });

    const newStep = step + 1;
    nextRef.current = newStep;
    setNextExpected(newStep);

    if (newStep >= seq.length) {
      // All tapped — evaluate
      setTimeout(() => {
        setTapResults(prev => {
          const allPass = prev.every(Boolean);
          setFinalResult(allPass);
          setPhase('done');
          phaseRef.current = 'done';
          setTimeout(() => onComplete({
            result: allPass ? 'pass' : 'fail',
            auraTriggered: auraRef.current,
          }), 800);
          return prev;
        });
      }, 300);
    }
  }, [character, intervalMs]);

  const seq = sequence.current;

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      padding: SPACING[4], gap: SPACING[4], userSelect: 'none',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs,
          color: COLORS_UI.textMuted, letterSpacing: '0.08em',
        }}>
          ECO VISUAL
        </span>
        <div style={{ display: 'flex', gap: SPACING[2], alignItems: 'center' }}>
          {character?.auraNumber != null && (
            <div style={{
              padding: `1px ${SPACING[2]}`, background: 'rgba(255,215,0,0.08)',
              border: '1px solid rgba(255,215,0,0.3)', borderRadius: BORDERS.radius.full,
              fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '10px', color: '#FFD700',
            }}>
              ✨ #{String(character.auraNumber).padStart(2,'0')}
            </div>
          )}
          <span style={{
            fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs,
            color: COLORS_UI.textMuted,
          }}>
            {n} luces — ±{baseMarginMs}ms
          </span>
        </div>
      </div>

      {/* Status text */}
      <div style={{ textAlign: 'center', minHeight: 28 }}>
        {phase === 'ready' && (
          <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textSecondary }}>
            Observa la secuencia {cycleMostra} vez{cycleMostra !== 1 ? 'ces' : ''}, luego reprodúcela.
          </span>
        )}
        {phase === 'showing' && (
          <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.bold, color: '#FFD700' }}>
            Observa...
          </span>
        )}
        {phase === 'waiting' && (
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_GAME.verde }}>
            ¡Ahora tú!
          </motion.span>
        )}
        {phase === 'reproducing' && (
          <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textSecondary }}>
            Paso {nextExpected + 1} / {seq.length}
          </span>
        )}
        {phase === 'done' && (
          <span style={{
            fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg,
            fontWeight: TYPOGRAPHY.weight.bold,
            color: finalResult ? COLORS_GAME.verde : COLORS_GAME.rojo,
            letterSpacing: '0.1em',
          }}>
            {finalResult ? '✓ SINCRONÍA PERFECTA' : '✗ RITMO ROTO'}
          </span>
        )}
      </div>

      {/* Circles */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: SPACING[4], flexWrap: 'wrap',
      }}>
        {seq.map((circleIdx, stepPos) => {
          const color = LIGHT_COLORS[circleIdx % LIGHT_COLORS.length];
          const isLit = litIndex === circleIdx;
          const isTapped = activeTap === circleIdx;
          const isDone = phase === 'done';
          const stepResult = tapResults[stepPos];

          // In done phase, color by result
          let bgColor = COLORS_UI.bgCard;
          let borderColor = COLORS_UI.border;
          let glow = 'none';

          if (isLit || isTapped) {
            bgColor = color;
            borderColor = color;
            glow = `0 0 20px ${color}CC, 0 0 40px ${color}66`;
          } else if (isDone && stepResult != null) {
            bgColor = stepResult ? `${COLORS_GAME.verde}33` : `${COLORS_GAME.rojo}33`;
            borderColor = stepResult ? COLORS_GAME.verde : COLORS_GAME.rojo;
          }

          const canTap = phase === 'reproducing' && stepPos === nextExpected;

          return (
            <motion.div
              key={circleIdx}
              whileTap={canTap ? { scale: 0.9 } : {}}
              onClick={() => handleCircleTap(circleIdx)}
              style={{
                width: 72, height: 72,
                borderRadius: BORDERS.radius.full,
                background: bgColor,
                border: `3px solid ${borderColor}`,
                boxShadow: glow,
                cursor: canTap ? 'pointer' : (phase === 'reproducing' ? 'default' : 'default'),
                transition: 'background 0.1s, border-color 0.1s, box-shadow 0.1s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              {isDone && stepResult != null && (
                <span style={{ fontSize: 20, lineHeight: 1 }}>
                  {stepResult ? '✓' : '✗'}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Tap result dots (during reproducing) */}
      {phase === 'reproducing' && tapResults.length > 0 && (
        <div style={{ display: 'flex', gap: SPACING[2], justifyContent: 'center' }}>
          {tapResults.map((r, i) => (
            <div key={i} style={{
              width: 10, height: 10, borderRadius: BORDERS.radius.full,
              background: r ? COLORS_GAME.verde : COLORS_GAME.rojo,
            }} />
          ))}
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Buttons */}
      {phase === 'ready' && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={startShowing}
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
    </div>
  );
}
