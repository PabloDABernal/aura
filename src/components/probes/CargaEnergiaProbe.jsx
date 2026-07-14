/**
 * CargaEnergiaProbe — Energy Charge
 * Player HOLDS a button and releases when targetSec seconds have elapsed.
 * Progress bar is deceptive (log / oscillate / linear).
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  COLORS_UI, COLORS_GAME,
  TYPOGRAPHY, SPACING, BORDERS,
} from '../../styles/tokens.js';

function computeBarPct(elapsed, targetSec, barCurve) {
  if (barCurve === 'log') {
    return Math.min(100, Math.log(1 + (elapsed / targetSec) * (Math.E - 1)) / Math.log(Math.E) * 100);
  }
  if (barCurve === 'oscillate') {
    return Math.min(100, Math.max(0, (elapsed / targetSec * 100) + Math.sin(elapsed / 300) * 15));
  }
  // linear
  return Math.min(100, (elapsed / targetSec) * 100);
}

export default function CargaEnergiaProbe({ config, character, onComplete }) {
  const targetSec  = config.targetSec ?? 5;
  const baseMargin = config.margin    ?? 0.30;
  const barCurve   = config.barCurve  ?? 'log';

  const [phase,      setPhase]     = useState('ready');
  const [barPct,     setBarPct]    = useState(0);
  const [holding,    setHolding]   = useState(false);
  const [result,     setResult]    = useState(null);
  const [auraFlash,  setAuraFlash] = useState(false);
  const [margin,     setMargin]    = useState(baseMargin);

  const rafRef      = useRef(null);
  const holdStart   = useRef(0);
  const marginRef   = useRef(baseMargin);
  const auraRef     = useRef(false);
  const holdingRef  = useRef(false);
  const phaseRef    = useRef('ready');

  useEffect(() => { marginRef.current = margin; }, [margin]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const startHold = useCallback((e) => {
    e.preventDefault();
    if (phaseRef.current !== 'holding' && phaseRef.current !== 'ready') return;
    if (holdingRef.current) return;

    holdingRef.current = true;
    setHolding(true);
    setPhase('holding');
    phaseRef.current = 'holding';
    holdStart.current = performance.now();

    const tick = () => {
      if (!holdingRef.current) return;
      const elapsed = performance.now() - holdStart.current;
      const pct = computeBarPct(elapsed, targetSec * 1000, barCurve);
      setBarPct(pct);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [targetSec, barCurve]);

  const endHold = useCallback((e) => {
    e.preventDefault();
    if (!holdingRef.current) return;
    holdingRef.current = false;
    setHolding(false);

    cancelAnimationFrame(rafRef.current);
    rafRef.current = null;

    const elapsed = (performance.now() - holdStart.current) / 1000;
    const cents   = Math.floor((elapsed % 1) * 100);

    let effectiveMargin = marginRef.current;
    if (cents === character?.auraNumber && !auraRef.current) {
      auraRef.current = true;
      effectiveMargin += 0.10;
      setMargin(m => m + 0.10);
      setAuraFlash(true);
      setTimeout(() => setAuraFlash(false), 2500);
    }

    const error   = Math.abs(elapsed - targetSec);
    const pass    = error <= effectiveMargin;
    const perfect = pass && error <= effectiveMargin * 0.5;
    const finalResult = perfect ? 'perfect' : pass ? 'pass' : 'fail';

    setResult({ elapsed, error, pass });
    setPhase('result');
    phaseRef.current = 'result';

    setTimeout(() => onComplete({
      result: finalResult,
      auraTriggered: auraRef.current,
    }), 900);
  }, [targetSec, character]);

  // bar color: shifts green → yellow → red as pct grows
  const barColor = barPct < 50
    ? COLORS_GAME.verde
    : barPct < 80
      ? '#E0C03B'
      : COLORS_GAME.rojo;

  const curveLabel = { log: 'Logarítmica', oscillate: 'Oscilante', linear: 'Lineal' }[barCurve] ?? barCurve;

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
          CARGA DE ENERGÍA
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
            {curveLabel}
          </span>
        </div>
      </div>

      {/* Target */}
      <div style={{
        background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`,
        borderRadius: BORDERS.radius.xl, padding: `${SPACING[3]} ${SPACING[5]}`,
        textAlign: 'center', display: 'flex', flexDirection: 'column', gap: SPACING[1],
      }}>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
          MANTÉN
        </div>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size['2xl'], fontWeight: TYPOGRAPHY.weight.black, color: '#FFD700' }}>
          {targetSec} segundos
        </div>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
          margen ±{margin.toFixed(2)}s — barra: {curveLabel.toLowerCase()}
        </div>
      </div>

      {/* Progress bar (shown while holding or in result) */}
      {(phase === 'holding' || phase === 'result') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
          <div style={{
            width: '100%', height: '80px',
            background: COLORS_UI.bgCard,
            border: `1px solid ${COLORS_UI.border}`,
            borderRadius: BORDERS.radius.lg,
            overflow: 'hidden',
            position: 'relative',
          }}>
            <motion.div
              style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${barPct}%`,
                background: `linear-gradient(90deg, ${barColor}AA, ${barColor})`,
                boxShadow: `0 0 20px ${barColor}88`,
                transition: 'background 0.2s',
              }}
            />
            {/* Glow overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              background: `linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 60%)`,
              pointerEvents: 'none',
            }} />
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs,
            color: COLORS_UI.textMuted,
          }}>
            <span>0s</span>
            <span style={{ color: COLORS_UI.textSecondary }}>{barPct.toFixed(0)}%</span>
            <span>∞</span>
          </div>
        </div>
      )}

      {/* Result */}
      <AnimatePresence>
        {phase === 'result' && result && (
          <motion.div key="result"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{
              background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`,
              borderRadius: BORDERS.radius.xl, padding: `${SPACING[4]} ${SPACING[5]}`,
              textAlign: 'center', display: 'flex', flexDirection: 'column', gap: SPACING[3],
            }}>
            <span style={{
              fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg,
              fontWeight: TYPOGRAPHY.weight.bold,
              color: result.pass ? COLORS_GAME.verde : COLORS_GAME.rojo,
              letterSpacing: '0.1em',
            }}>
              {result.pass ? '✓ CARGA PERFECTA' : '✗ SOBRECARGA / CORTO'}
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>OBJETIVO</div>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.bold, color: '#FFD700' }}>{targetSec.toFixed(2)}s</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>TU CARGA</div>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.bold, color: result.pass ? COLORS_GAME.verde : COLORS_GAME.rojo }}>{result.elapsed.toFixed(2)}s</div>
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

      {/* Hold button — only during ready & holding */}
      {(phase === 'ready' || phase === 'holding') && (
        <motion.button
          onPointerDown={startHold}
          onPointerUp={endHold}
          onPointerLeave={endHold}
          whileTap={{ scale: 0.97 }}
          style={{
            width: '100%', minHeight: '88px',
            background: holding ? COLORS_GAME.rojo : COLORS_GAME.verde,
            border: 'none',
            borderRadius: BORDERS.radius.xl, fontFamily: TYPOGRAPHY.fontFamily,
            fontSize: 'clamp(22px, 6vw, 32px)', fontWeight: TYPOGRAPHY.weight.black,
            color: 'white', letterSpacing: '0.14em', cursor: 'pointer',
            boxShadow: holding
              ? `0 6px 32px ${COLORS_GAME.rojo}80`
              : `0 6px 28px ${COLORS_GAME.verde}60`,
            transition: 'background 0.15s, box-shadow 0.15s',
            touchAction: 'none',
          }}>
          {holding ? 'SOLTAR' : 'MANTENER'}
        </motion.button>
      )}
    </div>
  );
}
