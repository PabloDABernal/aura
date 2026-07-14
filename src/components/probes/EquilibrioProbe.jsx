/**
 * EquilibrioProbe v4 — GDD v4.0.
 * Timer compartido (0 → totalSec). N paradas obligatorias (solo APLICAR cuenta).
 * DESCARTAR no cuenta parada, reanuda el timer.
 * Delta = último dígito de centésimas: par → +, impar → −.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  COLORS_UI, COLORS_GAME,
  TYPOGRAPHY, SPACING, BORDERS,
} from '../../styles/tokens.js';

export default function EquilibrioProbe({ config, character, onComplete }) {
  const minVal      = config.minVal     ?? 40;
  const maxVal      = config.maxVal     ?? 60;
  const initialVal  = config.initialVal ?? Math.round((minVal + maxVal) / 2);
  const cfgTaps     = config.taps       ?? 5;
  const cfgTotalSec = config.tapTimeSec ?? 10;
  const cfgDiscards = config.discards   ?? 1;
  const auraNum     = character?.auraNumber ?? null;
  const totalMs     = cfgTotalSec * 1000;

  const [phase,         setPhase]        = useState('ready');
  const [value,         setValue]        = useState(initialVal);
  const [stopsApplied,  setStopsApplied] = useState(0);
  const [elapsedMs,     setElapsedMs]    = useState(0);
  const [discards,      setDiscards]     = useState(cfgDiscards);
  const [pending,       setPending]      = useState(null);
  const [history,       setHistory]      = useState([]);

  const rafRef      = useRef(null);
  const rafStart    = useRef(0);
  const baseMs      = useRef(0);
  const phaseRef    = useRef('ready');
  const valueRef    = useRef(initialVal);
  const stopsRef    = useRef(0);
  const discardsRef = useRef(cfgDiscards);
  const auraHit     = useRef(false);
  const lastFrameMs = useRef(0);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const endProbe = useCallback((finalValue) => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    phaseRef.current = 'done';
    setPhase('done');
    const v       = finalValue ?? valueRef.current;
    const inRange = v >= minVal && v <= maxVal;
    const mid     = (minVal + maxVal) / 2;
    const result  = !inRange ? 'fail'
      : Math.abs(v - mid) <= (maxVal - minVal) * 0.2 ? 'perfect'
      : 'pass';
    setTimeout(() => onComplete({ result, auraTriggered: auraHit.current }), 800);
  }, [minVal, maxVal, onComplete]);

  const startRAF = useCallback(() => {
    rafStart.current = performance.now();
    const tick = (now) => {
      if (phaseRef.current !== 'running') return;
      const el = baseMs.current + (now - rafStart.current);
      lastFrameMs.current = el;
      if (el >= totalMs) {
        baseMs.current = totalMs;
        setElapsedMs(totalMs);
        // Time's up — fail if not enough stops
        phaseRef.current = 'reviewing-timeout';
        setPhase('done');
        setTimeout(() => onComplete({ result: 'fail', auraTriggered: auraHit.current }), 600);
        return;
      }
      setElapsedMs(el);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [totalMs, onComplete]);

  const stopRAF = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    baseMs.current = lastFrameMs.current;
  }, []);

  const handleStart = () => {
    setValue(initialVal); valueRef.current = initialVal;
    setStopsApplied(0);   stopsRef.current = 0;
    setDiscards(cfgDiscards); discardsRef.current = cfgDiscards;
    setHistory([]);
    baseMs.current = 0;
    lastFrameMs.current = 0;
    setElapsedMs(0);
    phaseRef.current = 'running';
    setPhase('running');
    startRAF();
  };

  const handleTap = () => {
    if (phaseRef.current !== 'running') return;
    stopRAF();
    const frozenMs = baseMs.current;
    const cents    = Math.floor((frozenMs % 1000) / 10);
    const digit    = cents % 10;
    const isAura   = auraNum !== null && cents === auraNum;
    if (isAura) auraHit.current = true;
    const delta  = isAura ? 0 : (digit % 2 === 0 ? +digit : -digit);
    const newVal = valueRef.current + delta;
    phaseRef.current = 'reviewing';
    setPhase('reviewing');
    setPending({ cents, digit, delta, newVal, aura: isAura });
  };

  const handleApply = () => {
    if (!pending) return;
    const newVal      = pending.newVal;
    const newStops    = stopsRef.current + 1;
    stopsRef.current  = newStops;
    valueRef.current  = newVal;
    setValue(newVal);
    setStopsApplied(newStops);
    setHistory(h => [...h, { ...pending, discarded: false }]);
    setPending(null);

    if (!pending.aura && (newVal < minVal || newVal > maxVal)) {
      endProbe(newVal);
      return;
    }
    if (newStops >= cfgTaps) {
      endProbe(newVal);
      return;
    }
    phaseRef.current = 'running';
    setPhase('running');
    startRAF();
  };

  const handleDiscard = () => {
    if (!pending || discardsRef.current <= 0) return;
    discardsRef.current -= 1;
    setDiscards(discardsRef.current);
    setHistory(h => [...h, { ...pending, discarded: true }]);
    setPending(null);
    phaseRef.current = 'running';
    setPhase('running');
    startRAF();
  };

  // ── Display ────────────────────────────────────────────────────────────────────
  const dispSec    = Math.floor(elapsedMs / 1000);
  const dispCents  = Math.floor((elapsedMs % 1000) / 10);
  const dispTime   = `${String(dispSec).padStart(2,'0')}.${String(dispCents).padStart(2,'0')}`;

  const currentCents  = dispCents;
  const currentDigit  = currentCents % 10;
  const previewDelta  = currentDigit % 2 === 0 ? +currentDigit : -currentDigit;
  const previewIsAura = auraNum !== null && currentCents === auraNum;

  const timeProgress  = elapsedMs / totalMs;
  const isLowTime     = elapsedMs > totalMs * 0.75;
  const range         = maxVal - minVal;
  const valuePct      = Math.min(100, Math.max(0, ((value - minVal) / range) * 100));
  const isNearEdge    = value - minVal <= range * 0.15 || maxVal - value <= range * 0.15;
  const valueColor    = isNearEdge ? '#FFA500' : COLORS_GAME.verde;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: SPACING[4], gap: SPACING[3], userSelect: 'none' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.textSecondary, letterSpacing: '0.08em' }}>
          EQUILIBRIO [{minVal} – {maxVal}]
        </span>
        {auraNum !== null && (
          <div style={{ padding: `2px ${SPACING[2]}`, background: auraHit.current ? 'rgba(59,168,79,0.12)' : 'rgba(255,215,0,0.08)', border: `1px solid ${auraHit.current ? 'rgba(59,168,79,0.4)' : 'rgba(255,215,0,0.3)'}`, borderRadius: BORDERS.radius.full, fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '10px', color: auraHit.current ? COLORS_GAME.verde : '#FFD700' }}>
            #{String(auraNum).padStart(2,'0')} libre{auraHit.current ? ' ✓' : ''}
          </div>
        )}
      </div>

      {/* Value + bar */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, letterSpacing: '0.1em', marginBottom: SPACING[1] }}>VALOR</div>
        <motion.div
          animate={{ scale: phase === 'reviewing' ? [1, 1.1, 1] : 1 }}
          transition={{ duration: 0.25 }}
          style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: 'clamp(52px, 15vw, 72px)', fontWeight: TYPOGRAPHY.weight.black, color: valueColor, lineHeight: 1, transition: 'color 0.2s' }}
        >
          {value}
        </motion.div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[1] }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_GAME.rojo, fontWeight: TYPOGRAPHY.weight.bold }}>{minVal}</span>
          <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_GAME.rojo, fontWeight: TYPOGRAPHY.weight.bold }}>{maxVal}</span>
        </div>
        <div style={{ position: 'relative', height: '18px', borderRadius: BORDERS.radius.full, background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(59,168,79,0.08)' }} />
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '15%', background: 'rgba(224,59,59,0.15)' }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '15%', background: 'rgba(224,59,59,0.15)' }} />
          <motion.div animate={{ left: `${valuePct}%` }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            style={{ position: 'absolute', top: '10%', bottom: '10%', width: '6px', borderRadius: BORDERS.radius.full, background: valueColor, transform: 'translateX(-50%)', boxShadow: `0 0 8px ${valueColor}99` }} />
        </div>
      </div>

      {/* Stops progress + discards */}
      {phase !== 'ready' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[3] }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            {Array.from({ length: cfgTaps }, (_, i) => {
              const applied = history.filter(h => !h.discarded)[i];
              const done    = !!applied;
              const active  = stopsRef.current === i && phase !== 'done';
              return (
                <div key={i} style={{ width: '11px', height: '11px', borderRadius: '50%', background: done ? COLORS_GAME.verde : active ? '#FFD700' : COLORS_UI.bgElevated, border: `1px solid ${done ? COLORS_GAME.verde : active ? '#FFD700' : COLORS_UI.border}`, transition: 'all 0.2s' }} />
              );
            })}
          </div>
          <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
            {stopsApplied}/{cfgTaps} paradas
          </span>
          {cfgDiscards > 0 && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px', alignItems: 'center' }}>
              {Array.from({ length: cfgDiscards }, (_, i) => (
                <div key={i} style={{ width: '10px', height: '10px', borderRadius: '2px', background: i < discards ? '#60A5FA' : COLORS_UI.bgElevated, border: `1px solid ${i < discards ? '#60A5FA66' : COLORS_UI.border}`, transition: 'background 0.2s' }} />
              ))}
              <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '9px', color: COLORS_UI.textMuted }}>desc.</span>
            </div>
          )}
        </div>
      )}

      {/* Big clock + preview */}
      {(phase === 'running' || phase === 'reviewing') && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: SPACING[2] }}>

          {/* Timer arc + number */}
          <div style={{ position: 'relative', width: '176px', height: '176px', flexShrink: 0 }}>
            {(() => {
              const SIZE = 176, R = 76, CIRC = 2 * Math.PI * R;
              const offset = CIRC * (1 - Math.min(1, timeProgress));
              const arcColor = isLowTime ? '#E03B3B' : COLORS_GAME.verde;
              return (
                <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ position: 'absolute', inset: 0 }}>
                  <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke={COLORS_UI.bgElevated} strokeWidth="9" />
                  <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none"
                    stroke={phase === 'reviewing' ? '#60A5FA' : arcColor}
                    strokeWidth="9"
                    strokeDasharray={CIRC}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${SIZE/2} ${SIZE/2})`}
                    style={{ transition: 'stroke-dashoffset 0.09s linear, stroke 0.2s' }}
                  />
                  <circle cx={SIZE/2} cy={SIZE/2} r={R - 16}
                    fill={phase === 'reviewing' ? 'rgba(96,165,250,0.08)' : 'rgba(224,59,59,0.04)'}
                  />
                </svg>
              );
            })()}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: 'clamp(28px, 8.5vw, 36px)', fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text, lineHeight: 1, letterSpacing: '0.02em' }}>
                {dispTime}
              </span>
              {phase === 'running' && (
                <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '9px', color: COLORS_UI.textMuted, letterSpacing: '0.1em', marginTop: '5px' }}>PARAR</span>
              )}
              {phase === 'reviewing' && (
                <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '9px', color: '#60A5FA', letterSpacing: '0.1em', marginTop: '5px' }}>PAUSADO</span>
              )}
            </div>
          </div>

          {/* Preview what stopping now would do */}
          {phase === 'running' && (
            <div style={{ textAlign: 'center' }}>
              {previewIsAura ? (
                <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.black, color: '#FFD700' }}>
                  .{String(currentCents).padStart(2,'0')} ✨ LIBRE
                </div>
              ) : (
                <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.black, color: previewDelta >= 0 ? COLORS_GAME.verde : COLORS_GAME.rojo }}>
                  .{String(currentCents).padStart(2,'0')} → {previewDelta >= 0 ? '+' : ''}{previewDelta}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Reviewing panel */}
      <AnimatePresence>
        {phase === 'reviewing' && pending && (
          <motion.div key={history.length}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ background: COLORS_UI.bgElevated, border: `1px solid ${pending.aura ? 'rgba(255,215,0,0.4)' : pending.delta >= 0 ? 'rgba(59,168,79,0.4)' : 'rgba(224,59,59,0.4)'}`, borderRadius: BORDERS.radius.xl, padding: SPACING[3], display: 'flex', flexDirection: 'column', gap: SPACING[2], alignItems: 'center' }}
          >
            {pending.aura ? (
              <>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.black, color: '#FFD700' }}>✨ AURA — parada libre</div>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.sm, color: 'rgba(255,215,0,0.7)' }}>
                  .{String(pending.cents).padStart(2,'0')} — sin cambio
                </div>
              </>
            ) : (
              <>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size['2xl'], fontWeight: TYPOGRAPHY.weight.black, color: pending.delta >= 0 ? COLORS_GAME.verde : COLORS_GAME.rojo }}>
                  {pending.delta >= 0 ? '+' : ''}{pending.delta}
                </div>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textMuted, textAlign: 'center' }}>
                  .{String(pending.cents).padStart(2,'0')} · dígito <strong>{pending.digit}</strong> ({pending.digit % 2 === 0 ? 'par' : 'impar'}) · → <strong style={{ color: pending.delta >= 0 ? COLORS_GAME.verde : COLORS_GAME.rojo }}>{pending.newVal}</strong>
                </div>
                {(pending.newVal < minVal || pending.newVal > maxVal) && (
                  <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_GAME.rojo, fontWeight: TYPOGRAPHY.weight.bold }}>
                    ⚠ Fuera de rango — aplicar = fallo
                  </div>
                )}
              </>
            )}

            <div style={{ display: 'flex', gap: SPACING[2], width: '100%', marginTop: SPACING[1] }}>
              {!pending.aura && discards > 0 && (
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleDiscard}
                  style={{ flex: 1, minHeight: '48px', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.35)', borderRadius: BORDERS.radius.xl, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color: '#60A5FA', cursor: 'pointer' }}>
                  DESCARTAR ({discards})
                </motion.button>
              )}
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleApply}
                style={{ flex: 2, minHeight: '48px', background: pending.aura || pending.delta >= 0 ? COLORS_GAME.verde : (pending.newVal < minVal || pending.newVal > maxVal) ? 'rgba(180,30,30,0.85)' : COLORS_GAME.rojo, border: 'none', borderRadius: BORDERS.radius.xl, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.black, color: 'white', letterSpacing: '0.1em', cursor: 'pointer' }}>
                APLICAR
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History chips */}
      {history.length > 0 && (
        <div style={{ display: 'flex', gap: SPACING[2], flexWrap: 'wrap' }}>
          {history.map((h, i) => (
            <div key={i} style={{ padding: `2px ${SPACING[2]}`, borderRadius: BORDERS.radius.md, background: h.discarded ? 'rgba(96,165,250,0.07)' : h.aura ? 'rgba(255,215,0,0.1)' : h.delta >= 0 ? 'rgba(59,168,79,0.12)' : 'rgba(224,59,59,0.12)', border: `1px solid ${h.discarded ? 'rgba(96,165,250,0.25)' : h.aura ? 'rgba(255,215,0,0.25)' : h.delta >= 0 ? 'rgba(59,168,79,0.3)' : 'rgba(224,59,59,0.3)'}`, fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: h.discarded ? '#60A5FA' : h.aura ? '#FFD700' : h.delta >= 0 ? COLORS_GAME.verde : COLORS_GAME.rojo, opacity: Math.max(0.4, 1 - i * 0.08) }}>
              {h.discarded ? `✗ .${String(h.cents).padStart(2,'0')}` : h.aura ? '★ libre' : `${h.delta >= 0 ? '+' : ''}${h.delta}→${h.newVal}`}
            </div>
          ))}
        </div>
      )}

      {/* Start button */}
      {phase === 'ready' && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleStart}
          style={{ width: '100%', minHeight: '72px', background: COLORS_GAME.verde, border: 'none', borderRadius: BORDERS.radius.xl, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: 'white', letterSpacing: '0.12em', cursor: 'pointer', boxShadow: `0 6px 28px ${COLORS_GAME.verde}60` }}>
          EMPEZAR
        </motion.button>
      )}

      {/* Tap button */}
      {phase === 'running' && (
        <motion.button whileTap={{ scale: 0.95 }} onClick={handleTap}
          style={{ width: '100%', minHeight: '88px', background: COLORS_GAME.rojo, border: 'none', borderRadius: BORDERS.radius.xl, fontFamily: TYPOGRAPHY.fontFamily, fontSize: 'clamp(22px, 6vw, 32px)', fontWeight: TYPOGRAPHY.weight.black, color: 'white', letterSpacing: '0.14em', cursor: 'pointer', boxShadow: `0 6px 32px ${COLORS_GAME.rojo}80` }}>
          PARAR
        </motion.button>
      )}
    </div>
  );
}
