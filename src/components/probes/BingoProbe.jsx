/**
 * BingoProbe v2 — GDD v3.0 §4.1 Bingo a Tiempo.
 * Circle tap: PARAR/REANUDAR manual. Visual aid bar optional (showVisualAid).
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  COLORS_UI, COLORS_GAME,
  TYPOGRAPHY, SPACING, BORDERS,
} from '../../styles/tokens.js';

// ── Target generation ──────────────────────────────────────────────────────────
function generateTargets(count, margin) {
  const minGap = margin * 2 + 3;
  const pool   = Array.from({ length: 100 }, (_, i) => i).sort(() => Math.random() - 0.5);
  const picked = [];
  for (const v of pool) {
    if (picked.every(s => Math.abs(s - v) >= minGap)) picked.push(v);
    if (picked.length === count) break;
  }
  while (picked.length < count) {
    const fb = pool.find(x => !picked.includes(x)) ?? picked.length;
    picked.push(fb);
  }
  return picked.map(v => ({ value: v, hit: false }));
}

// ── Sliding window bar (canvas) — only shown when showVisualAid ────────────────
function SlidingWindowBar({ currentTimeSec, pendingTargets, auraNumber, margin }) {
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
    const winStart  = currentTimeSec - windowSec / 2;
    const toX       = t => (t - winStart) * px;

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
      for (const t of pendingTargets) {
        const tx = toX(s + t.value / 100);
        if (tx < -20 || tx > W + 20) continue;
        const zw = (margin / 100) * px * 2;
        ctx.fillStyle = 'rgba(59,168,79,0.2)';
        ctx.fillRect(tx - zw / 2, 0, zw, H);
        ctx.fillStyle = '#3BA84F';
        ctx.fillRect(Math.round(tx) - 1, H * 0.12, 2, H * 0.76);
      }
      if (auraNumber != null && auraNumber >= 0 && auraNumber <= 99) {
        const ax = toX(s + auraNumber / 100);
        if (ax >= -4 && ax <= W + 4) {
          ctx.shadowColor = '#FFD700';
          ctx.shadowBlur  = 6;
          ctx.fillStyle   = '#FFD700';
          ctx.fillRect(Math.round(ax) - 1, 0, 2, H);
          ctx.shadowBlur  = 0;
        }
      }
    }
    ctx.fillStyle   = 'rgba(255,255,255,0.85)';
    ctx.shadowColor = 'rgba(255,255,255,0.6)';
    ctx.shadowBlur  = 6;
    ctx.fillRect(Math.round(W / 2) - 1.5, 0, 3, H);
    ctx.shadowBlur  = 0;
  }, [currentTimeSec, pendingTargets, auraNumber, margin]);

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

// ── Circle button — PARAR when running, REANUDAR when frozen ───────────────────
function CircleButton({ dispTime, timeProgress, phase, onStop, onResume, shaking }) {
  const isRunning = phase === 'running';
  const isFrozen  = phase === 'frozen';
  const SIZE  = 176;
  const R     = 76;
  const CIRC  = 2 * Math.PI * R;
  const offset = CIRC * (1 - Math.max(0, Math.min(1, timeProgress)));

  const arcColor =
    timeProgress < 0.2  ? '#E03B3B' :
    timeProgress < 0.45 ? '#F59E0B' :
    COLORS_GAME.verde;

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
            isFrozen  ? 'rgba(96,165,250,0.1)' :
            isRunning ? 'rgba(224,59,59,0.07)' :
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
export default function BingoProbe({ config, character, onComplete }) {
  const cfgTargets     = config.targets      ?? 5;
  const cfgMargin      = config.margin       ?? 2;
  const cfgTimeLimitMs = (config.timeLimit ?? config.timeLimitSec ?? 20) * 1000;
  const cfgMaxStops    = config.maxStops     ?? 20;
  const cfgBonusExact  = config.bonusOnExact ?? 5;
  const cfgAuraBonus   = config.auraBonus    ?? 5;
  const cfgShowAid     = config.showVisualAid ?? false;

  const [targetList,   setTargetList]  = useState(() => generateTargets(cfgTargets, cfgMargin));
  const [phase,        setPhase]       = useState('ready');
  const [stopsLeft,    setStopsLeft]   = useState(cfgMaxStops);
  const [elapsedMs,    setElapsedMs]   = useState(0);
  const [timeLimitMs,  setTimeLimitMs] = useState(cfgTimeLimitMs);
  const [feedbacks,    setFeedbacks]   = useState([]);
  const [feedKey,      setFeedKey]     = useState(0);
  const [shaking,      setShaking]     = useState(false);
  const [auraBanner,   setAuraBanner]  = useState(null); // persistent Aura notification

  const rafRef         = useRef(null);
  const rafStartRef    = useRef(0);
  const baseRef        = useRef(0);
  const lastFrameRef   = useRef(0); // elapsed at last rendered frame — used for stop evaluation
  const maxMsRef       = useRef(cfgTimeLimitMs);
  const targetRef      = useRef(targetList);
  const stopsRef       = useRef(cfgMaxStops);
  const phaseRef       = useRef('ready');
  const auraHitRef     = useRef(false);
  const perfectHitsRef = useRef(0);

  useEffect(() => { targetRef.current = targetList; }, [targetList]);
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const endProbe = useCallback(() => {
    phaseRef.current = 'done';
    setPhase('done');
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    const allHit  = targetRef.current.every(t => t.hit);
    const hitCount = targetRef.current.filter(t => t.hit).length;
    let res = 'fail';
    if (allHit && hitCount > 0) {
      res = perfectHitsRef.current >= hitCount ? 'perfect' : 'pass';
    }
    setTimeout(() => onComplete({ result: res, auraTriggered: auraHitRef.current }), 750);
  }, [onComplete]);

  const startRAF = useCallback(() => {
    rafStartRef.current = performance.now();
    const tick = (now) => {
      const el = baseRef.current + (now - rafStartRef.current);
      if (el >= maxMsRef.current) {
        baseRef.current  = maxMsRef.current;
        lastFrameRef.current = maxMsRef.current;
        setElapsedMs(maxMsRef.current);
        endProbe();
        return;
      }
      lastFrameRef.current = el; // sync with what the screen shows
      setElapsedMs(el);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [endProbe]);

  const stopRAF = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      baseRef.current = lastFrameRef.current; // freeze at last rendered frame, not performance.now()
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
    setAuraBanner(null);
    phaseRef.current = 'running';
    setPhase('running');
    startRAF();
  }, [startRAF]);

  const handleStop = useCallback(() => {
    if (phaseRef.current !== 'running') return;
    stopRAF();
    phaseRef.current = 'frozen';
    setPhase('frozen');

    const frozenMs = baseRef.current;
    const cents    = Math.floor((frozenMs % 1000) / 10);
    const auraNum  = character?.auraNumber;

    const newFb = [];
    let hitAny = false;

    // Aura check — usa el mismo margen que los objetivos
    if (auraNum != null && Math.abs(cents - auraNum) <= cfgMargin) {
      auraHitRef.current = true;
      stopsRef.current  += cfgAuraBonus;
      setStopsLeft(s => s + cfgAuraBonus);
      setAuraBanner(`✨ AURA .${String(cents).padStart(2,'0')} → +${cfgAuraBonus} paradas`);
    }

    // Target check
    let newTargets = targetRef.current.map(t => ({ ...t }));
    for (const t of targetRef.current.filter(t => !t.hit)) {
      const diff = Math.abs(cents - t.value);
      if (diff <= cfgMargin) {
        newTargets = newTargets.map(x => x.value === t.value ? { ...x, hit: true } : x);
        hitAny = true;
        if (diff <= cfgMargin * 0.5) perfectHitsRef.current += 1;
        if (diff === 0) {
          maxMsRef.current += cfgBonusExact * 1000;
          setTimeLimitMs(m => m + cfgBonusExact * 1000);
          newFb.push({ id: 'exact', text: `⚡ EXACTO +${cfgBonusExact}s` });
        }
        newFb.push({ id: `hit-${t.value}`, text: `✓ ${String(t.value).padStart(2,'0')}!` });
      }
    }
    targetRef.current = newTargets;
    setTargetList(newTargets);

    if (hitAny) {
      setAuraBanner(null);
    } else {
      setShaking(true);
      setTimeout(() => setShaking(false), 450);
      newFb.push({ id: 'miss', text: `.${String(cents).padStart(2,'0')}` });
    }

    stopsRef.current -= 1;
    setStopsLeft(stopsRef.current);
    setFeedbacks(newFb);
    setFeedKey(k => k + 1);

    if (newTargets.every(t => t.hit)) { endProbe(); return; }
    if (stopsRef.current <= 0)        { endProbe(); return; }
    // NO auto-resume — jugador toca de nuevo para reanudar
  }, [cfgMargin, cfgAuraBonus, cfgBonusExact, character, stopRAF, endProbe]);

  // ── Display ──────────────────────────────────────────────────────────────────
  const timeLeftMs    = Math.max(0, timeLimitMs - elapsedMs);
  const timeProgress  = timeLimitMs > 0 ? timeLeftMs / timeLimitMs : 0;
  const dispSecs      = Math.floor(elapsedMs / 1000);
  const dispCents     = Math.floor((elapsedMs % 1000) / 10);
  const dispTime      = `${String(dispSecs).padStart(2,'0')}.${String(dispCents).padStart(2,'0')}`;
  const timeLeftCeil  = Math.ceil(timeLeftMs / 1000);
  const pendingTargets= targetList.filter(t => !t.hit);
  const currentSec    = elapsedMs / 1000;
  const isRunning     = phase === 'running';
  const isLowTime     = timeLeftMs < 5000 && phase !== 'ready' && phase !== 'done';
  const isLowStops    = stopsLeft <= 3;

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      padding: SPACING[4], gap: SPACING[3], userSelect: 'none',
    }}>

      {/* Contador tiempo + paradas */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <motion.span
            animate={{ color: isLowTime ? '#E03B3B' : '#F0F0F5' }}
            transition={{ duration: 0.3 }}
            style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: 'clamp(38px, 11vw, 52px)', fontWeight: TYPOGRAPHY.weight.black, lineHeight: 1 }}
          >
            {timeLeftCeil}
          </motion.span>
          <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, letterSpacing: '0.09em' }}>
            SEGUNDOS
          </span>
        </div>

        {/* Aura indicator — always visible */}
        {character?.auraNumber != null && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: 'clamp(28px, 8vw, 38px)', fontWeight: TYPOGRAPHY.weight.black, lineHeight: 1, color: auraHitRef.current ? '#3BA84F' : '#FFD700' }}>
              .{String(character.auraNumber).padStart(2,'0')}
            </span>
            <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, letterSpacing: '0.09em' }}>
              {auraHitRef.current ? '✅ AURA' : '✨ AURA'}
            </span>
            <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '9px', color: 'rgba(255,215,0,0.6)', letterSpacing: '0.06em', marginTop: '1px' }}>
              +{cfgAuraBonus} paradas
            </span>
          </div>
        )}

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

      {/* Banner Aura persistente — visible mientras frozen */}
      <AnimatePresence>
        {auraBanner && (
          <motion.div
            key="aura-banner"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            style={{
              background:    'rgba(255,215,0,0.12)',
              border:        '1px solid rgba(255,215,0,0.5)',
              borderRadius:  BORDERS.radius.lg,
              padding:       `${SPACING[2]} ${SPACING[4]}`,
              textAlign:     'center',
              fontFamily:    TYPOGRAPHY.fontFamily,
              fontSize:      TYPOGRAPHY.size.md,
              fontWeight:    TYPOGRAPHY.weight.bold,
              color:         '#FFD700',
              textShadow:    '0 0 16px #FFD70066',
              letterSpacing: '0.04em',
            }}
          >
            {auraBanner}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid objetivos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: SPACING[2] }}>
        {targetList.map(t => {
          const lo = Math.max(0,  t.value - cfgMargin);
          const hi = Math.min(99, t.value + cfgMargin);
          return (
            <motion.div
              key={t.value}
              animate={t.hit ? { scale: [1, 1.18, 1] } : {}}
              transition={{ duration: 0.3 }}
              style={{
                background:    t.hit ? 'rgba(59,168,79,0.18)' : COLORS_UI.bgElevated,
                border:        t.hit ? '2px solid #3BA84F' : `1px solid ${COLORS_UI.border}`,
                borderRadius:  BORDERS.radius.lg,
                padding:       `${SPACING[2]} 0`,
                display:       'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                opacity:       t.hit ? 0.5 : 1,
                transition:    'background 0.25s, border-color 0.25s, opacity 0.3s',
              }}
            >
              <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: t.hit ? '#3BA84F' : COLORS_UI.text, lineHeight: 1 }}>
                {t.hit ? '✓' : String(t.value).padStart(2,'0')}
              </span>
              {!t.hit && (
                <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '10px', color: COLORS_UI.textMuted, letterSpacing: '0.02em' }}>
                  {String(lo).padStart(2,'0')}–{String(hi).padStart(2,'0')}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Círculo PARAR/REANUDAR */}
      {phase !== 'ready' && (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', minHeight: '180px' }}>
          <CircleButton
            dispTime={dispTime}
            timeProgress={timeProgress}
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
                  top: fb.id === 'aura' ? '5%' : fb.id === 'exact' ? '14%' : fb.id === 'miss' ? '35%' : '22%',
                  left: '50%', transform: 'translateX(-50%)',
                  fontFamily: TYPOGRAPHY.fontFamily,
                  fontSize: fb.id === 'aura' || fb.id === 'exact' ? TYPOGRAPHY.size.md : TYPOGRAPHY.size.sm,
                  fontWeight: TYPOGRAPHY.weight.bold,
                  color: fb.id === 'aura' ? '#FFD700' : fb.id === 'exact' ? '#60A5FA' : fb.id === 'miss' ? COLORS_UI.textMuted : '#3BA84F',
                  textShadow: fb.id === 'aura' ? '0 0 14px #FFD70099' : fb.id === 'exact' ? '0 0 10px #60A5FA66' : 'none',
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
            VENTANA 5s{character?.auraNumber != null ? ` · ✨ .${String(character.auraNumber).padStart(2,'0')} Aura` : ''}
          </span>
          <SlidingWindowBar
            currentTimeSec={currentSec}
            pendingTargets={pendingTargets}
            auraNumber={character?.auraNumber ?? null}
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
