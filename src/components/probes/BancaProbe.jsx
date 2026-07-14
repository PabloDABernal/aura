/**
 * BancaProbe — Bank mechanic. Player takes `slots` stops recording CENTÉSIMAS (0-99).
 * Values hidden until all used. Then reveal one-by-one; sum must be in [minTarget, maxTarget].
 * Aura bonus: centésimas === auraNumber → that slot revealed immediately (bonus intel).
 * GDD v2.1 Sección 4: Banca.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  COLORS_UI, COLORS_GAME,
  TYPOGRAPHY, SPACING, BORDERS,
} from '../../styles/tokens.js';

export default function BancaProbe({ config, character, onComplete }) {
  const slots      = config.slots      ?? 5;
  const minTarget  = config.minTarget  ?? 80;
  const maxTarget  = config.maxTarget  ?? 120;
  const totalSec   = config.totalSec   ?? 60;
  const discards   = config.discards   ?? 0;

  // Slot states: null = empty, number = recorded value
  // revealed: array of booleans (true = shown before reveal phase)
  const [phase,          setPhase]          = useState('ready');
  const [elapsed,        setElapsed]        = useState(0);
  const [slotValues,     setSlotValues]     = useState(() => Array(slots).fill(null));
  const [slotRevealed,   setSlotRevealed]   = useState(() => Array(slots).fill(false));
  const [usedSlots,      setUsedSlots]      = useState(0);
  const [discardsLeft,   setDiscardsLeft]   = useState(discards);
  const [revealIndex,    setRevealIndex]    = useState(0);  // during reveal phase
  const [sum,            setSum]            = useState(null);
  const [passed,         setPassed]         = useState(null);
  const [auraFlashIdx,   setAuraFlashIdx]   = useState(null);
  const [lastStopAura,   setLastStopAura]   = useState(false);

  const rafRef        = useRef(null);
  const rafStartRef   = useRef(0);
  const baseElapsed   = useRef(0);
  const auraTriggered = useRef(false);
  const phaseRef      = useRef('ready');
  const usedSlotsRef  = useRef(0);
  const slotValuesRef = useRef(Array(slots).fill(null));
  const totalMs       = totalSec * 1000;

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => {
    usedSlotsRef.current = usedSlots;
    slotValuesRef.current = slotValues;
  }, [usedSlots, slotValues]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // ── RAF ──────────────────────────────────────────────────────────────────────
  const startRAF = useCallback(() => {
    rafStartRef.current = performance.now();
    const tick = () => {
      if (phaseRef.current !== 'running') return;
      const el = baseElapsed.current + (performance.now() - rafStartRef.current);
      if (el >= totalMs) {
        baseElapsed.current = totalMs;
        setElapsed(totalMs);
        // Time ran out — treat as all remaining slots = 0
        startReveal();
        return;
      }
      setElapsed(el);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [totalMs]); // startReveal defined below — OK because called lazily

  const stopRAF = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    baseElapsed.current = baseElapsed.current + (performance.now() - rafStartRef.current);
  }, []);

  // ── Reveal phase ─────────────────────────────────────────────────────────────
  const startReveal = useCallback(() => {
    stopRAF();
    setPhase('revealing');
    phaseRef.current = 'revealing';
  }, [stopRAF]);

  // Sequential reveal after entering 'revealing' phase
  useEffect(() => {
    if (phase !== 'revealing') return;
    const vals  = slotValuesRef.current;
    const total = vals.reduce((acc, v) => acc + (v ?? 0), 0);

    let idx = 0;
    const revealNext = () => {
      if (idx >= slots) {
        setSum(total);
        const win        = total >= minTarget && total <= maxTarget;
        const rangeW     = maxTarget - minTarget;
        const perfectMin = minTarget + rangeW / 4;
        const perfectMax = maxTarget - rangeW / 4;
        const finalResult = win && total >= perfectMin && total <= perfectMax
          ? 'perfect' : win ? 'pass' : 'fail';
        setPassed(win);
        setPhase('done');
        setTimeout(() => onComplete({
          result:        finalResult,
          auraTriggered: auraTriggered.current,
        }), 900);
        return;
      }
      setRevealIndex(idx);
      setSlotRevealed(prev => {
        const next = [...prev];
        next[idx] = true;
        return next;
      });
      idx++;
      setTimeout(revealNext, 300);
    };
    setTimeout(revealNext, 150);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleStart = () => {
    baseElapsed.current = 0;
    setElapsed(0);
    setPhase('running');
    phaseRef.current = 'running';
    startRAF();
  };

  const handleStop = () => {
    if (phaseRef.current !== 'running') return;
    if (usedSlotsRef.current >= slots) return;

    const snap   = baseElapsed.current + (performance.now() - rafStartRef.current);
    const cents  = Math.floor((snap % 1000) / 10);

    const aura = cents === character?.auraNumber;
    if (aura) {
      auraTriggered.current = true;
      setLastStopAura(true);
      setAuraFlashIdx(usedSlotsRef.current);
      setTimeout(() => setAuraFlashIdx(null), 2000);
    } else {
      setLastStopAura(false);
    }

    const slotIdx = usedSlotsRef.current;
    const newVals = [...slotValuesRef.current];
    newVals[slotIdx] = cents;
    slotValuesRef.current = newVals;
    setSlotValues(newVals);

    if (aura) {
      // Reveal immediately
      setSlotRevealed(prev => {
        const next = [...prev];
        next[slotIdx] = true;
        return next;
      });
    }

    const newUsed = slotIdx + 1;
    usedSlotsRef.current = newUsed;
    setUsedSlots(newUsed);

    if (newUsed >= slots) {
      startReveal();
    }
  };

  const handleDiscard = () => {
    if (phaseRef.current !== 'running') return;
    if (usedSlotsRef.current >= slots) return;
    if (discardsLeft <= 0) return;

    const slotIdx = usedSlotsRef.current;
    const newVals = [...slotValuesRef.current];
    newVals[slotIdx] = 0;
    slotValuesRef.current = newVals;
    setSlotValues(newVals);
    setDiscardsLeft(d => d - 1);

    const newUsed = slotIdx + 1;
    usedSlotsRef.current = newUsed;
    setUsedSlots(newUsed);

    if (newUsed >= slots) {
      startReveal();
    }
  };

  // ── Display ──────────────────────────────────────────────────────────────────
  const currentCents    = Math.floor((elapsed % 1000) / 10);
  const dispSecs        = Math.floor(elapsed / 1000);
  const dispCents       = String(currentCents).padStart(2, '0');
  const timeLeftMs      = Math.max(0, totalMs - elapsed);
  const timeLeftSec     = (timeLeftMs / 1000).toFixed(1);
  const timePct         = Math.min(100, (elapsed / totalMs) * 100);
  const slotsRemaining  = slots - usedSlots;
  const isRunning       = phase === 'running';
  const canStop         = isRunning && slotsRemaining > 0;

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
        {auraFlashIdx !== null && (
          <motion.div key="aura"
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              position:     'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)',
              background:   'rgba(255,215,0,0.12)', border: '1px solid #FFD700',
              borderRadius: BORDERS.radius.lg, padding: `${SPACING[2]} ${SPACING[5]}`,
              color:        '#FFD700', fontFamily: TYPOGRAPHY.fontFamily,
              fontWeight:   TYPOGRAPHY.weight.bold, fontSize: TYPOGRAPHY.size.md,
              zIndex:       300, whiteSpace: 'nowrap',
            }}>
            AURA — revelado inmediato
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{
            fontFamily:   TYPOGRAPHY.fontFamily,
            fontSize:     TYPOGRAPHY.size.sm,
            fontWeight:   TYPOGRAPHY.weight.bold,
            color:        COLORS_UI.textSecondary,
            letterSpacing:'0.08em',
          }}>
            BANCA
          </span>
          <span style={{
            fontFamily:  TYPOGRAPHY.fontFamilyMono,
            fontSize:    TYPOGRAPHY.size.xs,
            color:       COLORS_UI.textMuted,
          }}>
            objetivo: {minTarget}–{maxTarget}
          </span>
        </div>
        <div style={{ display: 'flex', gap: SPACING[2], alignItems: 'center' }}>
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
              #{String(character.auraNumber).padStart(2,'0')} revelar
            </div>
          )}
          <span style={{
            fontFamily:  TYPOGRAPHY.fontFamilyMono,
            fontSize:    TYPOGRAPHY.size.sm,
            fontWeight:  TYPOGRAPHY.weight.bold,
            color:       Number(timeLeftSec) <= 5
              ? COLORS_GAME.rojo : COLORS_UI.textSecondary,
          }}>
            {phase !== 'ready' ? `${timeLeftSec}s` : `${totalSec}s`}
          </span>
        </div>
      </div>

      {/* Time bar */}
      {phase !== 'ready' && (
        <div style={{
          height:       '4px',
          borderRadius: BORDERS.radius.full,
          background:   COLORS_UI.border,
          overflow:     'hidden',
        }}>
          <motion.div
            animate={{ width: `${timePct}%` }}
            transition={{ duration: 0.05 }}
            style={{
              height:       '100%',
              borderRadius: BORDERS.radius.full,
              background:   COLORS_GAME.verde,
            }}
          />
        </div>
      )}

      {/* Slot grid */}
      <div style={{
        display:        'flex',
        flexWrap:       'wrap',
        gap:            SPACING[2],
        justifyContent: 'center',
      }}>
        {Array.from({ length: slots }, (_, i) => {
          const val        = slotValues[i];
          const revealed   = slotRevealed[i];
          const isUsed     = val !== null;
          const isCurrent  = isRunning && i === usedSlots;
          const isAuraSlot = auraFlashIdx === i;

          return (
            <motion.div
              key={i}
              animate={isAuraSlot ? { scale: [1, 1.15, 1] } : {}}
              transition={{ duration: 0.4 }}
              style={{
                width:          '64px',
                height:         '80px',
                borderRadius:   BORDERS.radius.lg,
                border:         isAuraSlot
                  ? '2px solid #FFD700'
                  : isCurrent
                    ? `2px solid ${COLORS_UI.text}`
                    : isUsed
                      ? `1px solid ${COLORS_UI.border}`
                      : `1px dashed ${COLORS_UI.border}`,
                background:     isAuraSlot
                  ? 'rgba(255,215,0,0.10)'
                  : isCurrent
                    ? COLORS_UI.bgElevated
                    : isUsed
                      ? COLORS_UI.bgCard
                      : 'transparent',
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            SPACING[1],
                transition:     'all 0.2s',
                position:       'relative',
                overflow:       'hidden',
              }}
            >
              {/* Slot number label */}
              <span style={{
                position:   'absolute',
                top:        '5px',
                left:       '50%',
                transform:  'translateX(-50%)',
                fontFamily: TYPOGRAPHY.fontFamilyMono,
                fontSize:   '9px',
                color:      COLORS_UI.textMuted,
              }}>
                {i + 1}
              </span>

              {/* Content */}
              {isUsed ? (
                revealed ? (
                  <motion.div
                    key={`reveal-${i}`}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      fontFamily: TYPOGRAPHY.fontFamilyMono,
                      fontSize:   TYPOGRAPHY.size['2xl'],
                      fontWeight: TYPOGRAPHY.weight.black,
                      color:      isAuraSlot ? '#FFD700' : COLORS_UI.text,
                      lineHeight: 1,
                    }}
                  >
                    {val}
                  </motion.div>
                ) : (
                  <span style={{
                    fontFamily: TYPOGRAPHY.fontFamilyMono,
                    fontSize:   TYPOGRAPHY.size['2xl'],
                    fontWeight: TYPOGRAPHY.weight.black,
                    color:      COLORS_UI.textMuted,
                    lineHeight: 1,
                  }}>
                    ?
                  </span>
                )
              ) : isCurrent ? (
                <span style={{
                  fontFamily: TYPOGRAPHY.fontFamilyMono,
                  fontSize:   TYPOGRAPHY.size.xs,
                  color:      COLORS_UI.textSecondary,
                  letterSpacing:'0.06em',
                }}>
                  AQUÍ
                </span>
              ) : (
                <span style={{
                  fontFamily: TYPOGRAPHY.fontFamilyMono,
                  fontSize:   TYPOGRAPHY.size.lg,
                  color:      COLORS_UI.border,
                }}>
                  –
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Stops remaining + sum */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontFamily:  TYPOGRAPHY.fontFamilyMono,
          fontSize:    TYPOGRAPHY.size.sm,
          color:       COLORS_UI.textSecondary,
        }}>
          {phase === 'done' || phase === 'revealing'
            ? 'Revelando...'
            : `${slotsRemaining} parada${slotsRemaining !== 1 ? 's' : ''} restante${slotsRemaining !== 1 ? 's' : ''}`
          }
        </span>
        {sum !== null && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              fontFamily:  TYPOGRAPHY.fontFamilyMono,
              fontSize:    TYPOGRAPHY.size.xl,
              fontWeight:  TYPOGRAPHY.weight.black,
              color:       passed
                ? COLORS_GAME.verde : COLORS_GAME.rojo,
            }}
          >
            Σ {sum}
          </motion.span>
        )}
      </div>

      {/* Big timer */}
      {phase !== 'ready' && phase !== 'done' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            fontFamily:   TYPOGRAPHY.fontFamilyMono,
            fontSize:     'clamp(56px, 16vw, 80px)',
            fontWeight:   TYPOGRAPHY.weight.black,
            color:        COLORS_UI.text,
            letterSpacing:'0.02em',
            lineHeight:   1,
          }}>
            {dispSecs}.{dispCents}
          </div>
        </div>
      )}

      {/* Done result */}
      <AnimatePresence>
        {phase === 'done' && passed !== null && sum !== null && (
          <motion.div key="result"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              background:   passed
                ? 'rgba(59,168,79,0.10)' : 'rgba(224,59,59,0.10)',
              border:       `1px solid ${passed
                ? 'rgba(59,168,79,0.4)' : 'rgba(224,59,59,0.4)'}`,
              borderRadius: BORDERS.radius.lg,
              padding:      `${SPACING[3]} ${SPACING[4]}`,
              textAlign:    'center',
            }}
          >
            <div style={{
              fontFamily:   TYPOGRAPHY.fontFamily,
              fontSize:     TYPOGRAPHY.size['2xl'],
              fontWeight:   TYPOGRAPHY.weight.black,
              color:        passed ? COLORS_GAME.verde : COLORS_GAME.rojo,
              letterSpacing:'0.08em',
              marginBottom: SPACING[1],
            }}>
              {passed ? 'ACERTADO' : 'FALLADO'}
            </div>
            <div style={{
              fontFamily:  TYPOGRAPHY.fontFamilyMono,
              fontSize:    TYPOGRAPHY.size.md,
              color:       COLORS_UI.textSecondary,
            }}>
              Σ {sum} — rango {minTarget}–{maxTarget}
            </div>
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

      {isRunning && (
        <div style={{ display: 'flex', gap: SPACING[3] }}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleStop}
            disabled={!canStop}
            style={{
              flex:         1,
              minHeight:    '88px',
              background:   canStop ? COLORS_GAME.rojo : COLORS_UI.bgElevated,
              border:       canStop ? 'none' : `1px solid ${COLORS_UI.border}`,
              borderRadius: BORDERS.radius.xl,
              fontFamily:   TYPOGRAPHY.fontFamily,
              fontSize:     'clamp(22px, 6vw, 32px)',
              fontWeight:   TYPOGRAPHY.weight.black,
              color:        canStop ? 'white' : COLORS_UI.textMuted,
              letterSpacing:'0.14em',
              cursor:       canStop ? 'pointer' : 'default',
              boxShadow:    canStop ? `0 6px 32px ${COLORS_GAME.rojo}80` : 'none',
            }}>
            PARAR
          </motion.button>

          {discards > 0 && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleDiscard}
              disabled={discardsLeft <= 0 || !canStop}
              style={{
                minWidth:     '100px',
                minHeight:    '88px',
                background:   discardsLeft > 0 && canStop
                  ? COLORS_UI.bgElevated : 'transparent',
                border:       `1px solid ${discardsLeft > 0 && canStop
                  ? COLORS_UI.border : COLORS_UI.textMuted}`,
                borderRadius: BORDERS.radius.xl,
                fontFamily:   TYPOGRAPHY.fontFamily,
                fontSize:     TYPOGRAPHY.size.sm,
                fontWeight:   TYPOGRAPHY.weight.bold,
                color:        discardsLeft > 0 && canStop
                  ? COLORS_UI.text : COLORS_UI.textMuted,
                cursor:       discardsLeft > 0 && canStop ? 'pointer' : 'default',
                letterSpacing:'0.08em',
                display:      'flex',
                flexDirection:'column',
                alignItems:   'center',
                justifyContent:'center',
                gap:          4,
              }}>
              <span>DESCARTAR</span>
              <span style={{
                fontFamily:  TYPOGRAPHY.fontFamilyMono,
                fontSize:    TYPOGRAPHY.size.xs,
                color:       COLORS_UI.textMuted,
              }}>
                {discardsLeft}/{discards}
              </span>
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}
