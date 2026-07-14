/**
 * PactoProbe — Pact
 * Player proposes a MIN/MAX time range. Cost in coins = costPerSec × rangeWidth.
 * A hidden random timer stops; if it lands in the range → pass.
 */
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  COLORS_UI, COLORS_GAME,
  TYPOGRAPHY, SPACING, BORDERS,
} from '../../styles/tokens.js';

export default function PactoProbe({ config, character, onComplete }) {
  const initialCoins = config.coins      ?? 5;
  const costPerSec   = config.costPerSec ?? 1;
  const totalSec     = config.totalSec   ?? 10;
  const maxAttempts  = config.attempts   ?? 2;

  const [phase,       setPhase]     = useState('proposing');
  const [minVal,      setMinVal]    = useState(2.0);
  const [maxVal,      setMaxVal]    = useState(4.0);
  const [coins,       setCoins]     = useState(initialCoins);
  const [attempt,     setAttempt]   = useState(1);
  const [randomStop,  setRandomStop]= useState(null);
  const [result,      setResult]    = useState(null);
  const [auraFlash,   setAuraFlash] = useState(false);
  const [auraBonus,   setAuraBonus] = useState(false);

  const auraRef = useRef(false);

  const rangeWidth  = Math.max(0, maxVal - minVal);
  const cost        = parseFloat((costPerSec * rangeWidth).toFixed(2));
  const canConfirm  = cost <= coins && rangeWidth > 0 && minVal >= 0 && maxVal <= totalSec && minVal < maxVal;

  const handleConfirm = () => {
    if (!canConfirm) return;

    setPhase('rolling');

    setTimeout(() => {
      const stop = parseFloat((Math.random() * totalSec).toFixed(2));
      const cents = Math.floor((stop % 1) * 100);

      let bonusCoin = 0;
      if (cents === character?.auraNumber && !auraRef.current) {
        auraRef.current = true;
        bonusCoin = 1;
        setAuraFlash(true);
        setAuraBonus(true);
        setTimeout(() => setAuraFlash(false), 2500);
      }

      const pass        = stop >= minVal && stop <= maxVal;
      const isPerfect   = pass && attempt === 1 && rangeWidth <= 0.11;
      const finalResult = isPerfect ? 'perfect' : pass ? 'pass' : 'fail';
      const newCoins    = coins - cost + bonusCoin;

      setRandomStop(stop);
      setCoins(parseFloat(newCoins.toFixed(2)));
      setResult({ stop, pass, isPerfect, cost, bonusCoin, min: minVal, max: maxVal });
      setPhase('result');

      if (pass) {
        setTimeout(() => onComplete({ result: finalResult, auraTriggered: auraRef.current }), 2200);
      }
    }, 1500);
  };

  const handleRetry = () => {
    if (attempt >= maxAttempts) return;
    setAttempt(a => a + 1);
    setRandomStop(null);
    setResult(null);
    setAuraBonus(false);
    setPhase('proposing');
  };

  const adjustVal = (setter, current, delta, other, isMin) => {
    let next = parseFloat((current + delta).toFixed(1));
    next = Math.max(0, Math.min(totalSec, next));
    if (isMin && next >= other) next = parseFloat((other - 0.1).toFixed(1));
    if (!isMin && next <= other) next = parseFloat((other + 0.1).toFixed(1));
    setter(next);
  };

  const btnStyle = (disabled) => ({
    width: 40, height: 40,
    borderRadius: BORDERS.radius.md,
    background: disabled ? COLORS_UI.bgCard : COLORS_UI.bgElevated,
    border: `1px solid ${disabled ? COLORS_UI.border : COLORS_UI.borderLight ?? COLORS_UI.border}`,
    color: disabled ? COLORS_UI.textMuted : COLORS_UI.text,
    fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.bold,
    fontFamily: TYPOGRAPHY.fontFamilyMono,
    cursor: disabled ? 'default' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  });

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
            AURA #{String(character?.auraNumber ?? 0).padStart(2,'0')} — +1 moneda
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs,
          color: COLORS_UI.textMuted, letterSpacing: '0.08em',
        }}>
          PACTO
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
            intento {attempt}/{maxAttempts}
          </span>
        </div>
      </div>

      {/* Coins display */}
      <div style={{
        background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`,
        borderRadius: BORDERS.radius.lg, padding: `${SPACING[2]} ${SPACING[4]}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
          MONEDAS
        </span>
        <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: '#FFD700' }}>
          {coins.toFixed(2)}
        </span>
      </div>

      {/* Proposing phase */}
      {(phase === 'proposing') && (
        <>
          <div style={{
            background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`,
            borderRadius: BORDERS.radius.xl, padding: SPACING[4],
            display: 'flex', flexDirection: 'column', gap: SPACING[4],
          }}>
            {/* MIN control */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
              <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
                MÍNIMO (s)
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[3] }}>
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => adjustVal(setMinVal, minVal, -0.1, maxVal, true)}
                  style={btnStyle(false)}>
                  −
                </motion.button>
                <div style={{
                  flex: 1, textAlign: 'center',
                  fontFamily: TYPOGRAPHY.fontFamilyMono,
                  fontSize: TYPOGRAPHY.size['2xl'],
                  fontWeight: TYPOGRAPHY.weight.black,
                  color: COLORS_UI.text,
                }}>
                  {minVal.toFixed(1)}
                </div>
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => adjustVal(setMinVal, minVal, +0.1, maxVal, true)}
                  style={btnStyle(false)}>
                  +
                </motion.button>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: COLORS_UI.border }} />

            {/* MAX control */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
              <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
                MÁXIMO (s)
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[3] }}>
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => adjustVal(setMaxVal, maxVal, -0.1, minVal, false)}
                  style={btnStyle(false)}>
                  −
                </motion.button>
                <div style={{
                  flex: 1, textAlign: 'center',
                  fontFamily: TYPOGRAPHY.fontFamilyMono,
                  fontSize: TYPOGRAPHY.size['2xl'],
                  fontWeight: TYPOGRAPHY.weight.black,
                  color: COLORS_UI.text,
                }}>
                  {maxVal.toFixed(1)}
                </div>
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => adjustVal(setMaxVal, maxVal, +0.1, minVal, false)}
                  style={btnStyle(false)}>
                  +
                </motion.button>
              </div>
            </div>

            {/* Visual timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[1] }}>
              <div style={{ position: 'relative', height: 20, background: COLORS_UI.bgCard, borderRadius: BORDERS.radius.full, overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute',
                  left: `${(minVal / totalSec) * 100}%`,
                  width: `${((maxVal - minVal) / totalSec) * 100}%`,
                  top: 0, bottom: 0,
                  background: `${COLORS_GAME.verde}55`,
                  borderRadius: BORDERS.radius.full,
                  border: `1px solid ${COLORS_GAME.verde}`,
                  transition: 'left 0.1s, width 0.1s',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '10px', color: COLORS_UI.textMuted }}>0s</span>
                <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '10px', color: COLORS_UI.textMuted }}>{totalSec}s</span>
              </div>
            </div>

            {/* Cost preview */}
            <div style={{
              background: cost > coins ? `${COLORS_GAME.rojo}22` : `${COLORS_GAME.verde}11`,
              border: `1px solid ${cost > coins ? COLORS_GAME.rojo : COLORS_UI.border}`,
              borderRadius: BORDERS.radius.md,
              padding: `${SPACING[2]} ${SPACING[3]}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
                Costo: {costPerSec} × {rangeWidth.toFixed(1)}s
              </span>
              <span style={{
                fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.sm,
                fontWeight: TYPOGRAPHY.weight.bold,
                color: cost > coins ? COLORS_GAME.rojo : COLORS_GAME.verde,
              }}>
                {cost.toFixed(2)} monedas
              </span>
            </div>
          </div>

          <div style={{ flex: 1 }} />

          <motion.button
            whileTap={canConfirm ? { scale: 0.97 } : {}}
            onClick={handleConfirm}
            disabled={!canConfirm}
            style={{
              width: '100%', minHeight: '72px',
              background: canConfirm ? COLORS_GAME.verde : COLORS_UI.bgCard,
              border: `2px solid ${canConfirm ? COLORS_GAME.verde : COLORS_UI.border}`,
              borderRadius: BORDERS.radius.xl, fontFamily: TYPOGRAPHY.fontFamily,
              fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black,
              color: canConfirm ? 'white' : COLORS_UI.textMuted,
              letterSpacing: '0.12em', cursor: canConfirm ? 'pointer' : 'default',
              boxShadow: canConfirm ? `0 6px 28px ${COLORS_GAME.verde}60` : 'none',
              transition: 'background 0.15s, border-color 0.15s, color 0.15s',
            }}>
            CONFIRMAR
          </motion.button>
        </>
      )}

      {/* Rolling phase */}
      {phase === 'rolling' && (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: SPACING[4],
        }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.6, ease: 'linear' }}
            style={{
              width: 60, height: 60, borderRadius: BORDERS.radius.full,
              border: `4px solid ${COLORS_UI.border}`,
              borderTopColor: '#FFD700',
            }}
          />
          <span style={{
            fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.lg,
            color: COLORS_UI.textSecondary, letterSpacing: '0.1em',
          }}>
            Rodando...
          </span>
        </div>
      )}

      {/* Result phase */}
      {phase === 'result' && result && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: SPACING[4] }}>

            {/* Range and result visualisation */}
            <div style={{
              background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`,
              borderRadius: BORDERS.radius.xl, padding: SPACING[4],
              display: 'flex', flexDirection: 'column', gap: SPACING[3],
            }}>
              {/* Visual timeline with result */}
              <div style={{ position: 'relative', height: 28, borderRadius: BORDERS.radius.full, background: COLORS_UI.bgCard, overflow: 'hidden' }}>
                {/* Range highlight */}
                <div style={{
                  position: 'absolute',
                  left: `${(result.min / totalSec) * 100}%`,
                  width: `${((result.max - result.min) / totalSec) * 100}%`,
                  top: 0, bottom: 0,
                  background: `${COLORS_GAME.verde}44`,
                  borderRadius: BORDERS.radius.full,
                  border: `1px solid ${COLORS_GAME.verde}`,
                }} />
                {/* Result line */}
                <div style={{
                  position: 'absolute',
                  left: `${(result.stop / totalSec) * 100}%`,
                  top: 0, bottom: 0, width: 3,
                  background: result.pass ? '#FFD700' : COLORS_GAME.rojo,
                  transform: 'translateX(-50%)',
                  boxShadow: `0 0 8px ${result.pass ? '#FFD700' : COLORS_GAME.rojo}`,
                }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '10px', color: COLORS_UI.textMuted }}>0s</span>
                <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '10px', color: COLORS_UI.textMuted }}>{totalSec}s</span>
              </div>

              {/* Values */}
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>RANGO</div>
                  <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_GAME.verde }}>
                    {result.min.toFixed(1)}–{result.max.toFixed(1)}s
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>PARADA</div>
                  <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.bold, color: result.pass ? '#FFD700' : COLORS_GAME.rojo }}>
                    {result.stop.toFixed(2)}s
                  </div>
                </div>
              </div>

              {/* Aura bonus */}
              {result.bonusCoin > 0 && (
                <div style={{
                  textAlign: 'center',
                  fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs,
                  color: '#FFD700',
                }}>
                  +{result.bonusCoin} moneda por AURA
                </div>
              )}
            </div>

            {/* Verdict */}
            <div style={{
              textAlign: 'center',
              background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`,
              borderRadius: BORDERS.radius.xl, padding: `${SPACING[3]} ${SPACING[5]}`,
            }}>
              <span style={{
                fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg,
                fontWeight: TYPOGRAPHY.weight.bold,
                color: result.pass ? COLORS_GAME.verde : COLORS_GAME.rojo,
                letterSpacing: '0.1em',
              }}>
                {result.pass ? '✓ PACTO CUMPLIDO' : '✗ PACTO ROTO'}
              </span>
            </div>

            {/* If failed and attempts left */}
            {!result.pass && attempt < maxAttempts && (
              <div style={{ textAlign: 'center', fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
                Monedas restantes: {coins.toFixed(2)}
              </div>
            )}
          </motion.div>

          {/* Buttons */}
          {result.pass ? null : attempt < maxAttempts ? (
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleRetry}
              style={{
                width: '100%', minHeight: '64px',
                background: COLORS_UI.bgElevated,
                border: `2px solid ${COLORS_UI.border}`,
                borderRadius: BORDERS.radius.xl, fontFamily: TYPOGRAPHY.fontFamily,
                fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.bold,
                color: COLORS_UI.text, letterSpacing: '0.1em', cursor: 'pointer',
              }}>
              REINTENTAR ({maxAttempts - attempt} restante{maxAttempts - attempt !== 1 ? 's' : ''})
            </motion.button>
          ) : (
            // All attempts failed — auto-complete was called in the last handleConfirm result read
            // but we need to trigger it here for the final fail case
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => onComplete({ result: 'fail', auraTriggered: auraRef.current })}
              style={{
                width: '100%', minHeight: '64px',
                background: COLORS_UI.bgCard,
                border: `2px solid ${COLORS_UI.border}`,
                borderRadius: BORDERS.radius.xl, fontFamily: TYPOGRAPHY.fontFamily,
                fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.bold,
                color: COLORS_UI.textMuted, letterSpacing: '0.1em', cursor: 'pointer',
              }}>
              CONTINUAR
            </motion.button>
          )}
        </>
      )}
    </div>
  );
}
