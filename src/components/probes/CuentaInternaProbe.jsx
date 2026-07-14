/**
 * CuentaInternaProbe — Internal Count
 * Player estimates targetSec seconds have passed, then taps PARAR. No visual timer.
 * Best attempt across `attempts` tries used for pass/fail.
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  COLORS_UI, COLORS_GAME,
  TYPOGRAPHY, SPACING, BORDERS,
} from '../../styles/tokens.js';
import { playCuentaStart } from '../../engine/audio/audioEngine.js';

function pickTarget(cfg) {
  const opts = cfg.targetSec;
  if (Array.isArray(opts)) return opts[Math.floor(Math.random() * opts.length)];
  return opts ?? 5;
}

export default function CuentaInternaProbe({ config, character, onComplete }) {
  const baseMargin   = config.margin   ?? 0.30;
  const maxAttempts  = config.attempts ?? 2;

  const [targetSec]    = useState(() => pickTarget(config));
  const [phase,        setPhase]       = useState('ready');
  const [attempt,      setAttempt]     = useState(1);
  const [elapsedSec,   setElapsedSec]  = useState(null);
  const [bestError,    setBestError]   = useState(null);
  const [bestElapsed,  setBestElapsed] = useState(null);
  const [auraFlash,    setAuraFlash]   = useState(false);
  const [margin,       setMargin]      = useState(baseMargin);
  const [resultMsg,    setResultMsg]   = useState(null);

  const rafRef       = useRef(null);
  const startRef     = useRef(0);
  const marginRef    = useRef(baseMargin);
  const auraRef      = useRef(false);
  const phaseRef     = useRef('ready');

  useEffect(() => { marginRef.current = margin; }, [margin]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const handleStart = () => {
    setPhase('counting');
    phaseRef.current = 'counting';
    setElapsedSec(null);
    setResultMsg(null);
    playCuentaStart();
    startRef.current = performance.now();
    // minimal RAF just to keep running; we read performance.now() on stop
    const tick = () => {
      if (phaseRef.current === 'counting') {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const handleStop = () => {
    if (phaseRef.current !== 'counting') return;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = null;

    const elapsed = (performance.now() - startRef.current) / 1000;
    const cents   = Math.floor((elapsed % 1) * 100);

    // Aura check
    let effectiveMargin = marginRef.current;
    if (cents === character?.auraNumber && !auraRef.current) {
      auraRef.current = true;
      effectiveMargin += 0.10;
      setMargin(m => m + 0.10);
      setAuraFlash(true);
      setTimeout(() => setAuraFlash(false), 2500);
    }

    const error = Math.abs(elapsed - targetSec);
    const pass  = error <= effectiveMargin;

    const newBestError   = bestError   === null ? error   : Math.min(bestError, error);
    const newBestElapsed = (bestError === null || error <= bestError) ? elapsed : bestElapsed;

    setBestError(newBestError);
    setBestElapsed(newBestElapsed);
    setElapsedSec(elapsed);
    setPhase('result');
    phaseRef.current = 'result';

    const finalPass   = newBestError <= effectiveMargin;
    const isPerfect   = newBestError <= effectiveMargin * 0.5;
    const finalResult = isPerfect ? 'perfect' : finalPass ? 'pass' : 'fail';
    const isLastAttempt = attempt >= maxAttempts;

    setResultMsg({ elapsed, error, pass, finalPass, isLastAttempt });

    if (isLastAttempt) {
      setTimeout(() => onComplete({
        result: finalResult,
        auraTriggered: auraRef.current,
      }), 900);
    }
  };

  const handleRetry = () => {
    setAttempt(a => a + 1);
    setPhase('ready');
    phaseRef.current = 'ready';
    setElapsedSec(null);
    setResultMsg(null);
  };

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
          CUENTA INTERNA
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

      {/* READY phase */}
      {phase === 'ready' && (
        <>
          <div style={{
            background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`,
            borderRadius: BORDERS.radius.xl, padding: `${SPACING[5]} ${SPACING[4]}`,
            textAlign: 'center', display: 'flex', flexDirection: 'column', gap: SPACING[3],
          }}>
            <div style={{
              fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm,
              color: COLORS_UI.textMuted, letterSpacing: '0.08em',
            }}>
              MEMORIZA
            </div>
            <div style={{
              fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size['2xl'],
              fontWeight: TYPOGRAPHY.weight.black, color: '#FFD700',
            }}>
              {targetSec} segundos
            </div>
            <div style={{
              fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs,
              color: COLORS_UI.textMuted, lineHeight: 1.6,
            }}>
              La pantalla quedará en negro.{'\n'}
              Toca PARAR cuando creas que pasaron exactamente {targetSec}s.{'\n'}
              Margen: ±{margin.toFixed(2)}s
            </div>
          </div>

          {/* Best attempt tracker */}
          {bestElapsed !== null && (
            <div style={{
              background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`,
              borderRadius: BORDERS.radius.md, padding: `${SPACING[2]} ${SPACING[4]}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
                Mejor intento:
              </span>
              <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.text, fontWeight: TYPOGRAPHY.weight.bold }}>
                {bestElapsed.toFixed(2)}s
              </span>
            </div>
          )}

          <div style={{ flex: 1 }} />
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
        </>
      )}

      {/* COUNTING phase — black screen, only PARAR visible */}
      {phase === 'counting' && (
        <>
          <div style={{
            flex: 1, background: '#000', borderRadius: BORDERS.radius.xl,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            paddingBottom: SPACING[4],
          }}>
            <span style={{
              fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs,
              color: COLORS_UI.textMuted, letterSpacing: '0.1em',
            }}>
              Contando...
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleStop}
            style={{
              width: '100%', minHeight: '96px',
              background: COLORS_GAME.rojo, border: 'none',
              borderRadius: BORDERS.radius.xl, fontFamily: TYPOGRAPHY.fontFamily,
              fontSize: 'clamp(26px, 7vw, 36px)', fontWeight: TYPOGRAPHY.weight.black,
              color: 'white', letterSpacing: '0.14em', cursor: 'pointer',
              boxShadow: `0 6px 32px ${COLORS_GAME.rojo}80`,
            }}>
            PARAR
          </motion.button>
        </>
      )}

      {/* RESULT phase */}
      {phase === 'result' && resultMsg && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', gap: SPACING[4],
              justifyContent: 'center',
            }}>

            {/* Elapsed vs target */}
            <div style={{
              background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`,
              borderRadius: BORDERS.radius.xl, padding: `${SPACING[4]} ${SPACING[5]}`,
              textAlign: 'center', display: 'flex', flexDirection: 'column', gap: SPACING[2],
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-around', alignItems: 'center',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, marginBottom: SPACING[1] }}>
                    OBJETIVO
                  </div>
                  <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.bold, color: '#FFD700' }}>
                    {targetSec.toFixed(2)}s
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, marginBottom: SPACING[1] }}>
                    TÚ
                  </div>
                  <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.bold, color: resultMsg.pass ? COLORS_GAME.verde : COLORS_GAME.rojo }}>
                    {resultMsg.elapsed.toFixed(2)}s
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, marginBottom: SPACING[1] }}>
                    ERROR
                  </div>
                  <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.textSecondary }}>
                    {resultMsg.error > 0 ? '+' : ''}{(resultMsg.elapsed - targetSec).toFixed(2)}s
                  </div>
                </div>
              </div>
            </div>

            {/* Best attempt tracker */}
            {bestElapsed !== null && (
              <div style={{
                background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`,
                borderRadius: BORDERS.radius.md, padding: `${SPACING[2]} ${SPACING[4]}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
                  Mejor intento:
                </span>
                <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.text, fontWeight: TYPOGRAPHY.weight.bold }}>
                  {bestElapsed.toFixed(2)}s (error {bestError.toFixed(2)}s)
                </span>
              </div>
            )}

            {/* Final verdict if last attempt */}
            {resultMsg.isLastAttempt && (
              <div style={{ textAlign: 'center' }}>
                <span style={{
                  fontFamily: TYPOGRAPHY.fontFamily,
                  fontSize: TYPOGRAPHY.size.lg,
                  fontWeight: TYPOGRAPHY.weight.bold,
                  color: resultMsg.finalPass ? COLORS_GAME.verde : COLORS_GAME.rojo,
                  letterSpacing: '0.1em',
                }}>
                  {resultMsg.finalPass ? '✓ LOGRADO' : '✗ FALLIDO'}
                </span>
              </div>
            )}
          </motion.div>

          {/* Retry button if attempts remain */}
          {!resultMsg.isLastAttempt && (
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
          )}
        </>
      )}
    </div>
  );
}
