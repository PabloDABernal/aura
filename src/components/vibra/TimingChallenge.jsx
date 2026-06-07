import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveVibra, getMarginSides, getDynamicMargin } from '../../engine/combat/vibra';
import {
  COLORS_UI, COLORS_GAME,
  TYPOGRAPHY, SPACING, BORDERS,
} from '../../styles/tokens';

// ─── constantes ────────────────────────────────────────────────────────────

const REVEAL_DEFAULTS = {
  segundosUntil:   0,    // centésimas desde el inicio (sin fase de segundos)
  centesimasUntil: 4,    // (reservado para futuras fases)
  separatorsFrom:  3,    // desde aquí: separadores de segundos en la barra
  markFrom:        9,    // desde aquí: marca sutil amarilla (requiere showMark=true)
  hideMark:        true, // la marca NO aparece por defecto. Solo con showMark=true prop
  hideSeparators:  false,
  hideCentesimas:  false, // modificador especial: solo décimas siempre (no es una fase)
  soloBar:         false, // número nunca visible. Separadores aparecen en timeLimit-3s
};

const ZONE_COLOR = {
  pifia: '#130008',
  fail:  '#6B1010',
  vibra: '#135A20',
  flow:  '#C8A800',
};

const RESULT_META = {
  flow:    { label: 'FLOW',    color: '#FFD700', glow: 'rgba(255,215,0,0.35)'   },
  vibra:   { label: 'VIBRA',   color: '#3BA84F', glow: 'rgba(59,168,79,0.3)'   },
  fail:    { label: 'FALLO',   color: '#E0823B', glow: 'rgba(224,130,59,0.25)' },
  pifia:   { label: 'PIFIA',   color: '#E03B3B', glow: 'rgba(224,59,59,0.3)'   },
  timeout: { label: 'TIMEOUT', color: '#AA3333', glow: 'rgba(224,59,59,0.2)'   },
};

// ─── helpers ───────────────────────────────────────────────────────────────

function mergeReveal(reveal) {
  return { ...REVEAL_DEFAULTS, ...(reveal ?? {}) };
}

/** Segmentos de colores para la barra (solo se muestran AL PARAR). */
function buildSegments(mode, target, attribute, marginSide, pifiaMargin, totalSecs) {
  const totalMs = totalSecs * 1000;
  const segs = [];
  const pct = (ms) => (ms / totalMs) * 100;
  const { before, after } = getMarginSides(attribute, marginSide);

  if (mode === 'centesimas') {
    for (let s = 0; s < totalSecs; s++) {
      const base      = s * 1000;
      const flowLocal = target * 10;
      const vibraLow  = Math.max(0, (target - before)) * 10;
      const vibraHigh = Math.min(990, (target + after) * 10);
      const failLow   = Math.max(0, (target - before - pifiaMargin)) * 10;
      const failHigh  = Math.min(990, (target + after + pifiaMargin) * 10);
      const flowEnd   = Math.min(990, flowLocal + 10);

      if (failLow > 0)
        segs.push({ left: pct(base),              width: pct(failLow),              color: 'pifia' });
      if (vibraLow > failLow)
        segs.push({ left: pct(base + failLow),    width: pct(vibraLow - failLow),   color: 'fail'  });
      if (flowLocal > vibraLow)
        segs.push({ left: pct(base + vibraLow),   width: pct(flowLocal - vibraLow), color: 'vibra' });
      segs.push({   left: pct(base + flowLocal),  width: Math.max(0.3, pct(10)),    color: 'flow'  });
      if (vibraHigh > flowEnd)
        segs.push({ left: pct(base + flowEnd),    width: pct(vibraHigh - flowEnd),  color: 'vibra' });
      if (failHigh > vibraHigh)
        segs.push({ left: pct(base + vibraHigh),  width: pct(failHigh - vibraHigh), color: 'fail'  });
      if (failHigh < 990)
        segs.push({ left: pct(base + failHigh),   width: pct(990 - failHigh),       color: 'pifia' });
    }
  } else {
    const vibraLow  = Math.max(0,       target - before * 10);
    const vibraHigh = Math.min(totalMs, target + after  * 10);
    const failLow   = Math.max(0,       target - (before + pifiaMargin) * 10);
    const failHigh  = Math.min(totalMs, target + (after  + pifiaMargin) * 10);
    const flowEnd   = target + 10;

    if (failLow > 0)          segs.push({ left: 0,              width: pct(failLow),              color: 'pifia' });
    if (vibraLow > failLow)   segs.push({ left: pct(failLow),   width: pct(vibraLow - failLow),   color: 'fail'  });
    if (target > vibraLow)    segs.push({ left: pct(vibraLow),  width: pct(target - vibraLow),    color: 'vibra' });
    segs.push({                           left: pct(target),     width: Math.max(0.3, pct(10)),    color: 'flow'  });
    if (vibraHigh > flowEnd)  segs.push({ left: pct(flowEnd),   width: pct(vibraHigh - flowEnd),  color: 'vibra' });
    if (failHigh > vibraHigh) segs.push({ left: pct(vibraHigh), width: pct(failHigh - vibraHigh), color: 'fail'  });
    if (failHigh < totalMs)   segs.push({ left: pct(failHigh),  width: pct(totalMs - failHigh),   color: 'pifia' });
  }
  return segs;
}

