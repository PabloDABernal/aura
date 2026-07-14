/**
 * PracticeScreen — Modo Práctica. GDD v4.0 §10.5.
 * Sin vidas, sin recompensas, sin Residuos. Sí habilidades pasivas.
 * Config de dificultad: pistas (catálogo) para bingo/espejo/pendulo/parpadeo;
 * tier por grado para el resto.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../store/index.js';
import { generateProbeConfig, getProbePool } from '../../engine/run/runEngine.js';
import { applyProbeConfig }                  from '../../engine/abilities/abilityEngine.js';
import { PROBE_MAP, PROBE_LABELS }           from '../probes/probeRegistry.js';
import { resolveConfigFromPistas, PROBE_PISTAS } from '../../data/probePistas.js';
import {
  COLORS_UI, COLORS_GAME,
  TYPOGRAPHY, SPACING, BORDERS,
} from '../../styles/tokens.js';

const GENERIC_CHAR = {
  id: 'practice-generic',
  name: 'Genérico',
  auraNumber: 99,
  grade: 10,
  status: 'active',
  passiveAbility: null,
  activeAbility: null,
  auraAbility: null,
  stats: {},
  temporalResidues: 0,
};

const ALL_PROBES    = Object.keys(PROBE_MAP);
const GRADES        = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const CATALOG_PROBES = new Set(Object.keys(PROBE_PISTAS)); // bingo, espejo, pendulo, parpadeo

const RESULT_STYLE = {
  perfect: { color: '#FFD700', label: '✦ RESONANCIA',       bg: 'rgba(255,215,0,0.08)', border: 'rgba(255,215,0,0.3)' },
  pass:    { color: '#60A5FA', label: '✓ SINCRONÍA ESTABLE', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.3)' },
  fail:    { color: '#E03B3B', label: '✗ RESONANCIA ROTA',  bg: 'rgba(224,59,59,0.08)',  border: 'rgba(224,59,59,0.3)'  },
};

function formatConfigSummary(probeType, cfg) {
  if (!cfg) return null;
  switch (probeType) {
    case 'bingo':
      return `Objetivos ${cfg.targets} · Margen ±${cfg.margin} · Tiempo ${cfg.timeLimitSec}s · Paradas ${cfg.maxStops}`;
    case 'espejo':
      return `Aciertos ${cfg.requiredHits} · Margen ±${cfg.margin} · Duración ${cfg.duration}s · Paradas ${cfg.maxStops}`;
    case 'pendulo':
      return `Oscilaciones ${cfg.swings} · Duración ${cfg.swingDuration}s · Margen ±${cfg.margin} · Paradas ${cfg.maxStops}`;
    case 'parpadeo':
      return `Duración ${cfg.totalSec}s · Ciclo ${cfg.range}cs · Margen ±${cfg.margin}`;
    default:
      return null;
  }
}

export default function PracticeScreen() {
  const { characters, setScreen, meta } = useStore();

  const [phase,         setPhase]        = useState('config');
  const [selCharId,     setSelCharId]    = useState(null); // null = generic
  const [selProbe,      setSelProbe]     = useState(null);
  const [selGrade,      setSelGrade]     = useState(5);
  const [pistasLevel,   setPistasLevel]  = useState(0);
  const [showVisualAid, setShowVisualAid] = useState(false);
  const [lastResult,    setLastResult]   = useState(null);
  const [probeKey,      setProbeKey]     = useState(0);

  const collectorLevel = meta?.collectorLevel ?? 1;
  const activeChars    = Object.values(characters).filter(c => c.status === 'active');
  const char           = selCharId ? (characters[selCharId] ?? GENERIC_CHAR) : GENERIC_CHAR;
  const isGeneric      = !selCharId;

  const probePool = isGeneric ? ALL_PROBES : getProbePool(char?.grade ?? 1, collectorLevel);

  // Reset probe selection when pool changes
  useEffect(() => {
    if (!selProbe || !probePool.includes(selProbe)) {
      setSelProbe(probePool[0] ?? null);
    }
  }, [selCharId, collectorLevel]); // eslint-disable-line

  // Reset pistas level when probe changes
  useEffect(() => {
    setPistasLevel(0);
  }, [selProbe]);

  const hasCatalog = selProbe ? CATALOG_PROBES.has(selProbe) : false;

  // Config preview for config-phase display (no applyProbeConfig, just raw pistas config)
  const previewConfig = hasCatalog && selProbe
    ? resolveConfigFromPistas(selProbe, pistasLevel)
    : null;
  const configSummary = formatConfigSummary(selProbe, previewConfig);

  const handleStart = () => {
    setLastResult(null);
    setProbeKey(k => k + 1);
    setPhase('playing');
  };

  const handleRetry = () => {
    setLastResult(null);
    setProbeKey(k => k + 1);
    setPhase('playing');
  };

  const handleComplete = (result) => {
    setLastResult(result);
    setPhase('result');
  };

  // ── Phase: playing ───────────────────────────────────────────────────────────
  if (phase === 'playing' && selProbe) {
    const baseConfig     = hasCatalog
      ? resolveConfigFromPistas(selProbe, pistasLevel)
      : generateProbeConfig(selProbe, selGrade, 1, [], null);
    const passiveConfig  = applyProbeConfig(baseConfig, char, selProbe, 0);
    const config         = showVisualAid ? { ...passiveConfig, showVisualAid: true } : passiveConfig;
    const ProbeComponent = PROBE_MAP[selProbe];

    const levelLabel = hasCatalog
      ? `Nivel ${pistasLevel === 0 ? '1' : pistasLevel}`
      : `Grado ${selGrade}`;

    return (
      <div style={{ minHeight: '100dvh', background: '#0E0E12', display: 'flex', flexDirection: 'column' }}>
        {/* Header bar */}
        <div style={{ padding: `${SPACING[4]} ${SPACING[4]} ${SPACING[2]}`, borderBottom: `1px solid ${COLORS_UI.border}`, display: 'flex', alignItems: 'center', gap: SPACING[3] }}>
          <motion.button whileTap={{ scale: 0.94 }}
            onClick={() => setPhase('config')}
            style={{ background: 'transparent', border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, color: COLORS_UI.textMuted, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, padding: `${SPACING[1]} ${SPACING[3]}`, cursor: 'pointer' }}>
            ← Volver
          </motion.button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, letterSpacing: '0.08em' }}>
              MODO PRÁCTICA
            </div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.text }}>
              {PROBE_LABELS[selProbe]} · {levelLabel}
            </div>
          </div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
            {isGeneric ? 'Genérico' : char.name}
          </div>
        </div>

        {/* Probe */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <ProbeComponent
            key={probeKey}
            config={config}
            character={char}
            onComplete={handleComplete}
          />
        </div>
      </div>
    );
  }

  // ── Phase: result ────────────────────────────────────────────────────────────
  if (phase === 'result') {
    const r  = lastResult?.result ?? 'fail';
    const rs = RESULT_STYLE[r] ?? RESULT_STYLE.fail;
    const levelLabel = hasCatalog
      ? `Nivel ${pistasLevel === 0 ? '1' : pistasLevel}`
      : `Grado ${selGrade}`;

    return (
      <div style={{ minHeight: '100dvh', background: '#0E0E12', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: SPACING[6] }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: SPACING[4], alignItems: 'center' }}>

          {/* Result badge */}
          <div style={{ padding: `${SPACING[3]} ${SPACING[6]}`, background: rs.bg, border: `1px solid ${rs.border}`, borderRadius: BORDERS.radius.xl }}>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: rs.color, letterSpacing: '0.08em', textAlign: 'center' }}>
              {rs.label}
            </div>
          </div>

          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textMuted, textAlign: 'center' }}>
            {PROBE_LABELS[selProbe]} · {levelLabel}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2], width: '100%' }}>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleRetry}
              style={{ width: '100%', minHeight: '56px', background: COLORS_GAME.verde, border: 'none', borderRadius: BORDERS.radius.xl, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.black, color: 'white', cursor: 'pointer', letterSpacing: '0.1em' }}>
              REINTENTAR
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setPhase('config')}
              style={{ width: '100%', minHeight: '48px', background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.xl, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.textSecondary, cursor: 'pointer' }}>
              Cambiar configuración
            </motion.button>
            <button onClick={() => setScreen('home')}
              style={{ background: 'transparent', border: 'none', color: COLORS_UI.textMuted, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, cursor: 'pointer', textDecoration: 'underline', padding: SPACING[1] }}>
              Volver al inicio
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Phase: config ────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100dvh', background: '#0E0E12', display: 'flex', flexDirection: 'column', maxWidth: '460px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ padding: `${SPACING[5]} ${SPACING[4]} ${SPACING[3]}`, borderBottom: `1px solid ${COLORS_UI.border}`, display: 'flex', alignItems: 'center', gap: SPACING[3] }}>
        <motion.button whileTap={{ scale: 0.94 }}
          onClick={() => setScreen('home')}
          style={{ background: 'transparent', border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, color: COLORS_UI.textMuted, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, padding: `${SPACING[1]} ${SPACING[3]}`, cursor: 'pointer' }}>
          ←
        </motion.button>
        <div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text, letterSpacing: '0.06em' }}>
            Modo Práctica
          </div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
            Sin concentración · sin recompensas — entrena tu sincronía
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: SPACING[4], display: 'flex', flexDirection: 'column', gap: SPACING[5], paddingBottom: '100px' }}>

        {/* Selector de personaje */}
        <div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, letterSpacing: '0.08em', marginBottom: SPACING[2] }}>
            PERSONAJE
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING[2] }}>
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => setSelCharId(null)}
              style={{
                padding: `${SPACING[2]} ${SPACING[3]}`,
                background: isGeneric ? 'rgba(96,165,250,0.15)' : COLORS_UI.bgCard,
                border: `1px solid ${isGeneric ? 'rgba(96,165,250,0.5)' : COLORS_UI.border}`,
                borderRadius: BORDERS.radius.lg,
                color: isGeneric ? '#60A5FA' : COLORS_UI.textSecondary,
                fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold,
                cursor: 'pointer',
              }}>
              Genérico
            </motion.button>

            {activeChars.map(c => {
              const sel = selCharId === c.id;
              return (
                <motion.button key={c.id} whileTap={{ scale: 0.95 }}
                  onClick={() => setSelCharId(c.id)}
                  style={{
                    padding: `${SPACING[2]} ${SPACING[3]}`,
                    background: sel ? 'rgba(96,165,250,0.15)' : COLORS_UI.bgCard,
                    border: `1px solid ${sel ? 'rgba(96,165,250,0.5)' : COLORS_UI.border}`,
                    borderRadius: BORDERS.radius.lg,
                    color: sel ? '#60A5FA' : COLORS_UI.textSecondary,
                    fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold,
                    cursor: 'pointer',
                  }}>
                  {c.name} <span style={{ opacity: 0.6, fontSize: '10px' }}>G{c.grade}</span>
                </motion.button>
              );
            })}
          </div>
          {!isGeneric && char.passiveAbility && (
            <div style={{ marginTop: SPACING[2], fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: 'rgba(96,165,250,0.7)' }}>
              🛡 {char.passiveAbility.name} activa
            </div>
          )}
        </div>

        {/* Selector de prueba */}
        <div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, letterSpacing: '0.08em', marginBottom: SPACING[2] }}>
            PRUEBA ({probePool.length} disponibles)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[1] }}>
            {probePool.map(p => {
              const sel = selProbe === p;
              const hasCat = CATALOG_PROBES.has(p);
              return (
                <motion.button key={p} whileTap={{ scale: 0.98 }}
                  onClick={() => setSelProbe(p)}
                  style={{
                    padding: `${SPACING[2]} ${SPACING[3]}`,
                    background: sel ? 'rgba(255,215,0,0.08)' : COLORS_UI.bgCard,
                    border: `1px solid ${sel ? 'rgba(255,215,0,0.35)' : COLORS_UI.border}`,
                    borderRadius: BORDERS.radius.lg,
                    color: sel ? '#FFD700' : COLORS_UI.textSecondary,
                    fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: sel ? TYPOGRAPHY.weight.bold : 'normal',
                    cursor: 'pointer', textAlign: 'left',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                  <span>{PROBE_LABELS[p]}</span>
                  {hasCat && (
                    <span style={{ fontSize: '10px', opacity: 0.5, fontWeight: 'normal' }}>PISTAS</span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Dificultad: Nivel de pistas (catálogo) o Grado (tier) */}
        {hasCatalog ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: SPACING[2] }}>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, letterSpacing: '0.08em' }}>
                NIVEL DE PISTAS
              </div>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.black, color: '#FFD700' }}>
                {pistasLevel === 0 ? 'Nivel 1' : `${pistasLevel} / 20`}
              </div>
            </div>

            <input
              id="pistas-level-slider"
              type="range"
              min={0}
              max={20}
              step={1}
              value={pistasLevel}
              onChange={e => setPistasLevel(Number(e.target.value))}
              style={{
                width: '100%',
                accentColor: '#FFD700',
                cursor: 'pointer',
                marginBottom: SPACING[3],
              }}
            />

            {configSummary && (
              <div
                id="config-summary"
                style={{
                  padding: `${SPACING[2]} ${SPACING[3]}`,
                  background: 'rgba(255,215,0,0.05)',
                  border: '1px solid rgba(255,215,0,0.15)',
                  borderRadius: BORDERS.radius.lg,
                  fontFamily: TYPOGRAPHY.fontFamilyMono,
                  fontSize: TYPOGRAPHY.size.xs,
                  color: 'rgba(255,215,0,0.7)',
                  lineHeight: 1.6,
                }}>
                {configSummary}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, letterSpacing: '0.08em', marginBottom: SPACING[2] }}>
              GRADO
            </div>
            <div style={{ display: 'flex', gap: SPACING[1], flexWrap: 'wrap' }}>
              {GRADES.map(g => {
                const sel = selGrade === g;
                return (
                  <motion.button key={g} whileTap={{ scale: 0.92 }}
                    onClick={() => setSelGrade(g)}
                    style={{
                      width: '44px', height: '44px',
                      background: sel ? 'rgba(255,215,0,0.12)' : COLORS_UI.bgCard,
                      border: `1px solid ${sel ? 'rgba(255,215,0,0.45)' : COLORS_UI.border}`,
                      borderRadius: BORDERS.radius.lg,
                      color: sel ? '#FFD700' : COLORS_UI.textSecondary,
                      fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.sm, fontWeight: sel ? TYPOGRAPHY.weight.black : 'normal',
                      cursor: 'pointer',
                    }}>
                    {g}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* Toggle ayuda visual */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${SPACING[2]} 0` }}>
          <div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textSecondary, fontWeight: TYPOGRAPHY.weight.bold }}>
              Ayuda visual
            </div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
              Zona de margen y objetivo en la barra
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.92 }}
            onClick={() => setShowVisualAid(v => !v)}
            style={{
              padding: `${SPACING[1]} ${SPACING[3]}`,
              background: showVisualAid ? 'rgba(255,215,0,0.12)' : COLORS_UI.bgCard,
              border: `1px solid ${showVisualAid ? 'rgba(255,215,0,0.45)' : COLORS_UI.border}`,
              borderRadius: BORDERS.radius.lg,
              color: showVisualAid ? '#FFD700' : COLORS_UI.textMuted,
              fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold,
              cursor: 'pointer', minWidth: '56px',
            }}>
            {showVisualAid ? 'ON' : 'OFF'}
          </motion.button>
        </div>

      </div>

      {/* CTA fixed bottom */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '460px', padding: `${SPACING[3]} ${SPACING[4]}`, background: 'rgba(14,14,18,0.97)', borderTop: `1px solid ${COLORS_UI.border}`, backdropFilter: 'blur(8px)' }}>
        <motion.button whileTap={selProbe ? { scale: 0.97 } : {}}
          onClick={selProbe ? handleStart : undefined}
          disabled={!selProbe}
          style={{
            width: '100%', minHeight: '56px',
            background: selProbe ? COLORS_GAME.verde : COLORS_UI.bgCard,
            border: selProbe ? 'none' : `1px solid ${COLORS_UI.border}`,
            borderRadius: BORDERS.radius.xl,
            fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black,
            color: selProbe ? 'white' : COLORS_UI.textMuted,
            cursor: selProbe ? 'pointer' : 'not-allowed',
            letterSpacing: '0.1em',
            boxShadow: selProbe ? `0 4px 24px ${COLORS_GAME.verde}60` : 'none',
          }}>
          INICIAR PRÁCTICA
        </motion.button>
      </div>
    </div>
  );
}
