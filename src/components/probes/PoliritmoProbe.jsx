/**
 * PoliritmoProbe — Polyrhythm
 * Two circles blink at different intervals. Tap when BOTH coincide (at LCM).
 * Must catch `required` coincidences within totalSec.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  COLORS_UI, COLORS_GAME,
  TYPOGRAPHY, SPACING, BORDERS,
} from '../../styles/tokens.js';
import { playPoliA, playPoliB, playPoliSync } from '../../engine/audio/audioEngine.js';

function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
function lcm(a, b) { return (a * b) / gcd(a, b); }

export default function PoliritmoProbe({ config, character, onComplete }) {
  const intervalA  = config.intervalA  ?? 800;
  const intervalB  = config.intervalB  ?? 1200;
  const totalSec   = config.totalSec   ?? 12;
  const required   = config.required   ?? 1;
  const baseMargin = config.marginMs   ?? 200;

  // Precompute all coincidence points (in ms from start)
  const lcmMs = lcm(intervalA, intervalB);
  const coincidenceTimes = useRef([]);
  const hitSet           = useRef(new Set());

  useEffect(() => {
    const pts = [];
    let t = lcmMs;
    while (t <= totalSec * 1000) {
      pts.push(t);
      t += lcmMs;
    }
    coincidenceTimes.current = pts;
  }, [lcmMs, totalSec]);

  const [phase,       setPhase]      = useState('ready');
  const [elapsed,     setElapsed]    = useState(0);
  const [litA,        setLitA]       = useState(false);
  const [litB,        setLitB]       = useState(false);
  const [hits,        setHits]       = useState(0);
  const [tapFeedback, setTapFeedback]= useState(null); // 'hit' | 'miss'
  const [auraFlash,   setAuraFlash]  = useState(false);
  const [marginMs,    setMarginMs]   = useState(baseMargin);

  const rafRef          = useRef(null);
  const startRef        = useRef(0);
  const marginRef       = useRef(baseMargin);
  const auraRef         = useRef(false);
  const hitsRef         = useRef(0);
  const perfectHitsRef  = useRef(0);
  const phaseRef        = useRef('ready');
  const prevLitARef     = useRef(false);
  const prevLitBRef     = useRef(false);

  useEffect(() => { marginRef.current = marginMs; }, [marginMs]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const startGame = () => {
    setPhase('running');
    phaseRef.current = 'running';
    hitSet.current         = new Set();
    hitsRef.current        = 0;
    perfectHitsRef.current = 0;
    prevLitARef.current    = false;
    prevLitBRef.current    = false;
    setHits(0);
    startRef.current = performance.now();

    const tick = () => {
      if (phaseRef.current !== 'running') return;
      const el = performance.now() - startRef.current;
      setElapsed(el);

      // Blink logic + rising-edge audio
      const newLitA = (el % intervalA) < 200;
      const newLitB = (el % intervalB) < 200;
      const riseA = newLitA && !prevLitARef.current;
      const riseB = newLitB && !prevLitBRef.current;
      if (riseA && riseB)      playPoliSync();
      else if (riseA)          playPoliA();
      else if (riseB)          playPoliB();
      prevLitARef.current = newLitA;
      prevLitBRef.current = newLitB;
      setLitA(newLitA);
      setLitB(newLitB);

      if (el >= totalSec * 1000) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        const passed = hitsRef.current >= required;
        const perfect = passed && perfectHitsRef.current >= required;
        setPhase('done');
        phaseRef.current = 'done';
        setTimeout(() => onComplete({
          result: perfect ? 'perfect' : passed ? 'pass' : 'fail',
          auraTriggered: auraRef.current,
        }), 800);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const handleTap = useCallback(() => {
    if (phaseRef.current !== 'running') return;

    const el    = performance.now() - startRef.current;
    const cents = Math.floor((el / 10) % 100);

    let effectiveMargin = marginRef.current;
    if (cents === character?.auraNumber && !auraRef.current) {
      auraRef.current = true;
      effectiveMargin *= 2;
      setMarginMs(m => m * 2);
      setAuraFlash(true);
      setTimeout(() => setAuraFlash(false), 2500);
    }

    // Check against all unhit coincidence points
    let hit = false;
    for (const pt of coincidenceTimes.current) {
      if (!hitSet.current.has(pt) && Math.abs(el - pt) <= effectiveMargin) {
        hitSet.current.add(pt);
        hit = true;
        if (Math.abs(el - pt) <= effectiveMargin * 0.5) perfectHitsRef.current++;
        const newHits = hitsRef.current + 1;
        hitsRef.current = newHits;
        setHits(newHits);

        if (newHits >= required) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
          const perfect = perfectHitsRef.current >= required;
          setPhase('done');
          phaseRef.current = 'done';
          setTimeout(() => onComplete({
            result: perfect ? 'perfect' : 'pass',
            auraTriggered: auraRef.current,
          }), 600);
        }
        break;
      }
    }

    setTapFeedback(hit ? 'hit' : 'miss');
    setTimeout(() => setTapFeedback(null), 400);
  }, [character, required]);

  const elapsedSec = (elapsed / 1000).toFixed(1);
  const timeLeft   = Math.max(0, totalSec - elapsed / 1000).toFixed(1);

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      padding: SPACING[4], gap: SPACING[4], userSelect: 'none',
    }}>

      {/* Aura flash */}
      <AnimatePresence>
        {auraFlash && (
          <motion.div key="aura"
            initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(255,215,0,0.12)', border: '1px solid #FFD700',
              borderRadius: BORDERS.radius.lg, padding: `${SPACING[2]} ${SPACING[5]}`,
              color: '#FFD700', fontFamily: TYPOGRAPHY.fontFamily,
              fontWeight: TYPOGRAPHY.weight.bold, fontSize: TYPOGRAPHY.size.md,
              zIndex: 300, whiteSpace: 'nowrap',
            }}>
            AURA #{String(character?.auraNumber ?? 0).padStart(2,'0')} — margen x2
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs,
          color: COLORS_UI.textMuted, letterSpacing: '0.08em',
        }}>
          POLIRITMO
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
        </div>
      </div>

      {/* Coincidence info */}
      {phase === 'ready' && (
        <div style={{
          background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`,
          borderRadius: BORDERS.radius.xl, padding: `${SPACING[3]} ${SPACING[4]}`,
          display: 'flex', flexDirection: 'column', gap: SPACING[2],
        }}>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textSecondary }}>
            Toca cuando AMBOS círculos brillen al mismo tiempo.
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
              A: cada {intervalA}ms — B: cada {intervalB}ms
            </span>
            <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: '#FFD700' }}>
              Coinciden cada {lcmMs}ms
            </span>
          </div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
            Necesitas {required} coincidencia{required !== 1 ? 's' : ''} — margen ±{marginMs}ms
          </div>
        </div>
      )}

      {/* Circles */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: SPACING[6],
      }}>
        {/* Circle A */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: SPACING[2] }}>
          <motion.div
            animate={litA ? { scale: 1.1 } : { scale: 1 }}
            transition={{ duration: 0.08 }}
            style={{
              width: 100, height: 100, borderRadius: BORDERS.radius.full,
              background: litA ? '#60A5FA' : `${COLORS_UI.bgElevated}`,
              border: `3px solid ${litA ? '#60A5FA' : COLORS_UI.border}`,
              boxShadow: litA ? '0 0 28px #60A5FA99, 0 0 50px #60A5FA44' : 'none',
              transition: 'background 0.05s, border-color 0.05s, box-shadow 0.05s',
            }}
          />
          <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
            A — {intervalA}ms
          </span>
        </div>

        {/* Tap feedback */}
        <AnimatePresence>
          {tapFeedback && (
            <motion.div
              key={tapFeedback + Date.now()}
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{ opacity: 0, y: -30, scale: 1.2 }}
              transition={{ duration: 0.4 }}
              style={{
                position: 'absolute',
                fontFamily: TYPOGRAPHY.fontFamilyMono,
                fontSize: TYPOGRAPHY.size.xl,
                fontWeight: TYPOGRAPHY.weight.black,
                color: tapFeedback === 'hit' ? COLORS_GAME.verde : COLORS_GAME.rojo,
                pointerEvents: 'none',
              }}>
              {tapFeedback === 'hit' ? '✓' : '✗'}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Circle B */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: SPACING[2] }}>
          <motion.div
            animate={litB ? { scale: 1.1 } : { scale: 1 }}
            transition={{ duration: 0.08 }}
            style={{
              width: 100, height: 100, borderRadius: BORDERS.radius.full,
              background: litB ? '#A78BFA' : `${COLORS_UI.bgElevated}`,
              border: `3px solid ${litB ? '#A78BFA' : COLORS_UI.border}`,
              boxShadow: litB ? '0 0 28px #A78BFA99, 0 0 50px #A78BFA44' : 'none',
              transition: 'background 0.05s, border-color 0.05s, box-shadow 0.05s',
            }}
          />
          <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
            B — {intervalB}ms
          </span>
        </div>
      </div>

      {/* Status bar */}
      {phase === 'running' && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`,
          borderRadius: BORDERS.radius.md, padding: `${SPACING[2]} ${SPACING[4]}`,
        }}>
          <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textMuted }}>
            Tiempo: {timeLeft}s
          </span>
          <span style={{
            fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.md,
            fontWeight: TYPOGRAPHY.weight.bold,
            color: hits >= required ? COLORS_GAME.verde : COLORS_UI.text,
          }}>
            {hits} / {required}
          </span>
        </div>
      )}

      {/* Time bar */}
      {phase === 'running' && (
        <div style={{
          height: '4px', borderRadius: BORDERS.radius.full,
          background: COLORS_UI.border, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: BORDERS.radius.full,
            background: COLORS_UI.textSecondary,
            width: `${Math.max(0, (1 - elapsed / (totalSec * 1000)) * 100)}%`,
            transition: 'width 0.05s linear',
          }} />
        </div>
      )}

      {/* Done */}
      {phase === 'done' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{
            textAlign: 'center',
            background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`,
            borderRadius: BORDERS.radius.xl, padding: `${SPACING[4]} ${SPACING[5]}`,
            display: 'flex', flexDirection: 'column', gap: SPACING[2],
          }}>
          <span style={{
            fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg,
            fontWeight: TYPOGRAPHY.weight.bold,
            color: hits >= required ? COLORS_GAME.verde : COLORS_GAME.rojo,
            letterSpacing: '0.1em',
          }}>
            {hits >= required ? '✓ RITMO DOMINADO' : '✗ SINCRONÍA PERDIDA'}
          </span>
          <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textSecondary }}>
            Coincidencias: {hits} / {required}
          </span>
        </motion.div>
      )}

      <div style={{ flex: 1 }} />

      {/* Buttons */}
      {phase === 'ready' && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={startGame}
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

      {phase === 'running' && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleTap}
          style={{
            width: '100%', minHeight: '88px',
            background: (litA && litB) ? '#FFD700' : COLORS_UI.bgElevated,
            border: `3px solid ${(litA && litB) ? '#FFD700' : COLORS_UI.border}`,
            borderRadius: BORDERS.radius.xl, fontFamily: TYPOGRAPHY.fontFamily,
            fontSize: 'clamp(22px, 6vw, 30px)', fontWeight: TYPOGRAPHY.weight.black,
            color: (litA && litB) ? '#000' : COLORS_UI.text,
            letterSpacing: '0.14em', cursor: 'pointer',
            boxShadow: (litA && litB) ? '0 6px 32px #FFD70080' : 'none',
            transition: 'background 0.08s, border-color 0.08s, color 0.08s, box-shadow 0.08s',
          }}>
          TOCA
        </motion.button>
      )}
    </div>
  );
}