/** Posiciones (%) de las marcas sutiles durante la cuenta. */
function getMarkPositions(mode, target, totalMs) {
  if (mode === 'centesimas') {
    const secs = totalMs / 1000;
    return Array.from({ length: secs }, (_, s) =>
      ((s * 1000 + target * 10) / totalMs) * 100
    );
  }
  return [(target / totalMs) * 100];
}

/** Precisión del display según fase y umbrales. */
function getPrecision(elapsedMs, phase, mode, rv) {
  if (phase !== 'running') return 'centesimas';
  if (mode !== 'centesimas') return 'centesimas';
  if (rv.hideCentesimas) return 'decimas';      // modificador especial: siempre décimas
  const sec = elapsedMs / 1000;
  if (sec < rv.segundosUntil) return 'segundos'; // fase inicial: solo entero
  return 'centesimas';
}

function formatMs(ms, precision) {
  const secs = Math.floor(ms / 1000);
  if (precision === 'segundos') return `${secs}`;
  if (precision === 'decimas') {
    return `${secs}.${Math.floor((ms % 1000) / 100)}`;
  }
  const cents = Math.floor((ms % 1000) / 10);
  return `${secs}.${cents.toString().padStart(2, '0')}`;
}

/**
 * ¿Deben mostrarse los separadores de segundo en la barra ahora?
 * - centesimas: desde rv.separatorsFrom segundos
 * - punto: en el último segundo antes del objetivo
 * - soloBar: solo en el último segundo antes de timeLimit
 * - hideSeparators: nunca
 * - result: siempre (para ver zonas claramente)
 */
function shouldShowSeparators(elapsedMs, phase, mode, rv, target, totalMs) {
  if (rv.hideSeparators) return false;
  if (phase === 'result') return true;
  if (rv.soloBar) return elapsedMs >= totalMs - 3000; // últimos 3s del timeLimit
  if (mode === 'centesimas') return elapsedMs >= rv.separatorsFrom * 1000;
  // punto: desde 1 segundo antes del target hasta el final
  return elapsedMs >= Math.max(0, target - 1000);
}

/**
 * ¿Debe mostrarse la marca sutil ahora?
 * Requiere showMark=true prop (habilidad activa del personaje).
 * hideMark en reveal es supresor forzado (modificador de corrupto/lugar).
 * Condición: elapsed >= markFrom * 1000 (por defecto markFrom=9 → último segundo de 10s).
 */
