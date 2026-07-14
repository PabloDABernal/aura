/**
 * XOpportunitiesProbe — N ventanas en una línea de tiempo. Toca en el momento exacto.
 * Margen en centésimas. Aura: tocar en centésima del aura → +2 centésimas al margen.
 * GDD v2.1 Sección 4: X Oportunidades.
 */
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  COLORS_UI, COLORS_GAME,
  TYPOGRAPHY, SPACING, BORDERS,
} from '../../styles/tokens.js';

function buildTargetTimes(n, totalMs) {
  return Array.from({ length: n }, (_, i) => ({
    id:       i,
    timeMs:   ((i + 1) / (n + 1)) * totalMs,
    captured: false,
    missed:   false,
  }));
}

export default function XOpportunitiesProbe({ config, character, onComplete }) {
  const totalMs      = (config.totalSec  ?? 10) * 1000;
  const initMarginMs = (config.margin    ??  0) * 10;
  const numTargets   =  config.numTargets ?? 3;
  const required     =  config.required   ?? 1;
  const helpMode     =  config.showVisualAid ?? false;

  const [phase,      setPhase]     = useState('ready');
  const [elapsed,    setElapsed]   = useState(0);
  const [targets,    setTargets]   = useState(() => buildTargetTimes(numTargets, totalMs));
  const [marginMs,   setMarginMs]  = useState(initMarginMs);
  const [auraBonus,  setAuraBonus] = useState(0);   // centésimas ganadas del aura
  const [flashTap,   setFlashTap]  = useState(false);
  const [auraFlash,  setAuraFlash] = useState(false);
  const [result,     setResult]    = useState(null);

  const rafRef            = useRef(null);
  const startRef          = useRef(null);
  const elapsedRef        = useRef(0);
  const phaseRef          = useRef('ready');
  const targetsRef        = useRef(targets);
  const marginMsRef       = useRef(initMarginMs);
  const auraBonusRef      = useRef(0);
  const perfectCapturesRef= useRef(0);

  useEffect(() => { targetsRef.current = targets; }, [targets]);
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // ── Fin de prueba ────────────────────────────────────────────────────────
  const endProbe = (finalTargets) => {
    phaseRef.current = 'done';
    setPhase('done');
    const cap    = finalTargets.filter(t => t.captured).length;
    const isPass = cap >= required;
    let res = 'fail';
    if (isPass) {
      res = perfectCapturesRef.current >= required ? 'perfect' : 'pass';
    }
    setResult(res);
    setTimeout(() => onComplete({
      result:        res,
      auraTriggered: auraBonusRef.current > 0,
    }), 1200);
  };

  // ── RAF loop ─────────────────────────────────────────────────────────────
  const startTick = () => {
    const tick = () => {
      const el = performance.now() - startRef.current;
      elapsedRef.current = el;
      setElapsed(el);

      // Marcar ventanas perdidas
      setTargets(prev => {
        let changed = false;
        const next = prev.map(t => {
          if (!t.captured && !t.missed && el > t.timeMs + marginMsRef.current) {
            changed = true;
            return { ...t, missed: true };
          }
          return t;
        });
        if (changed) { targetsRef.current = next; return next; }
        return prev;
      });

      if (el >= totalMs) { endProbe(targetsRef.current); return; }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  // ── Tap ──────────────────────────────────────────────────────────────────
  const handleTap = () => {
    if (phaseRef.current === 'ready') {
      phaseRef.current  = 'running';
      setPhase('running');
      startRef.current  = performance.now();
      startTick();
      return;
    }
    if (phaseRef.current !== 'running') return;

    const tapMs      = elapsedRef.current;
    const centesimas = Math.floor((tapMs % 1000) / 10);

    // Aura — suma +2 centésimas al margen, apilable
    if (centesimas === character?.auraNumber) {
      const bonus = 20; // 2 centésimas = 20ms
      marginMsRef.current  += bonus;
      auraBonusRef.current += 2;
      setMarginMs(m => m + bonus);
      setAuraBonus(b => b + 2);
      setAuraFlash(true);
      setTimeout(() => setAuraFlash(false), 1600);
    }

    setFlashTap(true);
    setTimeout(() => setFlashTap(false), 130);

    // Check perfect capture before updating state
    const currentTargets = targetsRef.current;
    for (const t of currentTargets) {
      if (!t.captured && !t.missed && Math.abs(tapMs - t.timeMs) <= marginMsRef.current) {
        if (Math.abs(tapMs - t.timeMs) <= marginMsRef.current * 0.5) {
          perfectCapturesRef.current += 1;
        }
        break;
      }
    }

    // Capturar primera ventana en margen
    setTargets(prev => {
      let hitIdx = -1;
      const next = prev.map((t, i) => {
        if (hitIdx === -1 && !t.captured && !t.missed &&
            Math.abs(tapMs - t.timeMs) <= marginMsRef.current) {
          hitIdx = i;
          return { ...t, captured: true };
        }
        return t;
      });
      if (hitIdx !== -1) { targetsRef.current = next; return next; }
      return prev;
    });
  };

  // ── Computed ─────────────────────────────────────────────────────────────
  const barPct    = Math.min(100, (Math.min(elapsed, totalMs) / totalMs) * 100);
  const secs      = Math.floor(Math.min(elapsed, totalMs) / 1000);
  const cents     = Math.floor((elapsed % 1000) / 10).toString().padStart(2, '0');
  const captured  = targets.filter(t => t.captured).length;
  // ¡TOCA! mínimo 50ms de ventana visual aunque el margen sea 0
  const liveMs    = Math.max(marginMsRef.current, 50);
  const anyLive   = phase === 'running' && targets.some(
    t => !t.captured && !t.missed && Math.abs(elapsed - t.timeMs) <= liveMs
  );
  // Posiciones de aura en la línea de tiempo (una por segundo)
  const auraPositions = character?.auraNumber != null
    ? Array.from({ length: Math.ceil(totalMs / 1000) }, (_, s) =>
        s * 1000 + character.auraNumber * 10
      ).filter(ms => ms > 0 && ms < totalMs)
    : [];

  const currentMarginCents = Math.round(marginMsRef.current / 10);

  return (
    <div
      onClick={handleTap}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        gap: SPACING[4], padding: SPACING[4],
        userSelect: 'none', cursor: 'pointer', touchAction: 'manipulation',
      }}
    >
      {/* Flash de Aura */}
      <AnimatePresence>
        {auraFlash && (
          <motion.div key="aura"
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: '15%', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(255,215,0,0.15)', border: '1px solid #FFD700',
              borderRadius: BORDERS.radius.lg, padding: `${SPACING[2]} ${SPACING[5]}`,
              color: '#FFD700', fontFamily: TYPOGRAPHY.fontFamily,
              fontWeight: TYPOGRAPHY.weight.bold, fontSize: TYPOGRAPHY.size.md,
              zIndex: 200, whiteSpace: 'nowrap',
            }}>
            ✨ AURA — +2 centésimas margen
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cabecera: capturas + pill aura */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{
            fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs,
            color: COLORS_UI.textMuted, letterSpacing: '0.06em',
          }}>
            CAPTURA {required === numTargets ? 'TODAS' : `AL MENOS ${required}`} / {numTargets}
          </div>
          <div style={{
            fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xl,
            fontWeight: TYPOGRAPHY.weight.bold,
            color: captured >= required ? '#3BA84F' : COLORS_UI.text,
            marginTop: '2px',
          }}>
            {captured} / {numTargets}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: SPACING[1] }}>
          {/* Margen actual */}
          <div style={{
            padding: `1px ${SPACING[2]}`,
            background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`,
            borderRadius: BORDERS.radius.full,
            fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '10px',
            color: COLORS_UI.textSecondary,
          }}>
            {currentMarginCents === 0 ? 'exacto' : `±${currentMarginCents}`}
          </div>
          {/* Pill aura */}
          {character?.auraNumber != null && (
            <div style={{
              padding: `1px ${SPACING[2]}`,
              background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.3)',
              borderRadius: BORDERS.radius.full,
              fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '10px',
              color: auraBonus > 0 ? '#FFD700' : 'rgba(255,215,0,0.6)',
              whiteSpace: 'nowrap',
            }}>
              ✨ #{String(character.auraNumber).padStart(2,'0')} +2 margen
              {auraBonus > 0 && ` (×${auraBonus / 2})`}
            </div>
          )}
        </div>
      </div>

      {/* Barra de tiempo (solo en helpMode) */}
      {helpMode && (
        <div style={{
          width: '100%', height: '52px',
          background: '#070710', border: `1px solid ${COLORS_UI.border}`,
          borderRadius: BORDERS.radius.md, position: 'relative', overflow: 'visible',
        }}>
          {/* Zonas objetivo (verde) */}
          {targets.map(t => {
            const pos     = (t.timeMs / totalMs) * 100;
            const zoneW   = Math.max((marginMsRef.current * 2 / totalMs) * 100, 0.5);
            const isLive  = !t.captured && !t.missed &&
                            Math.abs(elapsed - t.timeMs) <= liveMs && phase === 'running';
            return (
              <div key={t.id} style={{
                position:  'absolute',
                top: '-6px', bottom: '-6px',
                left:      `${pos}%`, transform: 'translateX(-50%)',
                width:     `${zoneW}%`, minWidth: '4px',
                borderRadius: '3px',
                background: t.captured
                  ? 'rgba(59,168,79,0.7)'
                  : t.missed
                    ? 'rgba(224,59,59,0.3)'
                    : isLive
                      ? 'rgba(59,168,79,0.8)'
                      : 'rgba(59,168,79,0.3)',
                border:    isLive ? '2px solid #3BA84F' : 'none',
                boxShadow: isLive ? '0 0 10px #3BA84F' : 'none',
                transition:'background 0.08s',
                zIndex: 2,
              }} />
            );
          })}

          {/* Marcas de Aura (amarillo) */}
          {auraPositions.map((ms, i) => (
            <div key={i} style={{
              position:   'absolute',
              left:       `${(ms / totalMs) * 100}%`,
              top: 0, bottom: 0, width: '2px',
              background: '#FFD700', transform: 'translateX(-1px)',
              opacity: 0.5, zIndex: 1,
            }} />
          ))}

          {/* Aguja */}
          {phase !== 'ready' && (
            <div style={{
              position: 'absolute', top: 0, bottom: 0,
              left: `${barPct}%`, width: '3px',
              background: 'white', boxShadow: '0 0 8px white',
              transform: 'translateX(-50%)', zIndex: 5,
            }} />
          )}
        </div>
      )}

      {/* Número grande */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          animate={flashTap ? { scale: [1, 1.06, 1] } : {}}
          transition={{ duration: 0.12 }}
          style={{ textAlign: 'center' }}
        >
          <div style={{
            fontFamily:    TYPOGRAPHY.fontFamilyMono,
            fontSize:      'clamp(56px, 14vw, 80px)',
            fontWeight:    TYPOGRAPHY.weight.black,
            color:         anyLive
              ? '#3BA84F'
              : result === 'fail'
                ? COLORS_GAME.rojo
                : result === 'perfect'
                  ? '#FFD700'
                  : result === 'pass'
                    ? '#3BA84F'
                    : COLORS_UI.text,
            textShadow:    anyLive ? '0 0 20px #3BA84F' : 'none',
            transition:    'color 0.08s, text-shadow 0.08s',
            lineHeight:    1,
          }}>
            {phase === 'ready'
              ? '0.00'
              : phase === 'done'
                ? result === 'fail' ? '✗' : result === 'perfect' ? '✦' : '✓'
                : `${secs}.${cents}`}
          </div>

          <AnimatePresence>
            {anyLive && (
              <motion.div
                key="toca"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl,
                  fontWeight: TYPOGRAPHY.weight.black, color: '#3BA84F',
                  letterSpacing: '0.14em', marginTop: SPACING[2],
                }}
              >
                ¡TOCA!
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Estado de ventanas (leyenda) */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: SPACING[3], flexWrap: 'wrap' }}>
        {targets.map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: SPACING[1] }}>
            <div style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: t.captured ? '#3BA84F' : t.missed ? COLORS_GAME.rojo : COLORS_UI.textMuted,
            }} />
            <span style={{
              fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs,
              color: t.captured ? '#3BA84F' : t.missed ? COLORS_GAME.rojo : COLORS_UI.textSecondary,
            }}>
              {`${Math.floor(t.timeMs/1000)}.${String(Math.floor((t.timeMs%1000)/10)).padStart(2,'0')}s`}
            </span>
          </div>
        ))}
      </div>

      {/* Botón / indicador */}
      {phase === 'ready' ? (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={e => { e.stopPropagation(); handleTap(); }}
          style={{
            width: '100%', minHeight: '80px',
            background: COLORS_GAME.verde, border: 'none',
            borderRadius: BORDERS.radius.xl, fontFamily: TYPOGRAPHY.fontFamily,
            fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black,
            color: 'white', letterSpacing: '0.14em', cursor: 'pointer',
            boxShadow: `0 6px 32px ${COLORS_GAME.verde}60`, marginTop: 'auto',
          }}>
          EMPEZAR
        </motion.button>
      ) : phase === 'running' ? (
        <div style={{
          textAlign: 'center', marginTop: 'auto',
          color: COLORS_UI.textMuted, fontFamily: TYPOGRAPHY.fontFamily,
          fontSize: TYPOGRAPHY.size.sm, letterSpacing: '0.06em',
        }}>
          TOCA LA PANTALLA
        </div>
      ) : (
        <div style={{
          textAlign: 'center', marginTop: 'auto',
          color: result === 'fail' ? COLORS_GAME.rojo : result === 'perfect' ? '#FFD700' : '#3BA84F',
          fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl,
          fontWeight: TYPOGRAPHY.weight.bold, letterSpacing: '0.1em',
        }}>
          {result === 'fail'
            ? `${captured} de ${required} requeridas`
            : `${captured} CAPTURADAS`}
        </div>
      )}
    </div>
  );
}
