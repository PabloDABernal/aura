/**
 * SincroniaFaseProbe — Phase Sync
 * Rotating dot must be tapped when it passes the fixed target point on the circle.
 * N revolutions. Must hit `required` passes.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  COLORS_UI, COLORS_GAME,
  TYPOGRAPHY, SPACING, BORDERS,
} from '../../styles/tokens.js';

const RADIUS = 90; // px — distance from center to dot center

export default function SincroniaFaseProbe({ config, character, onComplete }) {
  const revolutions   = config.revolutions   ?? 3;
  const required      = config.required      ?? 1;
  const periodMs      = config.periodMs      ?? 3000;
  const baseMarginMs  = config.marginMs      ?? 150;
  const fixedAngleDeg = config.fixedAngleDeg ?? 90;

  // Convert marginMs to degrees
  const baseMargDeg = (baseMarginMs / periodMs) * 360;

  const [phase,       setPhase]       = useState('ready');
  const [angleDeg,    setAngleDeg]    = useState(0);
  const [revsDone,    setRevsDone]    = useState(0);
  const [hits,        setHits]        = useState(0);
  const [tapFeedback, setTapFeedback] = useState(null);
  const [auraFlash,   setAuraFlash]   = useState(false);
  const [marginDeg,   setMarginDeg]   = useState(baseMargDeg);

  const rafRef         = useRef(null);
  const startRef       = useRef(0);
  const prevRevRef     = useRef(0);  // integer revolutions completed so far
  const hitsRef        = useRef(0);
  const perfectHitsRef = useRef(0);
  const marginRef      = useRef(baseMargDeg);
  const auraRef        = useRef(false);
  const phaseRef       = useRef('ready');

  useEffect(() => { marginRef.current = marginDeg; }, [marginDeg]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const startGame = () => {
    setPhase('running');
    phaseRef.current = 'running';
    prevRevRef.current = 0;
    hitsRef.current = 0;
    setRevsDone(0);
    setHits(0);
    startRef.current = performance.now();

    const tick = () => {
      if (phaseRef.current !== 'running') return;
      const elapsed = performance.now() - startRef.current;
      const totalRevs = elapsed / periodMs;
      const angle = (totalRevs * 360) % 360;

      setAngleDeg(angle);

      const completedRevs = Math.floor(totalRevs);
      if (completedRevs !== prevRevRef.current) {
        prevRevRef.current = completedRevs;
        setRevsDone(completedRevs);

        if (completedRevs >= revolutions) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
          const enough = hitsRef.current >= required;
          const res = !enough ? 'fail' : perfectHitsRef.current >= required ? 'perfect' : 'pass';
          setPhase('done');
          phaseRef.current = 'done';
          setTimeout(() => onComplete({ result: res, auraTriggered: auraRef.current }), 800);
          return;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const handleTap = useCallback(() => {
    if (phaseRef.current !== 'running') return;

    const elapsed = performance.now() - startRef.current;
    const cents   = Math.floor((elapsed / 10) % 100);

    let effectiveMargDeg = marginRef.current;
    if (cents === character?.auraNumber && !auraRef.current) {
      auraRef.current = true;
      const addDeg = (50 / periodMs) * 360;
      effectiveMargDeg += addDeg;
      setMarginDeg(m => m + addDeg);
      setAuraFlash(true);
      setTimeout(() => setAuraFlash(false), 2500);
    }

    // Compute current angle
    const currentAngle = ((elapsed / periodMs) * 360) % 360;

    // Angular distance (shortest arc)
    let diff = Math.abs(currentAngle - fixedAngleDeg);
    if (diff > 180) diff = 360 - diff;

    const isHit = diff <= effectiveMargDeg;

    if (isHit) {
      const newHits = hitsRef.current + 1;
      hitsRef.current = newHits;
      if (diff <= effectiveMargDeg * 0.5) perfectHitsRef.current += 1;
      setHits(newHits);
      setTapFeedback('hit');

      if (newHits >= required) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        const res = perfectHitsRef.current >= required ? 'perfect' : 'pass';
        setPhase('done');
        phaseRef.current = 'done';
        setTimeout(() => onComplete({ result: res, auraTriggered: auraRef.current }), 600);
      }
    } else {
      setTapFeedback('miss');
    }

    setTimeout(() => setTapFeedback(null), 400);
  }, [character, fixedAngleDeg, required, periodMs]);

  // Dot position (circle center at 50%/50%, radius RADIUS)
  const angleRad = (angleDeg - 90) * (Math.PI / 180); // -90 so 0° is top
  const dotX = Math.cos(angleRad) * RADIUS;
  const dotY = Math.sin(angleRad) * RADIUS;

  // Fixed point position
  const fixedRad = (fixedAngleDeg - 90) * (Math.PI / 180);
  const fixedX = Math.cos(fixedRad) * RADIUS;
  const fixedY = Math.sin(fixedRad) * RADIUS;

  const CIRCLE_SIZE = RADIUS * 2 + 20; // px, for the container

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
            AURA #{String(character?.auraNumber ?? 0).padStart(2,'0')} — +50ms margen
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs,
          color: COLORS_UI.textMuted, letterSpacing: '0.08em',
        }}>
          SINCRONÍA DE FASE
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

      {/* Info */}
      {phase === 'ready' && (
        <div style={{
          background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`,
          borderRadius: BORDERS.radius.xl, padding: `${SPACING[3]} ${SPACING[4]}`,
          display: 'flex', flexDirection: 'column', gap: SPACING[1],
        }}>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textSecondary }}>
            Toca cuando el punto pase por el marcador amarillo.
          </div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
            {revolutions} rev. — {required} acierto{required !== 1 ? 's' : ''} — período {periodMs}ms — margen ±{baseMarginMs}ms
          </div>
        </div>
      )}

      {/* Circle arena */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: SPACING[4],
      }}>
        {/* Circle container */}
        <div style={{
          position: 'relative',
          width: CIRCLE_SIZE + 20, height: CIRCLE_SIZE + 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Track circle */}
          <div style={{
            width: CIRCLE_SIZE, height: CIRCLE_SIZE,
            borderRadius: BORDERS.radius.full,
            border: `2px solid ${COLORS_UI.border}`,
            position: 'absolute',
          }} />

          {/* Fixed target point (diamond) */}
          <div style={{
            position: 'absolute',
            left: '50%', top: '50%',
            transform: `translate(calc(-50% + ${fixedX}px), calc(-50% + ${fixedY}px)) rotate(45deg)`,
            width: 16, height: 16,
            background: '#FFD700',
            borderRadius: '3px',
            boxShadow: '0 0 12px #FFD700CC',
            zIndex: 2,
          }} />

          {/* Moving dot */}
          {phase !== 'ready' && (
            <div style={{
              position: 'absolute',
              left: '50%', top: '50%',
              transform: `translate(calc(-50% + ${dotX}px), calc(-50% + ${dotY}px))`,
              width: 18, height: 18,
              borderRadius: BORDERS.radius.full,
              background: '#60A5FA',
              boxShadow: '0 0 14px #60A5FACC',
              zIndex: 3,
            }} />
          )}

          {/* Tap feedback overlay */}
          <AnimatePresence>
            {tapFeedback && (
              <motion.div
                key={tapFeedback + Date.now()}
                initial={{ opacity: 1, scale: 1 }}
                animate={{ opacity: 0, scale: 1.5 }}
                transition={{ duration: 0.4 }}
                style={{
                  position: 'absolute',
                  fontFamily: TYPOGRAPHY.fontFamilyMono,
                  fontSize: TYPOGRAPHY.size['2xl'],
                  fontWeight: TYPOGRAPHY.weight.black,
                  color: tapFeedback === 'hit' ? COLORS_GAME.verde : COLORS_GAME.rojo,
                  pointerEvents: 'none', zIndex: 10,
                }}>
                {tapFeedback === 'hit' ? '✓' : '✗'}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Counters */}
        {(phase === 'running' || phase === 'done') && (
          <div style={{ display: 'flex', gap: SPACING[6], justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>VUELTAS</div>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.text }}>
                {Math.min(revsDone, revolutions)} / {revolutions}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>ACIERTOS</div>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.bold, color: hits >= required ? COLORS_GAME.verde : COLORS_UI.text }}>
                {hits} / {required}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Done result */}
      <AnimatePresence>
        {phase === 'done' && (
          <motion.div key="result"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{
              textAlign: 'center',
              background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`,
              borderRadius: BORDERS.radius.xl, padding: `${SPACING[3]} ${SPACING[5]}`,
            }}>
            <span style={{
              fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg,
              fontWeight: TYPOGRAPHY.weight.bold,
              color: hits >= required ? COLORS_GAME.verde : COLORS_GAME.rojo,
              letterSpacing: '0.1em',
            }}>
              {hits >= required ? '✓ EN FASE' : '✗ DESFASADO'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

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
            background: COLORS_GAME.rojo, border: 'none',
            borderRadius: BORDERS.radius.xl, fontFamily: TYPOGRAPHY.fontFamily,
            fontSize: 'clamp(22px, 6vw, 30px)', fontWeight: TYPOGRAPHY.weight.black,
            color: 'white', letterSpacing: '0.14em', cursor: 'pointer',
            boxShadow: `0 6px 32px ${COLORS_GAME.rojo}80`,
          }}>
          TOCA
        </motion.button>
      )}
    </div>
  );
}
