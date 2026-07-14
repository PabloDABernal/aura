/**
 * CadenciaFantasmaProbe — Ghost Cadence
 * Invisible dot travels LEFT→RIGHT in travelSec seconds.
 * Player taps when they think it arrives at the end marker.
 * Dot flashes at actual position for 1s after tap.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  COLORS_UI, COLORS_GAME,
  TYPOGRAPHY, SPACING, BORDERS,
} from '../../styles/tokens.js';

export default function CadenciaFantasmaProbe({ config, character, onComplete }) {
  const travelSec = config.travelSec ?? 4;
  const baseMargin = config.margin   ?? 0.25;
  const trailSec  = config.trailSec  ?? 0;

  const [phase,        setPhase]       = useState('ready');
  const [elapsed,      setElapsed]     = useState(0);
  const [tapTime,      setTapTime]     = useState(null);
  const [dotPct,       setDotPct]      = useState(0);       // 0–1 where dot really is
  const [showDot,      setShowDot]     = useState(false);
  const [auraFlash,    setAuraFlash]   = useState(false);
  const [margin,       setMargin]      = useState(baseMargin);
  const [result,       setResult]      = useState(null);

  const rafRef      = useRef(null);
  const startRef    = useRef(0);
  const marginRef   = useRef(baseMargin);
  const auraRef     = useRef(false);
  const phaseRef    = useRef('ready');
  const tappedRef   = useRef(false);

  useEffect(() => { marginRef.current = margin; }, [margin]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const startJourney = () => {
    setPhase('traveling');
    phaseRef.current = 'traveling';
    tappedRef.current = false;
    startRef.current = performance.now();

    const tick = () => {
      const el = (performance.now() - startRef.current) / 1000;
      setElapsed(el);
      if (phaseRef.current === 'traveling') {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const handleTap = useCallback(() => {
    if (phaseRef.current !== 'traveling' || tappedRef.current) return;
    tappedRef.current = true;

    cancelAnimationFrame(rafRef.current);
    rafRef.current = null;

    const tap = (performance.now() - startRef.current) / 1000;
    const actualPct = Math.min(1, tap / travelSec);
    const cents = Math.floor((tap % 1) * 100);

    // Aura check
    let effectiveMargin = marginRef.current;
    if (cents === character?.auraNumber && !auraRef.current) {
      auraRef.current = true;
      effectiveMargin += 0.10;
      setMargin(m => m + 0.10);
      setAuraFlash(true);
      setTimeout(() => setAuraFlash(false), 2500);
    }

    const error = Math.abs(tap - travelSec);
    const pass  = error <= effectiveMargin;

    setTapTime(tap);
    setDotPct(actualPct);
    setShowDot(true);
    setElapsed(tap);
    setPhase('tapped');
    phaseRef.current = 'tapped';

    const perfect = pass && error <= effectiveMargin * 0.5;
    const finalResult = perfect ? 'perfect' : pass ? 'pass' : 'fail';
    setTimeout(() => {
      setShowDot(false);
      setResult({ tap, error, pass });
      setPhase('result');
      phaseRef.current = 'result';
      setTimeout(() => onComplete({
        result: finalResult,
        auraTriggered: auraRef.current,
      }), 800);
    }, 1000);
  }, [travelSec, character]);

  const dispSec  = elapsed.toFixed(2);
  const TRACK_H  = 56;

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
            AURA #{String(character?.auraNumber ?? 0).padStart(2,'0')} — +0.10s margen
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs,
          color: COLORS_UI.textMuted, letterSpacing: '0.08em',
        }}>
          CADENCIA FANTASMA
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
            {travelSec}s — ±{margin.toFixed(2)}s
          </span>
        </div>
      </div>

      {/* Instruction / ready */}
      {phase === 'ready' && (
        <div style={{
          background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`,
          borderRadius: BORDERS.radius.xl, padding: `${SPACING[4]} ${SPACING[5]}`,
          textAlign: 'center', display: 'flex', flexDirection: 'column', gap: SPACING[2],
        }}>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.text }}>
            El punto viaja invisible
          </div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textSecondary }}>
            Toca cuando creas que llegó al marcador derecho.
          </div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
            Duración: {travelSec}s — margen: ±{margin.toFixed(2)}s
          </div>
        </div>
      )}

      {/* Track */}
      {(phase === 'traveling' || phase === 'tapped' || phase === 'result') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
          {/* Elapsed label */}
          <div style={{
            fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.sm,
            color: COLORS_UI.textSecondary, textAlign: 'center',
          }}>
            {dispSec}s / {travelSec}s
          </div>

          {/* Track bar */}
          <div style={{
            position: 'relative', width: '100%', height: `${TRACK_H}px`,
            background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`,
            borderRadius: BORDERS.radius.lg, overflow: 'visible',
          }}>
            {/* START marker */}
            <div style={{
              position: 'absolute', left: 0, top: '50%', transform: 'translate(-50%, -50%)',
              width: 20, height: 20, borderRadius: BORDERS.radius.full,
              background: COLORS_GAME.verde,
              boxShadow: `0 0 12px ${COLORS_GAME.verde}99`,
              zIndex: 2,
            }} />

            {/* END marker */}
            <div style={{
              position: 'absolute', right: 0, top: '50%', transform: 'translate(50%, -50%)',
              width: 20, height: 20, borderRadius: BORDERS.radius.full,
              background: '#FFD700',
              boxShadow: '0 0 12px #FFD70099',
              zIndex: 2,
            }} />

            {/* Ghost dot — only shown after tap */}
            {showDot && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'absolute',
                  left: `calc(${dotPct * 100}%)`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 14, height: 14, borderRadius: BORDERS.radius.full,
                  background: COLORS_GAME.rojo,
                  boxShadow: `0 0 10px ${COLORS_GAME.rojo}CC`,
                  zIndex: 3,
                }}
              />
            )}
          </div>

          {/* Labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_GAME.verde }}>
              START
            </span>
            <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: '#FFD700' }}>
              END
            </span>
          </div>
        </div>
      )}

      {/* Result */}
      <AnimatePresence>
        {phase === 'result' && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{
              background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`,
              borderRadius: BORDERS.radius.xl, padding: `${SPACING[4]} ${SPACING[5]}`,
              textAlign: 'center', display: 'flex', flexDirection: 'column', gap: SPACING[2],
            }}>
            <span style={{
              fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg,
              fontWeight: TYPOGRAPHY.weight.bold,
              color: result.pass ? COLORS_GAME.verde : COLORS_GAME.rojo,
              letterSpacing: '0.1em',
            }}>
              {result.pass ? '✓ SINCRONÍA' : '✗ DESINCRONIZADO'}
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>OBJETIVO</div>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.bold, color: '#FFD700' }}>{travelSec.toFixed(2)}s</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>TU TOQUE</div>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.bold, color: result.pass ? COLORS_GAME.verde : COLORS_GAME.rojo }}>{result.tap.toFixed(2)}s</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>ERROR</div>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.textSecondary }}>{result.error.toFixed(2)}s</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ flex: 1 }} />

      {/* Buttons */}
      {phase === 'ready' && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={startJourney}
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

      {(phase === 'traveling') && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleTap}
          style={{
            width: '100%', minHeight: '88px',
            background: COLORS_GAME.rojo, border: 'none',
            borderRadius: BORDERS.radius.xl, fontFamily: TYPOGRAPHY.fontFamily,
            fontSize: 'clamp(24px, 6vw, 34px)', fontWeight: TYPOGRAPHY.weight.black,
            color: 'white', letterSpacing: '0.14em', cursor: 'pointer',
            boxShadow: `0 6px 32px ${COLORS_GAME.rojo}80`,
          }}>
          TOCA
        </motion.button>
      )}
    </div>
  );
}
