/**
 * Suma100Probe — cronómetro continuo, cosechar centésimas para sumar el objetivo.
 * PARAR: centésimas del instante se suman al score.
 * score > targetSum + auraMargin → reset a 0.
 * |score - targetSum| <= auraMargin → WIN.
 * GDD v2.1 Sección 4: Suma 100 (objetivo variable).
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  COLORS_UI, COLORS_GAME,
  TYPOGRAPHY, SPACING, BORDERS,
} from '../../styles/tokens.js';

// ── Barra visual de centésimas ────────────────────────────────────────────────
// cursor avanza 0→99 cada segundo; marca dorada en aura; zona verde en objetivo
function CentesimasBar({ currentCents, winMin, winMax, auraNumber }) {
  const pct = v => `${(v / 99) * 100}%`;
  const cMin = Math.max(0,  Math.round(winMin));
  const cMax = Math.min(99, Math.round(winMax));
  const hasWin   = cMin <= cMax;
  const hasAura  = auraNumber != null && auraNumber >= 0 && auraNumber <= 99;
  // la zona de victoria se superpone al aura: si el aura cae dentro, es bonus
  const auraInWin = hasAura && hasWin && auraNumber >= cMin && auraNumber <= cMax;

  return (
    <div style={{
      position:     'relative',
      height:       '56px',
      borderRadius: BORDERS.radius.lg,
      background:   COLORS_UI.bgElevated,
      border:       `1px solid ${COLORS_UI.border}`,
      overflow:     'hidden',
      userSelect:   'none',
    }}>
      {/* Zona overflow (derecha del objetivo) */}
      {hasWin && cMax < 99 && (
        <div style={{
          position: 'absolute',
          left: `calc(${pct(cMax)} + 2px)`,
          right: 0, top: 0, bottom: 0,
          background: 'rgba(224,59,59,0.08)',
        }} />
      )}

      {/* Zona de victoria */}
      {hasWin && (
        <div style={{
          position:    'absolute',
          left:        pct(cMin),
          width:       `${((cMax - cMin + 1) / 99) * 100}%`,
          top: 0, bottom: 0,
          background:  'rgba(59,168,79,0.22)',
          borderLeft:  cMin > 0  ? '2px solid rgba(59,168,79,0.9)' : 'none',
          borderRight: cMax < 99 ? '2px solid rgba(59,168,79,0.9)' : 'none',
        }} />
      )}

      {/* Ticks cada 25 */}
      {[25, 50, 75].map(v => (
        <div key={v} style={{
          position:   'absolute', left: pct(v),
          top: '20%', height: '60%', width: '1px',
          background: COLORS_UI.border, opacity: 0.4,
        }} />
      ))}

      {/* Etiquetas centésimas */}
      <div style={{
        position:   'absolute', bottom: '3px',
        left: '6px', right: '6px',
        display:    'flex', justifyContent: 'space-between',
        fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '8px',
        color:      COLORS_UI.textMuted, pointerEvents: 'none',
      }}>
        {['.00', '.25', '.50', '.75', '.99'].map(l => <span key={l}>{l}</span>)}
      </div>

      {/* Marca de Aura (dorada) */}
      {hasAura && (
        <div style={{
          position:  'absolute',
          left:      pct(auraNumber),
          top: 0, bottom: 0,
          width:     '2px',
          background: auraInWin ? '#FFD700' : '#FFD700',
          transform: 'translateX(-1px)',
          boxShadow: '0 0 6px #FFD700aa',
          zIndex:    2,
        }}>
          {/* Etiqueta del aura */}
          <div style={{
            position:   'absolute', top: '3px',
            left:       '4px',
            fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '7px',
            color:      '#FFD700', whiteSpace: 'nowrap',
            textShadow: '0 0 4px #FFD700',
          }}>
            #{String(auraNumber).padStart(2,'0')}
          </div>
        </div>
      )}

      {/* Cursor — línea que avanza */}
      <div style={{
        position:  'absolute',
        left:      pct(currentCents),
        top: 0, bottom: 0,
        width:     '3px',
        background:'white',
        transform: 'translateX(-1.5px)',
        boxShadow: '0 0 8px rgba(255,255,255,0.9), 0 0 2px white',
        zIndex:    3,
      }} />
    </div>
  );
}