function shouldShowMark(elapsedMs, phase, mode, rv, target, showMarkProp) {
  if (phase !== 'running') return false;
  if (!showMarkProp) return false;   // requiere habilidad activa del personaje
  if (rv.hideMark) return false;     // supresor del corrupto/lugar
  if (rv.soloBar) return false;
  const thresholdMs = rv.markFrom * 1000;
  // DEBUG (eliminar cuando esté confirmado)
  // console.log('[TimingChallenge] shouldShowMark', { elapsedMs, thresholdMs, markFrom: rv.markFrom, showMarkProp });
  if (mode === 'centesimas') return elapsedMs >= thresholdMs;
  // punto: visible desde el inicio si el personaje tiene la habilidad
  return true;
}

// ─── componente ────────────────────────────────────────────────────────────

/**
 * TimingChallenge — el cronómetro central de Aura.
 * Props (SDD sección 5.2):
 *   mode, target, attribute, marginSide, pifiaMargin, timeLimit,
 *   reveal, showMark, actionLabel, actionContext, ecoModifiers,
 *   baseDamage, onResult
 */
export default function TimingChallenge({
  mode           = 'centesimas',
  target,
  attribute,                          // atributo del personaje (Presencia o Influencia)
  marginSide     = 'both',
  pifiaMargin    = 20,
  timeLimit:     timeLimitProp,
  reveal:        revealProp,
  showMark:      showMarkProp = false, // punto: true si personaje tiene habilidad de marca activa
  actionLabel    = 'CONFRONTAR',
  actionContext  = '',
  ecoModifiers   = [],
  baseDamage     = 1,
  failDamage     = 0,
  actionType     = 'confront',
  onResult,
}) {
  const rv        = useMemo(() => mergeReveal(revealProp), [revealProp]);
  const timeLimit = timeLimitProp ?? (mode === 'centesimas' ? 10 : 7);
  const totalMs   = timeLimit * 1000;

  const [phase,       setPhase]      = useState('ready');
  const [displayMs,   setDisplayMs]  = useState(0);
  const [vibraResult, setResult]     = useState(null);
  const [liveMargin,  setLiveMargin] = useState(2); // crece dinámicamente en rAF

  const rafRef        = useRef(null);
  const startRef      = useRef(null);
  const elapsedRef    = useRef(0);
  const marginRef     = useRef(2);  // margen al instante de parar
  const phaseRef      = useRef('ready');
  const onResultRef   = useRef(onResult);
  onResultRef.current = onResult;

  // Margen máximo y umbral dinámico
  const maxMargin        = Math.max(attribute, 2);
  const separatorsFromMs = rv.separatorsFrom * 1000;
  // Solo modo centesimas y sin esquivar usa margen dinámico
  const useDynamic = mode === 'centesimas' && marginSide === 'both';

  // Segmentos: se recalculan al parar con el margen real del momento
  const [resultSegments, setResultSegments] = useState([]);
  const staticSegments = useMemo(
    () => buildSegments(mode, target, attribute, marginSide, pifiaMargin, timeLimit),
    [mode, target, attribute, marginSide, pifiaMargin, timeLimit],
  );

  const markPositions = useMemo(
    () => getMarkPositions(mode, target, totalMs),
    [mode, target, totalMs],
  );

  // margen para display de condiciones
  const halfMargin = maxMargin;

  // ── handlers ──────────────────────────────────────────────────────────────

  const doStop = useCallback((isTimeout) => {
    if (phaseRef.current !== 'running') return;
    phaseRef.current = 'result';
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }

    const stopTime  = isTimeout ? null : elapsedRef.current;
    const stopMargin = isTimeout ? maxMargin : marginRef.current;
    const result = resolveVibra({
      mode, target, stopTime,
      attribute,
      margin: useDynamic ? stopMargin : undefined,
      marginSide, pifiaMargin, baseDamage, ecoModifiers,
    });

    // Recalcular segmentos con el margen real de parada para la barra post-stop
    if (useDynamic) {
      const segs = buildSegments(mode, target, stopMargin, 'both', pifiaMargin, timeLimit);
      setResultSegments(segs);
    } else {
      setResultSegments(staticSegments);
    }

    setDisplayMs(isTimeout ? totalMs : elapsedRef.current);
    setResult(result);
    setPhase('result');
    setTimeout(() => onResultRef.current?.(result), 1500);
  }, [mode, target, attribute, marginSide, pifiaMargin, baseDamage, ecoModifiers, totalMs, maxMargin, useDynamic, separatorsFromMs, staticSegments]);

  const doStart = useCallback(() => {
    if (phaseRef.current !== 'ready') return;
    phaseRef.current = 'running';
    setPhase('running');
    startRef.current = performance.now();
    elapsedRef.current = 0;
    marginRef.current = useDynamic ? 2 : maxMargin;
    setLiveMargin(useDynamic ? 2 : maxMargin);

    const tick = () => {
      const elapsed = performance.now() - startRef.current;
      elapsedRef.current = elapsed;

      if (useDynamic) {
        const dm = getDynamicMargin(elapsed, separatorsFromMs, maxMargin);
        if (dm !== marginRef.current) {
          marginRef.current = dm;
          setLiveMargin(dm);
        }
      }

      setDisplayMs(elapsed);
      if (elapsed >= totalMs) { doStop(true); return; }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [totalMs, doStop, useDynamic, maxMargin, separatorsFromMs]);

  const handleAction = useCallback(() => {
    if (phaseRef.current === 'ready')   doStart();
    else if (phaseRef.current === 'running') doStop(false);
  }, [doStart, doStop]);

  useEffect(() => {
    const onKey = (e) => { if (e.code === 'Space') { e.preventDefault(); handleAction(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleAction]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // ── display ───────────────────────────────────────────────────────────────

  const ms           = Math.min(displayMs, totalMs);
  const precision    = getPrecision(ms, phase, mode, rv);
  const displayStr   = formatMs(ms, precision);
  const barPct       = Math.min(100, (ms / totalMs) * 100);
  const showMark     = shouldShowMark(ms, phase, mode, rv, target, showMarkProp);
  const showSeps     = shouldShowSeparators(ms, phase, mode, rv, target, totalMs);
  const zonesVisible = phase === 'result';
  const resultMeta   = vibraResult ? RESULT_META[vibraResult.result] : null;

  const numAnim = vibraResult
    ? vibraResult.result === 'flow'    ? { scale: [1, 1.3, 1.1, 1] }
    : vibraResult.result === 'pifia'   ? { x: [0, -14, 14, -7, 7, 0] }
    : vibraResult.result === 'timeout' ? { opacity: [1, 0.3, 0.8] }
    : {}
    : {};

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div
      onClick={handleAction}
      style={{
        position:        'fixed',
        inset:           0,
        background:      'rgba(6,6,10,0.97)',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        zIndex:          1000,
        userSelect:      'none',
        WebkitUserSelect:'none',
        touchAction:     'manipulation',
      }}
    >
      {/* ── modal interior ─────────────────────────────── */}
      <div
        style={{
          width:         '100%',
          maxWidth:      '460px',
          minHeight:     '85vh',
          display:       'flex',
          flexDirection: 'column',
          padding:       `${SPACING[5]} ${SPACING[4]}`,
          gap:           SPACING[4],
        }}
      >
        {/* ── 1. label + contexto ─────────────────────── */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily:    TYPOGRAPHY.fontFamily,
            fontSize:      TYPOGRAPHY.size['2xl'],
            fontWeight:    TYPOGRAPHY.weight.black,
            color:         COLORS_UI.text,
            letterSpacing: '0.12em',
          }}>
            {actionLabel}
          </div>
          {actionContext && (
            <div style={{
              fontFamily: TYPOGRAPHY.fontFamily,
              fontSize:   TYPOGRAPHY.size.sm,
              color:      COLORS_UI.textSecondary,
              marginTop:  SPACING[1],
            }}>
              {actionContext}
            </div>
          )}
        </div>

        {/* ── 2. panel de condiciones ─────────────────── */}
        <div style={{
          background:   COLORS_UI.bgElevated,
          borderRadius: BORDERS.radius.lg,
          padding:      `${SPACING[3]} ${SPACING[3]}`,
          border:       `1px solid ${COLORS_UI.border}`,
        }}>
          <div style={{
            display:        'flex',
            justifyContent: 'space-between',
            alignItems:     'center',
            marginBottom:   mode === 'centesimas' ? SPACING[2] : 0,
          }}>
            <span style={{ color: '#FFD700', fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.bold }}>
              ⚡ .{String(target).padStart(2, '0')}
            </span>
            <span style={{ color: '#3BA84F', fontSize: TYPOGRAPHY.size.sm }}>
              {marginSide === 'both'   ? `±${halfMargin}` :
               marginSide === 'before' ? `−${attribute} /+0` :
                                         `+${attribute} /−0`} ctms
            </span>
            <span style={{ color: '#BB2222', fontSize: TYPOGRAPHY.size.sm }}>
              ☠ &gt;±{pifiaMargin}
            </span>
          </div>

          {mode === 'centesimas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* column headers */}
              <div style={{ display: 'flex', gap: SPACING[1] }}>
                <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '9px', color: COLORS_UI.textMuted, minWidth: 32 }}></span>
                <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '9px', color: '#3BA84F', minWidth: 44 }}>VIBRA</span>
                <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '9px', color: '#FFD700' }}>⚡FLOW</span>
              </div>
              {[
                { s: '0', mult: 2.0, hot: true  },
                { s: '1', mult: 1.8, hot: true  },
                { s: '2', mult: 1.6, hot: true  },
                { s: '3', mult: 1.4, hot: false },
                { s: '4', mult: 1.2, hot: false },
                { s: '5+', mult: 1.0, hot: false },
              ].map(({ s, mult, hot }) => {
                const vibraDmg = Math.round(baseDamage * mult);
                const flowDmg  = Math.round(baseDamage * mult * 2);
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: SPACING[1] }}>
                    <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: hot ? '#FFD700' : COLORS_UI.textMuted, minWidth: 32 }}>
                      {s}.xx
                    </span>
                    <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: '#3BA84F', minWidth: 44, fontWeight: 'bold' }}>
                      {vibraDmg}
                    </span>
                    <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: '#FFD700', fontWeight: 'bold' }}>
                      {flowDmg}
                    </span>
                  </div>
                );
              })}
              {/* fail / pifia incoming */}
              {failDamage > 0 && (
                <div style={{ marginTop: SPACING[1], paddingTop: SPACING[1], borderTop: `1px solid rgba(255,255,255,0.08)`, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ display: 'flex', gap: SPACING[1] }}>
                    <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '9px', color: '#E0823B', minWidth: 32 }}>FAIL</span>
                    <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '9px', color: '#E0823B' }}>
                      {actionType === 'confront' ? `−${failDamage} al Foso` : `+${failDamage} res.`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: SPACING[1] }}>
                    <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '9px', color: '#E03B3B', minWidth: 32 }}>PIFIA</span>
                    <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '9px', color: '#E03B3B' }}>
                      {actionType === 'confront' ? `−${failDamage * 2} al Foso` : `+${failDamage * 2} res.`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 3. barra de progreso ────────────────────── */}
        <div style={{
          width:        '100%',
          height:       '32px',
          background:   '#070710',
          border:       `1px solid ${COLORS_UI.border}`,
          borderRadius: BORDERS.radius.md,
          position:     'relative',
          overflow:     'hidden',
        }}>
          {/* banda verde dinámica durante running (margen crece) */}
          {phase === 'running' && useDynamic && mode === 'centesimas' && (
            Array.from({ length: timeLimit }, (_, s) => {
              const sBase  = (s / timeLimit) * 100;
              const bw     = (liveMargin * 2 / 100) * (100 / timeLimit);
              const cx     = sBase + (target / 100) * (100 / timeLimit);
              return (
                <div key={`live-${s}`} style={{
                  position:  'absolute', top: 0, bottom: 0,
                  left:      `${cx - bw / 2}%`,
                  width:     `${bw}%`,
                  background:'rgba(59,168,79,0.15)',
                  pointerEvents:'none',
                }} />
              );
            })
          )}

          {/* zonas coloreadas: SOLO visibles tras parar (con margen de parada) */}
          <AnimatePresence>
            {zonesVisible && (resultSegments.length > 0 ? resultSegments : staticSegments).map((seg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.82 }}
                transition={{ duration: 0.25, delay: i * 0.004 }}
                style={{
                  position:   'absolute',
                  top: 0, bottom: 0,
                  left:       `${seg.left}%`,
                  width:      `${seg.width}%`,
                  background: ZONE_COLOR[seg.color],
                }}
              />
            ))}
          </AnimatePresence>

          {/* separadores de segundo — solo cuando showSeps */}
          {showSeps && mode === 'centesimas' && Array.from({ length: timeLimit - 1 }, (_, i) => (
            <motion.div
              key={`sep-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: i * 0.02 }}
              style={{
                position:  'absolute',
                top: 0, bottom: 0,
                left:      `${((i + 1) / timeLimit) * 100}%`,
                width:     '1px',
                background:'rgba(255,255,255,0.18)',
                zIndex:    2,
              }}
            />
          ))}

          {/* separador único en modo punto (cuando showSeps) */}
          {showSeps && mode === 'punto' && (() => {
            const secs = Math.floor(target / 1000);
            return Array.from({ length: Math.ceil(timeLimit) - 1 }, (_, i) => (
              <motion.div
                key={`sep-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: i * 0.02 }}
                style={{
                  position:  'absolute',
                  top: 0, bottom: 0,
                  left:      `${((i + 1) / timeLimit) * 100}%`,
                  width:     '1px',
                  background:'rgba(255,255,255,0.18)',
                  zIndex:    2,
                }}
              />
            ));
          })()}

          {/* marca sutil del objetivo */}
          <AnimatePresence>
            {showMark && markPositions.map((pos, i) => (
              <motion.div
                key={`mark-${i}`}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  position:     'absolute',
                  top:          '-2px',
                  bottom:       '-2px',
                  left:         `${pos}%`,
                  width:        '2px',
                  background:   '#FFD700',
                  boxShadow:    '0 0 6px #FFD700, 0 0 12px rgba(255,215,0,0.5)',
                  transform:    'translateX(-50%)',
                  borderRadius: '1px',
                  zIndex:       3,
                }}
              />
            ))}
          </AnimatePresence>

          {/* aguja de progreso */}
          {phase !== 'ready' && (
            <div style={{
              position:     'absolute',
              top:          '-2px',
              bottom:       '-2px',
              left:         `${barPct}%`,
              width:        '3px',
              background:   'white',
              boxShadow:    '0 0 8px white, 0 0 16px rgba(255,255,255,0.4)',
              transform:    'translateX(-50%)',
              borderRadius: '2px',
              zIndex:       5,
            }} />
          )}
        </div>

        {/* ── 4. número y resultado ───────────────────── */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>

          {/* número grande — oculto en soloBar */}
          {!rv.soloBar && (
            <motion.div
              animate={numAnim}
              transition={{ duration: 0.35 }}
              style={{
                fontFamily:    TYPOGRAPHY.fontFamilyMono,
                fontSize:      'clamp(56px, 15vw, 80px)',
                fontWeight:    TYPOGRAPHY.weight.black,
                color:         resultMeta ? resultMeta.color : COLORS_UI.text,
                letterSpacing: '0.02em',
                lineHeight:    1,
                textAlign:     'center',
                transition:    'color 0.2s',
              }}
            >
              {displayStr}
            </motion.div>
          )}

          {/* indicador de fase de revelación */}
          {phase === 'running' && mode === 'centesimas' && !rv.soloBar && (
            <div style={{
              fontFamily:    TYPOGRAPHY.fontFamily,
              fontSize:      TYPOGRAPHY.size.xs,
              color:         COLORS_UI.textMuted,
              marginTop:     SPACING[2],
              letterSpacing: '0.06em',
            }}>
              {precision === 'segundos'
                ? `SEGUNDOS — centésimas en ${Math.max(0, Math.ceil(rv.segundosUntil - ms / 1000))}s`
                : precision === 'decimas'
                  ? 'DÉCIMAS'
                  : showMark
                    ? '📍 MARCA VISIBLE'
                    : 'CENTÉSIMAS'}
            </div>
          )}

          {/* soloBar: solo mostrar texto de cuenta regresiva */}
          {phase === 'running' && rv.soloBar && (
            <div style={{
              fontFamily:    TYPOGRAPHY.fontFamily,
              fontSize:      TYPOGRAPHY.size.sm,
              color:         COLORS_UI.textMuted,
              letterSpacing: '0.08em',
            }}>
              — — —
            </div>
          )}

          {/* resultado animado (siempre, incluso en soloBar) */}
          <AnimatePresence>
            {phase === 'result' && resultMeta && vibraResult && (
              <motion.div
                key="result"
                initial={{ scale: 0.3, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                style={{ textAlign: 'center', marginTop: rv.soloBar ? 0 : SPACING[3] }}
              >
                <div style={{
                  fontFamily:    TYPOGRAPHY.fontFamily,
                  fontSize:      TYPOGRAPHY.size['2xl'],
                  fontWeight:    TYPOGRAPHY.weight.black,
                  color:         resultMeta.color,
                  letterSpacing: '0.14em',
                  textShadow:    `0 0 20px ${resultMeta.color}, 0 0 40px ${resultMeta.glow}`,
                }}>
                  {resultMeta.label}
                </div>

                {vibraResult.finalValue > 0 && (
                  <motion.div
                    initial={{ y: 0, opacity: 1 }}
                    animate={{ y: -32, opacity: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    style={{
                      fontFamily: TYPOGRAPHY.fontFamilyMono,
                      fontSize:   TYPOGRAPHY.size.xl,
                      fontWeight: TYPOGRAPHY.weight.bold,
                      color:      '#3BA84F',
                      marginTop:  SPACING[1],
                    }}
                  >
                    +{vibraResult.finalValue}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 5. botón EMPEZAR / PARAR ─────────────────── */}
        {phase !== 'result' && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={(e) => { e.stopPropagation(); handleAction(); }}
            style={{
              width:        '100%',
              minHeight:    '88px',
              background:   phase === 'running' ? COLORS_GAME.rojo : COLORS_GAME.verde,
              border:       'none',
              borderRadius: BORDERS.radius.xl,
              fontFamily:   TYPOGRAPHY.fontFamily,
              fontSize:     TYPOGRAPHY.size.xl,
              fontWeight:   TYPOGRAPHY.weight.black,
              color:        'white',
              letterSpacing:'0.14em',
              cursor:       'pointer',
              boxShadow:    phase === 'running'
                ? `0 6px 32px ${COLORS_GAME.rojo}80`
                : `0 6px 32px ${COLORS_GAME.verde}80`,
              transition:   'background 0.12s, box-shadow 0.12s',
              flexShrink:   0,
            }}
          >
            {phase === 'ready' ? 'EMPEZAR' : 'PARAR'}
          </motion.button>
        )}
      </div>
    </div>
  );
}
