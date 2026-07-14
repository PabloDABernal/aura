/**
 * EspejoProbe v2 — GDD v3.0 §4.2 Espejo a Tiempo.
 * Countdown circle-tap manual (PARAR/REANUDAR). Visual aid bar optional.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  COLORS_UI, COLORS_GAME,
  TYPOGRAPHY, SPACING, BORDERS,
} from '../../styles/tokens.js';

// ── Sliding window bar right-to-left (countdown) ───────────────────────────────
function EspejoBar({ displaySec, target, margin }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = Math.max(1, canvas.getBoundingClientRect().width || 340);
    const H = 48;
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    const windowSec = 5;
    const px        = W / windowSec;
    const winStart  = displaySec - windowSec / 2;
    const toX       = t => W - (t - winStart) * px; // reversed

    ctx.fillStyle = '#111118';
    ctx.fillRect(0, 0, W, H);

    const s0 = Math.floor(winStart) - 1;
    const s1 = s0 + windowSec + 3;

    for (let s = s0; s <= s1; s++) {
      if (s < 0) continue;
      const sx = toX(s);
      if (sx >= 0 && sx <= W) {
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(Math.round(sx), 0, 1, H);
      }
      const tx = toX(s + target / 100);
      if (tx >= -20 && tx <= W + 20) {
        const zw = (margin / 100) * px * 2;
        ctx.fillStyle = 'rgba(255,215,0,0.18)';
        ctx.fillRect(tx - zw / 2, 0, zw, H);
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur  = 5;
        ctx.fillStyle   = '#FFD700';
        ctx.fillRect(Math.round(tx) - 1, H * 0.12, 2, H * 0.76);
        ctx.shadowBlur  = 0;
      }
    }

    ctx.fillStyle   = 'rgba(255,255,255,0.85)';
    ctx.shadowColor = 'rgba(255,255,255,0.6)';
    ctx.shadowBlur  = 6;
    ctx.fillRect(Math.round(W / 2) - 1.5, 0, 3, H);
    ctx.shadowBlur  = 0;
  }, [displaySec, target, margin]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block', width: '100%', height: '48px',
        borderRadius: BORDERS.radius.lg, border: `1px solid ${COLORS_UI.border}`,
      }}
    />
  );
}

// ── Circle button — arc fills as time passes, PARAR/REANUDAR ──────────────────
function EspejoCircle({ dispTime, fillProgress, phase, onStop, onResume, shaking }) {
  const isRunning = phase === 'running';
  const isFrozen  = phase === 'frozen';
  const SIZE  = 176;
  const R     = 76;
  const CIRC  = 2 * Math.PI * R;
  const offset = CIRC * (1 - Math.max(0, Math.min(1, fillProgress)));

  const arcColor =
    fillProgress > 0.8  ? '#E03B3B' :
    fillProgress > 0.55 ? '#F59E0B' :
    '#FFD700';

  const handleClick = isRunning ? onStop : isFrozen ? onResume : undefined;

  return (
    <motion.div
      animate={shaking ? { x: [0, -10, 10, -8, 8, -5, 5, 0] } : {}}
      transition={{ duration: 0.4 }}
      onClick={handleClick}
      style={{
        position:   'relative',
        width:      SIZE,
        height:     SIZE,
        cursor:     (isRunning || isFrozen) ? 'pointer' : 'default',
        flexShrink: 0,
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <svg
        width={SIZE} height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ position: 'absolute', inset: 0 }}
      >
        <circle cx={SIZE/2} cy={SIZE/2} r={R}
          fill="none" stroke={COLORS_UI.bgElevated} strokeWidth="9" />
        <circle cx={SIZE/2} cy={SIZE/2} r={R}
          fill="none"
          stroke={isFrozen ? '#60A5FA' : arcColor}
          strokeWidth="9"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${SIZE/2} ${SIZE/2})`}
          style={{ transition: 'stroke-dashoffset 0.09s linear, stroke 0.2s' }}
        />
        <circle cx={SIZE/2} cy={SIZE/2} r={R - 16}
          fill={
            isFrozen  ? 'rgba(96,165,250,0.1)'  :
            isRunning ? 'rgba(255,215,0,0.05)'  :
            COLORS_UI.bgCard
          }
          style={{ transition: 'fill 0.2s' }}
        />
      </svg>

      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <span style={{
          fontFamily: TYPOGRAPHY.fontFamilyMono,
          fontSize:   'clamp(28px, 8.5vw, 38px)',
          fontWeight: TYPOGRAPHY.weight.black,
          color:      COLORS_UI.text,
          lineHeight: 1, letterSpacing: '0.02em',
        }}>
          {dispTime}
        </span>
        {(isRunning || isFrozen) && (
          <span style={{
            fontFamily:    TYPOGRAPHY.fontFamily,
            fontSize:      '9px',
            color:         isFrozen ? '#60A5FA' : COLORS_UI.textMuted,
            letterSpacing: '0.1em',
            marginTop:     '5px',
            transition:    'color 0.2s',
          }}>
            {isRunning ? 'PARAR' : 'REANUDAR'}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ── Probe principal ────────────────────────────────────────────────────────────
export default function EspejoProbe({ config, character, onComplete }) {
  const cfgDuration     = (config.duration  ?? 10) * 1000;
  const cfgMargin       = config.margin       ?? 3;
  const cfgRequiredHits = config.requiredHits ?? 1;
  const cfgShowAid      = config.showVisualAid ?? false;

  const auraNumber  = character?.auraNumber ?? 0;
  const cfgMaxStops = (config.maxStops ?? 10) - (auraNumber === 0 ? 2 : 0);

  const [phase,     setPhase]     = useState('ready');
  const [stopsLeft, setStopsLeft] = useState(cfgMaxStops);
  const [hits,      setHits]      = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedKey,   setFeedKey]   = useState(0);
  const [shaking,   setShaking]   = useState(false);

  const rafRef         = useRef(null);
  const rafStartRef    = useRef(0);
  const baseRef        = useRef(0);
  const lastFrameRef   = useRef(0);
  const phaseRef       = useRef('ready');
  const stopsRef       = useRef(cfgMaxStops);
  const hitsRef        = useRef(0);
  const perfectHitsRef = useRef(0);
  const auraHitRef     = useRef(false);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const endProbe = useCallback(() => {
    phaseRef.current = 'done';
    setPhase('done');
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    const enough = hitsRef.current >= cfgRequiredHits;
    let res = 'fail';
    if (enough) {
      res = perfectHitsRef.current >= cfgRequiredHits ? 'perfect' : 'pass';
    }
    setTimeout(() => onComplete({ result: res, auraTriggered: auraHitRef.current }), 750);
  }, [onComplete, cfgRequiredHits]);

  const startRAF = useCallback(() => {
    rafStartRef.current = performance.now();
    const tick = (now) => {
      const el = baseRef.current + (now - rafStartRef.current);
      if (el >= cfgDuration) {
        baseRef.current      = cfgDuration;
        lastFrameRef.current = cfgDuration;
        setElapsedMs(cfgDuration);
        endProbe();
        return;
      }
      lastFrameRef.current = el;
      setElapsedMs(el);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [cfgDuration, cfgRequiredHits, endProbe]);

  const stopRAF = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      baseRef.current = lastFrameRef.current;
    }
  }, []);

  const handleStart = () => {
    phaseRef.current = 'running';
    setPhase('running');
    startRAF();
  };

  const handleResume = useCallback(() => {
    if (phaseRef.current !== 'frozen') return;
    setFeedbacks([]);
    phaseRef.current = 'running';
    setPhase('running');
    startRAF();
  }, [startRAF]);

  const handleStop = useCallback(() => {
    if (phaseRef.current !== 'running') return;
    stopRAF();
    phaseRef.current = 'frozen';
    setPhase('frozen');

    const frozenMs     = baseRef.current;
    const displayMs    = Math.max(0, cfgDuration - frozenMs);
    const displayCents = Math.floor((displayMs % 1000) / 10);

    const diff  = Math.abs(displayCents - auraNumber);
    const isHit = diff <= cfgMargin;
    const newFb = [];

    if (isHit) {
      auraHitRef.current = true;
      hitsRef.current   += 1;
      if (diff <= cfgMargin * 0.5) perfectHitsRef.current += 1;
      setHits(hitsRef.current);
      newFb.push({ id: 'hit', text: `✓ .${String(auraNumber).padStart(2,'0')} conseguido!` });
    } else {
      setShaking(true);
      setTimeout(() => setShaking(false), 450);
      newFb.push({ id: 'miss', text: `.${String(displayCents).padStart(2,'0')}` });
    }

    stopsRef.current -= 1;
    setStopsLeft(stopsRef.current);
    setFeedbacks(newFb);
    setFeedKey(k => k + 1);

    if (hitsRef.current >= cfgRequiredHits) { endProbe(); return; }
    if (stopsRef.current <= 0)              { endProbe(); return; }
    // NO auto-resume
  }, [cfgDuration, cfgMargin, auraNumber, cfgRequiredHits, stopRAF, endProbe]);

  // ── Display ──────────────────────────────────────────────────────────────────
  const displayMs    = Math.max(0, cfgDuration - elapsedMs);
  const dispSecs     = Math.floor(displayMs / 1000);
  const dispCents    = Math.floor((displayMs % 1000) / 10);
  const dispTime     = `${String(dispSecs).padStart(2,'0')}.${String(dispCents).padStart(2,'0')}`;
  const fillProgress = cfgDuration > 0 ? elapsedMs / cfgDuration : 0;
  const displaySec   = displayMs / 1000;
  const isLowTime    = displayMs < 3000 && phase !== 'ready' && phase !== 'done';
  const isLowStops   = stopsLeft <= 2;
  const targetStr    = `.${String(auraNumber).padStart(2,'0')}`;
  const rangeStr     = `±${cfgMargin} cs → .${String(Math.max(0, auraNumber - cfgMargin)).padStart(2,'0')}–.${String(Math.min(99, auraNumber + cfgMargin)).padStart(2,'0')}`;

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      padding: SPACING[4], gap: SPACING[3], userSelect: 'none',
    }}>

      {/* Contador tiempo + aciertos + paradas */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <motion.span
            animate={{ color: isLowTime ? '#E03B3B' : '#F0F0F5' }}
            transition={{ duration: 0.3 }}
            style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: 'clamp(38px, 11vw, 52px)', fontWeight: TYPOGRAPHY.weight.black, lineHeight: 1 }}
          >
            {dispSecs}
          </motion.span>
          <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, letterSpacing: '0.09em' }}>
            SEGUNDOS
          </span>
        </div>

        <div style={{ display: 'flex', gap: SPACING[4], alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: 'clamp(28px, 8vw, 38px)', fontWeight: TYPOGRAPHY.weight.black, lineHeight: 1, color: hits > 0 ? '#FFD700' : COLORS_UI.textMuted, transition: 'color 0.3s' }}>
              {hits}/{cfgRequiredHits}
            </span>
            <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, letterSpacing: '0.09em' }}>
              ACIERTOS
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <motion.span
              animate={{ color: isLowStops ? '#E03B3B' : '#F0F0F5' }}
              transition={{ duration: 0.3 }}
              style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: 'clamp(38px, 11vw, 52px)', fontWeight: TYPOGRAPHY.weight.black, lineHeight: 1 }}
            >
              {stopsLeft}
            </motion.span>
            <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, letterSpacing: '0.09em' }}>
              ⚡ PARADAS
            </span>
          </div>
        </div>
      </div>

      {/* Objetivo */}
      <div style={{ background: COLORS_UI.bgElevated, border: `1px solid rgba(255,215,0,0.25)`, borderRadius: BORDERS.radius.xl, padding: `${SPACING[3]} ${SPACING[5]}`, textAlign: 'center' }}>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textMuted, letterSpacing: '0.1em', marginBottom: SPACING[1] }}>PARA EN</div>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size['2xl'], fontWeight: TYPOGRAPHY.weight.black, color: '#FFD700', letterSpacing: '0.04em' }}>{targetStr}</div>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, marginTop: SPACING[1] }}>{rangeStr}</div>
      </div>

      {/* Círculo */}
      {phase !== 'ready' && (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', minHeight: '180px' }}>
          <EspejoCircle
            dispTime={dispTime}
            fillProgress={fillProgress}
            phase={phase}
            onStop={handleStop}
            onResume={handleResume}
            shaking={shaking}
          />
          <AnimatePresence>
            {feedbacks.map((fb, idx) => (
              <motion.div
                key={`${feedKey}-${fb.id}`}
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 0, y: -50 }}
                exit={{}}
                transition={{ duration: 0.9, delay: idx * 0.05 }}
                style={{
                  position: 'absolute',
                  top: fb.id === 'hit' ? '15%' : '38%',
                  left: '50%', transform: 'translateX(-50%)',
                  fontFamily: TYPOGRAPHY.fontFamily,
                  fontSize: fb.id === 'hit' ? TYPOGRAPHY.size.md : TYPOGRAPHY.size.sm,
                  fontWeight: TYPOGRAPHY.weight.bold,
                  color: fb.id === 'hit' ? '#FFD700' : COLORS_UI.textMuted,
                  textShadow: fb.id === 'hit' ? '0 0 14px #FFD70099' : 'none',
                  whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 10,
                }}
              >
                {fb.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Barra visual (solo si showVisualAid) */}
      {phase !== 'ready' && cfgShowAid && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[1] }}>
          <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '9px', color: COLORS_UI.textMuted, letterSpacing: '0.08em' }}>
            VENTANA 5s · objetivo en {targetStr}
          </span>
          <EspejoBar
            displaySec={displaySec}
            target={auraNumber}
            margin={cfgMargin}
          />
        </div>
      )}

      {/* EMPEZAR */}
      {phase === 'ready' && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleStart}
          style={{
            width: '100%', minHeight: '72px', background: COLORS_GAME.verde,
            border: 'none', borderRadius: BORDERS.radius.xl,
            fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl,
            fontWeight: TYPOGRAPHY.weight.black, color: 'white',
            letterSpacing: '0.12em', cursor: 'pointer',
            boxShadow: `0 6px 28px ${COLORS_GAME.verde}60`,
          }}
        >
          EMPEZAR
        </motion.button>
      )}
    </div>
  );
}