// ── Probe principal ───────────────────────────────────────────────────────────
export default function Suma100Probe({ config, character, onComplete }) {
  const timeLimitMs = (config.timeLimitSec ?? 30) * 1000;
  const maxResets   = config.maxResets   ?? 5;
  const targetSum   = config.targetSum   ?? 100;
  const helpMode    = config.showVisualAid ?? false;

  const [elapsed,     setElapsed]     = useState(0);
  const [score,       setScore]       = useState(0);
  const [resets,      setResets]      = useState(0);
  const [auraMargin,  setAuraMargin]  = useState(0);
  const [phase,       setPhase]       = useState('ready');
  const [lastAdd,     setLastAdd]     = useState(null);
  const [history,     setHistory]     = useState([]);
  const [auraFlash,   setAuraFlash]   = useState(null);

  const rafRef      = useRef(null);
  const rafStartRef = useRef(0);
  const baseElapsed = useRef(0);
  const scoreRef    = useRef(0);
  const resetsRef   = useRef(0);
  const auraRef     = useRef(0);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // ── RAF ───────────────────────────────────────────────────────────────────
  const startRAF = () => {
    rafStartRef.current = performance.now();
    const tick = () => {
      const el = baseElapsed.current + (performance.now() - rafStartRef.current);
      if (el >= timeLimitMs) {
        baseElapsed.current = timeLimitMs;
        setElapsed(timeLimitMs);
        doEnd(scoreRef.current, resetsRef.current);
        return;
      }
      setElapsed(el);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const stopRAF = () => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    baseElapsed.current = baseElapsed.current + (performance.now() - rafStartRef.current);
  };

  const doEnd = (finalScore, finalResets) => {
    const diff    = Math.abs(finalScore - targetSum);
    const margin  = auraRef.current;
    const isPerfect = finalScore === targetSum && finalResets === 0;
    const isPass    = diff <= margin;
    const result    = isPerfect ? 'perfect' : isPass ? 'pass' : 'fail';
    setPhase('done');
    setTimeout(() => onComplete({ result, auraTriggered: margin > 0 }), 900);
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleStart = () => { setPhase('running'); startRAF(); };

  const handleStop = () => {
    if (phase !== 'running') return;
    stopRAF();

    const frozenMs    = baseElapsed.current;
    const centesimas  = Math.floor((frozenMs % 1000) / 10);
    setElapsed(frozenMs);

    // Comprobar Aura PRIMERO — el margen se aplica en este mismo intento
    let newAuraMargin = auraRef.current;
    if (centesimas === character?.auraNumber) {
      newAuraMargin += 2;
      auraRef.current = newAuraMargin;
      setAuraMargin(newAuraMargin);
      setAuraFlash(character?.auraAbility?.name ?? `#${String(character.auraNumber).padStart(2,'0')}`);
      setTimeout(() => setAuraFlash(null), 2500);
    }

    const raw      = scoreRef.current + centesimas;
    const isWin    = Math.abs(raw - targetSum) <= newAuraMargin;
    const overflow = !isWin && raw > targetSum + newAuraMargin;

    const newScore  = overflow ? 0 : (isWin ? raw : raw);
    const newResets = overflow ? resetsRef.current + 1 : resetsRef.current;

    scoreRef.current  = isWin ? raw : (overflow ? 0 : raw);
    resetsRef.current = newResets;

    setScore(scoreRef.current);
    setResets(newResets);
    setLastAdd({ centesimas, overflow, isWin, raw, resultScore: scoreRef.current });
    setHistory(prev => [{ centesimas, overflow, isWin, raw }, ...prev].slice(0, 6));

    if (isWin) { doEnd(raw, newResets); return; }
    // maxResets === 0 → infinito, solo aplica el tiempo
    if (maxResets > 0 && newResets >= maxResets && overflow) { doEnd(scoreRef.current, newResets); return; }

    setPhase('frozen');
  };

  const handleContinue = () => {
    if (phase !== 'frozen') return;
    setLastAdd(null);
    setPhase('running');
    startRAF();
  };

  // ── Cálculo zona de victoria para la barra ────────────────────────────────
  const currentCents = Math.floor((elapsed % 1000) / 10);
  // Rango de centésimas que llevarían a score dentro de [targetSum-margin, targetSum+margin]
  const winMin = targetSum - auraMargin - score;
  const winMax = targetSum + auraMargin - score;

  // ── Display ───────────────────────────────────────────────────────────────
  const dispSecs   = Math.floor(elapsed / 1000);
  const dispCents  = String(currentCents).padStart(2, '0');
  const timerStr   = `${dispSecs}.${dispCents}`;

  const timeLeftSec = Math.ceil(Math.max(0, timeLimitMs - elapsed) / 1000);
  const scorePct    = Math.min(100, (score / targetSum) * 100);
  const resetsLeft  = maxResets - resets;

  const timerColor = phase === 'frozen'
    ? (lastAdd?.overflow ? COLORS_GAME.rojo : lastAdd?.isWin ? '#3BA84F' : COLORS_UI.text)
    : COLORS_UI.text;

  return (
    <div style={{
      flex:          1,
      display:       'flex',
      flexDirection: 'column',
      padding:       SPACING[4],
      gap:           SPACING[4],
      userSelect:    'none',
    }}>

      {/* Flash de Aura */}
      <AnimatePresence>
        {auraFlash && (
          <motion.div key="aura"
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: '12%', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(255,215,0,0.12)', border: '1px solid #FFD700',
              borderRadius: BORDERS.radius.lg, padding: `${SPACING[2]} ${SPACING[5]}`,
              color: '#FFD700', fontFamily: TYPOGRAPHY.fontFamily,
              fontWeight: TYPOGRAPHY.weight.bold, fontSize: TYPOGRAPHY.size.md, zIndex: 300,
              whiteSpace: 'nowrap',
            }}>
            ✨ AURA — margen ahora ±{auraMargin}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs,
          color: timeLeftSec <= 10 ? COLORS_GAME.rojo : COLORS_UI.textSecondary,
          letterSpacing: '0.08em',
        }}>
          {timeLeftSec}s restantes
        </span>
        <div style={{ display: 'flex', gap: SPACING[3], alignItems: 'center' }}>
          {auraMargin > 0 && (
            <span style={{
              fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs,
              color: '#FFD700', letterSpacing: '0.06em',
            }}>
              ±{auraMargin} aura
            </span>
          )}
          <span style={{
            fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs,
            color: maxResets > 0 && resetsLeft <= 1 ? COLORS_GAME.rojo : COLORS_UI.textMuted,
            letterSpacing: '0.08em',
          }}>
            {maxResets === 0 ? '∞ resets' : `${resetsLeft} reset${resetsLeft !== 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      {/* Score + barra */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{
            fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs,
            color: COLORS_UI.textMuted, letterSpacing: '0.08em',
          }}>
            SCORE
          </span>
          <span style={{
            fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size['2xl'],
            fontWeight: TYPOGRAPHY.weight.black,
            color: score === 0 && resets > 0
              ? COLORS_GAME.rojo
              : scorePct >= 80 ? '#FFD700' : COLORS_UI.text,
          }}>
            {score}
            <span style={{ fontSize: TYPOGRAPHY.size.md, color: COLORS_UI.textMuted }}>
              /{targetSum}
              {auraMargin > 0 && (
                <span style={{ color: '#FFD70099', fontSize: '11px' }}>  ±{auraMargin}</span>
              )}
            </span>
          </span>
        </div>
        <div style={{
          height: '8px', borderRadius: BORDERS.radius.full,
          background: COLORS_UI.border, overflow: 'hidden',
        }}>
          <motion.div
            animate={{ width: `${scorePct}%` }}
            transition={{ type: 'spring', stiffness: 180, damping: 22 }}
            style={{
              height: '100%', borderRadius: BORDERS.radius.full,
              background: scorePct >= 80 ? '#FFD700' : COLORS_GAME.verde,
            }}
          />
        </div>
      </div>

      {/* Barra de centésimas (ayuda) */}
      {helpMode && phase !== 'ready' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[1] }}>
          <span style={{
            fontFamily: TYPOGRAPHY.fontFamily, fontSize: '9px',
            color: COLORS_UI.textMuted, letterSpacing: '0.08em',
          }}>
            ZONA OBJETIVO
          </span>
          <CentesimasBar
            currentCents={currentCents}
            winMin={winMin}
            winMax={winMax}
            auraNumber={character?.auraNumber ?? null}
          />
        </div>
      )}

      {/* Historial */}
      {history.length > 0 && (
        <div style={{ display: 'flex', gap: SPACING[2], flexWrap: 'wrap' }}>
          {history.map((h, i) => (
            <div key={i} style={{
              padding: `2px ${SPACING[2]}`,
              borderRadius: BORDERS.radius.md,
              background:   h.overflow ? 'rgba(224,59,59,0.15)' : h.isWin ? 'rgba(59,168,79,0.12)' : COLORS_UI.bgElevated,
              border:       `1px solid ${h.overflow ? 'rgba(224,59,59,0.3)' : h.isWin ? 'rgba(59,168,79,0.3)' : COLORS_UI.border}`,
              fontFamily:   TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs,
              color:        h.overflow ? COLORS_GAME.rojo : h.isWin ? '#3BA84F' : COLORS_UI.textSecondary,
              opacity:      i === 0 ? 1 : 0.5,
            }}>
              {h.overflow ? '↩' : h.isWin ? '✓' : '+'}
              {String(h.centesimas).padStart(2,'0')}
            </div>
          ))}
        </div>
      )}

      {/* Timer grande */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          animate={
            phase === 'frozen' && lastAdd
              ? lastAdd.overflow
                ? { x: [0, -12, 12, -8, 8, 0] }
                : lastAdd.isWin
                  ? { scale: [1, 1.15, 1] }
                  : {}
              : {}
          }
          transition={{ duration: 0.35 }}
          style={{
            fontFamily:    TYPOGRAPHY.fontFamilyMono,
            fontSize:      'clamp(64px, 18vw, 96px)',
            fontWeight:    TYPOGRAPHY.weight.black,
            color:         phase === 'ready' ? COLORS_UI.textMuted : timerColor,
            letterSpacing: '0.02em',
            lineHeight:    1,
            textAlign:     'center',
            transition:    'color 0.1s',
          }}
        >
          {phase === 'ready' ? '—' : timerStr}
        </motion.div>
      </div>

      {/* Feedback de la parada */}
      <AnimatePresence>
        {phase === 'frozen' && lastAdd && (
          <motion.div key="fb"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ textAlign: 'center' }}
          >
            <span style={{
              fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg,
              fontWeight: TYPOGRAPHY.weight.bold,
              color: lastAdd.overflow ? COLORS_GAME.rojo : lastAdd.isWin ? '#3BA84F' : COLORS_UI.text,
              letterSpacing: '0.05em',
            }}>
              {lastAdd.isWin
                ? `✓  ${score} — COMPLETADO`
                : lastAdd.overflow
                  ? `+${String(lastAdd.centesimas).padStart(2,'0')} = ${lastAdd.raw} — RESET`
                  : `+${String(lastAdd.centesimas).padStart(2,'0')} → ${lastAdd.resultScore}`}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botones */}
      {phase === 'ready' && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleStart}
          style={{
            width: '100%', minHeight: '72px', background: COLORS_GAME.verde, border: 'none',
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
            width: '100%', minHeight: '88px', background: COLORS_GAME.rojo, border: 'none',
            borderRadius: BORDERS.radius.xl, fontFamily: TYPOGRAPHY.fontFamily,
            fontSize: 'clamp(22px, 6vw, 32px)', fontWeight: TYPOGRAPHY.weight.black,
            color: 'white', letterSpacing: '0.14em', cursor: 'pointer',
            boxShadow: `0 6px 32px ${COLORS_GAME.rojo}80`,
          }}>
          PARAR
        </motion.button>
      )}

      {phase === 'frozen' && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleContinue}
          style={{
            width: '100%', minHeight: '72px', background: COLORS_UI.bgElevated,
            border: `1px solid ${COLORS_UI.border}`,
            borderRadius: BORDERS.radius.xl, fontFamily: TYPOGRAPHY.fontFamily,
            fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black,
            color: COLORS_UI.text, letterSpacing: '0.12em', cursor: 'pointer',
          }}>
          CONTINUAR
        </motion.button>
      )}
    </div>
  );
}
