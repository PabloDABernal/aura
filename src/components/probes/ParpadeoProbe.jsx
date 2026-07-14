/**
 * ParpadeoProbe v4 — GDD v4.2 MULTI-PARADA.
 * maxStops intentos; basta 1 acierto (requiredHits = 1 fijo) para superar.
 * El cronómetro y el ciclo ON/OFF NUNCA se detienen en un fallo; solo se decrementa
 * el contador de paradas y se bloquea PARAR 700ms (feedback visual).
 * Fallo: sin paradas restantes O tiempo agotado.
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  COLORS_UI, COLORS_GAME,
  TYPOGRAPHY, SPACING, BORDERS,
} from '../../styles/tokens.js';
import { evaluateResult } from '../../engine/run/resultEvaluator.js';

const VALID_RANGES = [10, 20, 25, 50];

function normalizeRange(r) {
  const n = Number(r);
  return VALID_RANGES.includes(n) ? n : 50;
}

function generateTarget(range) {
  const off = [];
  for (let c = 0; c < 100; c++) {
    if ((c % (2 * range)) >= range) off.push(c);
  }
  return off[Math.floor(Math.random() * off.length)];
}

export default function ParpadeoProbe({ config, character, onComplete }) {
  const totalMs    = (config.totalSec ?? 10) * 1000;
  const cfgRange   = normalizeRange(config.range ?? 50);
  const baseMargin = config.margin ?? 3;
  const stopsTotal = config.maxStops ?? 10;

  const [target]      = useState(() => config.target != null ? config.target : generateTarget(cfgRange));
  const [phase,       setPhase]      = useState('ready');
  const [elapsed,     setElapsed]    = useState(0);
  const [isVisible,   setIsVisible]  = useState(true);
  const [margin,      setMargin]     = useState(baseMargin);
  const [auraFlash,   setAuraFlash]  = useState(null);
  const [result,      setResult]     = useState(null);
  const [stopsLeft,   setStopsLeft]  = useState(stopsTotal);
  const [lastAttempt, setLastAttempt] = useState(null); // { cents, diff } — feedback breve en fallo

  const rafRef           = useRef(null);
  const rafStartRef      = useRef(0);
  const baseElapsed      = useRef(0);
  const marginRef        = useRef(baseMargin);
  const auraTriggered    = useRef(false);
  const phaseRef         = useRef('ready');
  const stopsLeftRef     = useRef(stopsTotal);
  const feedbackActive   = useRef(false); // bloquea PARAR durante 700ms post-fallo

  useEffect(() => { marginRef.current = margin; }, [margin]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const stopRAF = () => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    baseElapsed.current += performance.now() - rafStartRef.current;
  };

  const startRAF = () => {
    rafStartRef.current = performance.now();
    const tick = () => {
      const el    = baseElapsed.current + (performance.now() - rafStartRef.current);
      const cents = Math.floor((el % 1000) / 10);
      setIsVisible((cents % (2 * cfgRange)) < cfgRange);
      setElapsed(el);
      if (el >= totalMs) {
        baseElapsed.current = totalMs;
        setElapsed(totalMs);
        doEnd('fail', totalMs);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  // doEnd: congela, muestra resultado final, llama onComplete tras 800ms
  const doEnd = (res, frozenMs) => {
    stopRAF();
    feedbackActive.current = false;
    const cents = Math.floor((frozenMs % 1000) / 10);
    const diff  = Math.abs(cents - target);
    setElapsed(frozenMs);
    setIsVisible(true);
    setLastAttempt(null);
    setPhase('done');
    phaseRef.current = 'done';
    setResult({ result: res, frozenMs, cents, diff });
    setTimeout(() => onComplete({ result: res, auraTriggered: auraTriggered.current }), 800);
  };

  const handleStart = () => {
    baseElapsed.current = 0;
    setPhase('running');
    phaseRef.current = 'running';
    startRAF();
  };

  const handleStop = () => {
    if (phaseRef.current !== 'running') return;
    if (feedbackActive.current) return;

    // Lee tiempo actual SIN detener el RAF (el cronómetro sigue corriendo en misses)
    const now      = performance.now();
    const heldMs   = baseElapsed.current + (now - rafStartRef.current);
    const cents    = Math.floor((heldMs % 1000) / 10);

    // Aura: ±2 al margen si para exactamente en auraNumber (una sola vez)
    let effectiveMargin = marginRef.current;
    if (cents === character?.auraNumber && !auraTriggered.current) {
      auraTriggered.current = true;
      effectiveMargin += 2;
      setMargin(m => m + 2);
      setAuraFlash(character?.auraAbility?.name ?? `#${String(character.auraNumber).padStart(2,'0')}`);
      setTimeout(() => setAuraFlash(null), 2500);
    }

    const diff = Math.abs(cents - target);
    const res  = evaluateResult(diff, effectiveMargin);

    if (res !== 'fail') {
      // ACIERTO — detener y superar prueba
      stopRAF();
      setElapsed(heldMs);
      setIsVisible(true);
      setResult({ result: res, frozenMs: heldMs, cents, diff });
      setPhase('done');
      phaseRef.current = 'done';
      setTimeout(() => onComplete({ result: res, auraTriggered: auraTriggered.current }), 800);
      return;
    }

    // FALLO — decrementar paradas, mostrar feedback, continuar (o terminar si sin paradas)
    const newLeft = stopsLeftRef.current - 1;
    stopsLeftRef.current = newLeft;
    setStopsLeft(newLeft);
    setLastAttempt({ cents, diff });
    feedbackActive.current = true;

    if (newLeft <= 0) {
      // Sin paradas: fallo definitivo — el RAF sigue pero doEnd lo para
      stopRAF();
      setElapsed(heldMs);
      setIsVisible(true);
      setResult({ result: 'fail', frozenMs: heldMs, cents, diff });
      setPhase('done');
      phaseRef.current = 'done';
      setTimeout(() => onComplete({ result: 'fail', auraTriggered: auraTriggered.current }), 800);
    } else {
      // Limpiar feedback tras 700ms; RAF nunca se detuvo
      setTimeout(() => {
        setLastAttempt(null);
        feedbackActive.current = false;
      }, 700);
    }
  };

  // ── Display ──────────────────────────────────────────────────────────────────
  const dispSecs   = Math.floor(elapsed / 1000);
  const dispCents  = Math.floor((elapsed % 1000) / 10);
  const dispStr    = `${dispSecs}.${String(dispCents).padStart(2,'0')}`;
  const timeLeftMs = Math.max(0, totalMs - elapsed);
  const timePct    = Math.min(100, (elapsed / totalMs) * 100);

  const timerColor = phase === 'done'
    ? (result?.result === 'fail' ? COLORS_GAME.rojo : result?.result === 'perfect' ? '#FFD700' : COLORS_GAME.verde)
    : COLORS_UI.text;

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      padding: SPACING[4], gap: SPACING[4], userSelect: 'none',
    }}>

      {/* Aura flash */}
      <AnimatePresence>
        {auraFlash && (
          <motion.div key="aura"
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: '12%', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(255,215,0,0.12)', border: '1px solid #FFD700',
              borderRadius: BORDERS.radius.lg, padding: `${SPACING[2]} ${SPACING[5]}`,
              color: '#FFD700', fontFamily: TYPOGRAPHY.fontFamily,
              fontWeight: TYPOGRAPHY.weight.bold, fontSize: TYPOGRAPHY.size.md,
              zIndex: 300, whiteSpace: 'nowrap',
            }}>
            ✨ AURA — {auraFlash} (+2 margen)
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header: título + aura badge + contador de paradas */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs,
          color: COLORS_UI.textMuted, letterSpacing: '0.06em',
        }}>
          PARPADEO
        </span>
        <div style={{ display: 'flex', gap: SPACING[2], alignItems: 'center' }}>
          {/* Contador de paradas */}
          {phase !== 'ready' && (
            <div style={{
              padding: `1px ${SPACING[2]}`,
              background: stopsLeft <= 2 ? 'rgba(224,64,64,0.12)' : 'rgba(59,168,79,0.08)',
              border: `1px solid ${stopsLeft <= 2 ? COLORS_GAME.rojo + '60' : COLORS_GAME.verde + '40'}`,
              borderRadius: BORDERS.radius.full,
              fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '10px',
              color: stopsLeft <= 2 ? COLORS_GAME.rojo : COLORS_GAME.verde,
              fontWeight: TYPOGRAPHY.weight.bold,
              whiteSpace: 'nowrap',
            }}>
              PARADAS: {stopsLeft}/{stopsTotal}
            </div>
          )}
          {character?.auraNumber != null && (
            <div style={{
              padding: `1px ${SPACING[2]}`,
              background: 'rgba(255,215,0,0.08)',
              border: '1px solid rgba(255,215,0,0.3)',
              borderRadius: BORDERS.radius.full,
              fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '10px',
              color: '#FFD700', whiteSpace: 'nowrap',
            }}>
              ✨ #{String(character.auraNumber).padStart(2,'0')} ±2
            </div>
          )}
        </div>
      </div>

      {/* Time remaining bar */}
      {phase !== 'ready' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[1] }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{
              fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs,
              color: COLORS_UI.textMuted,
            }}>
              TIEMPO RESTANTE
            </span>
            <span style={{
              fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs,
              color: timeLeftMs < 3000 ? COLORS_GAME.rojo : COLORS_UI.textSecondary,
              fontWeight: TYPOGRAPHY.weight.bold,
            }}>
              {(timeLeftMs / 1000).toFixed(1)}s
            </span>
          </div>
          <div style={{
            height: '6px', borderRadius: BORDERS.radius.full,
            background: COLORS_UI.border, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: BORDERS.radius.full,
              width: `${100 - timePct}%`,
              background: timeLeftMs < 3000 ? COLORS_GAME.rojo : COLORS_GAME.verde,
              transition: 'width 0.05s linear, background 0.3s',
            }} />
          </div>
        </div>
      )}

      {/* Target */}
      <div style={{
        background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`,
        borderRadius: BORDERS.radius.xl, padding: `${SPACING[3]} ${SPACING[5]}`,
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm,
          color: COLORS_UI.textMuted, letterSpacing: '0.1em', marginBottom: SPACING[1],
        }}>
          OBJETIVO
        </div>
        <div style={{
          fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size['2xl'],
          fontWeight: TYPOGRAPHY.weight.black, color: '#FFD700', letterSpacing: '0.04em',
        }}>
          .{String(target).padStart(2,'0')}
        </div>
        <div style={{
          fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs,
          color: COLORS_UI.textMuted, marginTop: SPACING[1],
        }}>
          ±{margin} centésimas · ventana OFF cada {cfgRange}cs
        </div>
      </div>

      {/* Blink rhythm indicator */}
      {phase !== 'ready' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[3], justifyContent: 'center' }}>
          <div style={{
            width: '40px', height: '6px', borderRadius: BORDERS.radius.full,
            background: isVisible && phase === 'running' ? COLORS_GAME.verde : 'rgba(59,168,79,0.3)',
            transition: 'background 0.05s',
          }} />
          <span style={{
            fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs,
            color: COLORS_UI.textMuted,
          }}>
            ON {cfgRange}cs / OFF {cfgRange}cs
          </span>
          <div style={{
            width: '40px', height: '6px', borderRadius: BORDERS.radius.full,
            background: !isVisible && phase === 'running' ? COLORS_UI.textMuted : COLORS_UI.border,
            transition: 'background 0.05s',
          }} />
        </div>
      )}

      {/* Main timer display */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {phase === 'ready' && (
          <div style={{
            fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size['2xl'],
            color: COLORS_UI.textMuted, letterSpacing: '0.06em',
          }}>
            0.00
          </div>
        )}

        {phase === 'running' && (
          <AnimatePresence mode="wait">
            {isVisible ? (
              <motion.div key="show"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.03 }}
                style={{
                  fontFamily: TYPOGRAPHY.fontFamilyMono,
                  fontSize: 'clamp(64px, 18vw, 96px)',
                  fontWeight: TYPOGRAPHY.weight.black,
                  color: COLORS_UI.text, letterSpacing: '0.02em', lineHeight: 1,
                }}
              >
                {dispStr}
              </motion.div>
            ) : (
              <motion.div key="hide"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.03 }}
                style={{
                  fontFamily: TYPOGRAPHY.fontFamilyMono,
                  fontSize: 'clamp(64px, 18vw, 96px)',
                  fontWeight: TYPOGRAPHY.weight.black,
                  color: COLORS_UI.textMuted, letterSpacing: '0.06em', lineHeight: 1,
                }}
              >
                ▓▓▓
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {phase === 'done' && (
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 0.35 }}
            style={{
              fontFamily: TYPOGRAPHY.fontFamilyMono,
              fontSize: 'clamp(64px, 18vw, 96px)',
              fontWeight: TYPOGRAPHY.weight.black,
              color: timerColor, letterSpacing: '0.02em', lineHeight: 1,
            }}
          >
            {dispStr}
          </motion.div>
        )}

        {/* Miss feedback toast — flotante sobre el timer, desaparece en 700ms */}
        <AnimatePresence>
          {lastAttempt && (
            <motion.div key="miss"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                position: 'absolute', bottom: '-8px',
                background: 'rgba(224,64,64,0.12)', border: `1px solid ${COLORS_GAME.rojo}40`,
                borderRadius: BORDERS.radius.md,
                padding: `${SPACING[1]} ${SPACING[3]}`,
                fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.sm,
                color: COLORS_UI.textSecondary, whiteSpace: 'nowrap',
              }}
            >
              <span style={{ color: COLORS_GAME.rojo }}>
                .{String(lastAttempt.cents).padStart(2,'0')}
              </span>
              <span style={{ color: COLORS_UI.textMuted }}>
                {' '}({lastAttempt.cents > target ? '+' : ''}{lastAttempt.cents - target}) · objetivo </span>
              <span style={{ color: '#FFD700' }}>
                .{String(target).padStart(2,'0')}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Done result */}
      <AnimatePresence>
        {phase === 'done' && result && (
          <motion.div key="result"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ textAlign: 'center' }}
          >
            {result.result !== 'fail' ? (
              <span style={{
                fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg,
                fontWeight: TYPOGRAPHY.weight.bold,
                color: result.result === 'perfect' ? '#FFD700' : COLORS_GAME.verde,
                letterSpacing: '0.1em',
              }}>
                {result.result === 'perfect' ? '✦ PERFECTO' : '✓ EXACTO'}
              </span>
            ) : (
              <span style={{
                fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.md,
                color: COLORS_UI.textSecondary,
              }}>
                <span style={{ color: COLORS_UI.textMuted }}>objetivo </span>
                <span style={{ color: '#FFD700' }}>.{String(target).padStart(2,'0')}</span>
                <span style={{ color: COLORS_UI.textMuted }}> · sin paradas</span>
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {phase === 'ready' && (
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
      )}

      {phase === 'running' && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleStop}
          style={{
            width: '100%', minHeight: '88px',
            background: COLORS_GAME.rojo, border: 'none',
            borderRadius: BORDERS.radius.xl, fontFamily: TYPOGRAPHY.fontFamily,
            fontSize: 'clamp(22px, 6vw, 32px)', fontWeight: TYPOGRAPHY.weight.black,
            color: 'white', letterSpacing: '0.14em', cursor: 'pointer',
            boxShadow: `0 6px 32px ${COLORS_GAME.rojo}80`,
            opacity: feedbackActive.current ? 0.5 : 1,
          }}>
          PARAR
        </motion.button>
      )}
    </div>
  );
}
