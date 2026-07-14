/**
 * TestBenchScreen — banco de pruebas. Configura y ejecuta cada tipo de prueba libremente.
 * Pruebas con catálogo (bingo/espejo/pendulo/parpadeo): nivel de pistas 0–20.
 * Resto de pruebas: sliders de parámetros manuales.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../store/index.js';
import { DEFAULT_CONFIGS, PROBE_FAMILIES, PROBE_LABELS } from '../../data/probeEditorData.js';
import { CONFIG_COMPONENTS, AuraBox } from '../probes/ProbeConfigPanels.jsx';
import { PROBE_MAP } from '../probes/probeRegistry.js';
import { resolveConfigFromPistas, PROBE_PISTAS } from '../../data/probePistas.js';
import { applyProbeConfig } from '../../engine/abilities/abilityEngine.js';
import {
  COLORS_UI, COLORS_GAME,
  TYPOGRAPHY, SPACING, BORDERS,
} from '../../styles/tokens.js';

const CATALOG_PROBES = new Set(Object.keys(PROBE_PISTAS));

const GENERIC_CHAR = {
  id: 'bench-generic',
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

function formatBenchSummary(probeType, cfg) {
  if (!cfg) return null;
  switch (probeType) {
    case 'bingo':    return `Objetivos ${cfg.targets} · Margen ±${cfg.margin} · Tiempo ${cfg.timeLimitSec}s · Paradas ${cfg.maxStops}`;
    case 'espejo':   return `Aciertos ${cfg.requiredHits} · Margen ±${cfg.margin} · Duración ${cfg.duration}s · Paradas ${cfg.maxStops}`;
    case 'pendulo':  return `Oscilaciones ${cfg.swings} · Duración ${cfg.swingDuration}s · Margen ±${cfg.margin} · Paradas ${cfg.maxStops}`;
    case 'parpadeo': return `Duración ${cfg.totalSec}s · Ciclo ${cfg.range}cs · Margen ±${cfg.margin}`;
    default: return null;
  }
}

export default function TestBenchScreen() {
  const setScreen      = useStore(s => s.setScreen);
  const characters     = useStore(s => s.characters);
  const collectorLevel = useStore(s => s.meta?.collectorLevel ?? 1);

  const [selCharId,    setSelCharId]    = useState(null); // null = genérico
  const [probeType,    setProbeType]    = useState('bingo');
  const [configs,      setConfigs]      = useState({ ...DEFAULT_CONFIGS });
  const [pistasLevels, setPistasLevels] = useState(
    () => Object.fromEntries(Object.keys(PROBE_PISTAS).map(k => [k, 0]))
  );
  const [phase,        setPhase]        = useState('config');
  const [probeKey,     setProbeKey]     = useState(0);
  const [lastResult,   setLastResult]   = useState(null);

  const activeChars = Object.values(characters).filter(c => c.status === 'active');
  const char        = selCharId ? (characters[selCharId] ?? GENERIC_CHAR) : GENERIC_CHAR;
  const isGeneric   = !selCharId;

  const handleStart    = () => { setLastResult(null); setPhase('running'); };
  const handleAbort    = () => { setLastResult(null); setPhase('config'); setProbeKey(k => k + 1); };
  const handleComplete = res => { setLastResult(res); setPhase('result'); };
  const handleRetry    = () => { setLastResult(null); setProbeKey(k => k + 1); setPhase('running'); };

  const ActiveProbe = PROBE_MAP[probeType];

  // ── CONFIG ──────────────────────────────────────────────────────────────────
  if (phase === 'config') {
    return (
      <div style={{ minHeight: '100dvh', background: COLORS_UI.bg, maxWidth: '460px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[3], padding: `${SPACING[4]} ${SPACING[4]} ${SPACING[3]}`, borderBottom: `1px solid ${COLORS_UI.border}`, position: 'sticky', top: 0, background: COLORS_UI.bg, zIndex: 10 }}>
          <button onClick={() => setScreen('home')} style={{ background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, color: COLORS_UI.text, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, padding: `${SPACING[2]} ${SPACING[3]}`, cursor: 'pointer' }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text }}>Banco de Pruebas</div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, marginTop: '1px' }}>Configura y prueba sin consecuencias</div>
          </div>
          {collectorLevel >= 15 && (
            <button onClick={() => setScreen('probe-editor')}
              style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.35)', borderRadius: BORDERS.radius.lg, color: '#A78BFA', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, padding: `${SPACING[2]} ${SPACING[3]}`, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              ✏️ Editor
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: SPACING[4], display: 'flex', flexDirection: 'column', gap: SPACING[5], paddingBottom: SPACING[12] }}>

          {/* Selector de personaje */}
          <div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, letterSpacing: '0.08em', marginBottom: SPACING[2] }}>
              PERSONAJE (auraNumber para la caja AURA)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING[2] }}>
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => setSelCharId(null)}
                style={{
                  padding: `${SPACING[1]} ${SPACING[3]}`,
                  background: isGeneric ? 'rgba(96,165,250,0.15)' : COLORS_UI.bgCard,
                  border: `1px solid ${isGeneric ? 'rgba(96,165,250,0.5)' : COLORS_UI.border}`,
                  borderRadius: BORDERS.radius.lg,
                  color: isGeneric ? '#60A5FA' : COLORS_UI.textSecondary,
                  fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold,
                  cursor: 'pointer',
                }}>
                Genérico <span style={{ opacity: 0.5, fontWeight: 'normal' }}>#99</span>
              </motion.button>
              {activeChars.map(c => {
                const sel = selCharId === c.id;
                return (
                  <motion.button key={c.id} whileTap={{ scale: 0.95 }}
                    onClick={() => setSelCharId(c.id)}
                    style={{
                      padding: `${SPACING[1]} ${SPACING[3]}`,
                      background: sel ? 'rgba(96,165,250,0.15)' : COLORS_UI.bgCard,
                      border: `1px solid ${sel ? 'rgba(96,165,250,0.5)' : COLORS_UI.border}`,
                      borderRadius: BORDERS.radius.lg,
                      color: sel ? '#60A5FA' : COLORS_UI.textSecondary,
                      fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold,
                      cursor: 'pointer',
                    }}>
                    {c.name} <span style={{ opacity: 0.5, fontWeight: 'normal', fontSize: '10px' }}>#{c.auraNumber}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Tipo de prueba */}
          <div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, letterSpacing: '0.08em', marginBottom: SPACING[2] }}>
              TIPO DE PRUEBA
            </div>
            {PROBE_FAMILIES.map(family => (
              <div key={family.id} style={{ marginBottom: SPACING[3] }}>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '10px', color: COLORS_UI.textMuted, letterSpacing: '0.1em', marginBottom: SPACING[2], paddingLeft: SPACING[1] }}>
                  {family.id} — {family.name.toUpperCase()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[1] }}>
                  {family.probes.map(key => {
                    const active      = probeType === key;
                    const hasCatalog  = CATALOG_PROBES.has(key);
                    const ProbeCfg    = CONFIG_COMPONENTS[key];
                    const nivel       = pistasLevels[key] ?? 0;
                    const previewCfg  = hasCatalog ? resolveConfigFromPistas(key, nivel) : null;
                    const summary     = formatBenchSummary(key, previewCfg);

                    return (
                      <div key={key}>
                        <motion.button whileTap={{ scale: 0.98 }} onClick={() => setProbeType(key)}
                          style={{ width: '100%', padding: `${SPACING[2]} ${SPACING[3]}`, background: active ? COLORS_UI.bgElevated : COLORS_UI.bgCard, border: active ? `1.5px solid ${COLORS_GAME.verde}` : `1px solid ${COLORS_UI.border}`, borderRadius: active ? `${BORDERS.radius.lg} ${BORDERS.radius.lg} 0 0` : BORDERS.radius.lg, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: active ? TYPOGRAPHY.weight.bold : TYPOGRAPHY.weight.regular, color: active ? COLORS_UI.text : COLORS_UI.textSecondary }}>
                            {PROBE_LABELS[key]}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[2] }}>
                            {hasCatalog && (
                              <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '10px', color: active ? COLORS_GAME.verde : COLORS_UI.textMuted, opacity: 0.7 }}>PISTAS</span>
                            )}
                            <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '11px', color: active ? COLORS_GAME.verde : COLORS_UI.textMuted }}>
                              {active ? '▲' : '▼'}
                            </span>
                          </div>
                        </motion.button>

                        <AnimatePresence initial={false}>
                          {active && (
                            <motion.div
                              key="config"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.22, ease: 'easeInOut' }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div style={{ background: COLORS_UI.bgCard, border: `1.5px solid ${COLORS_GAME.verde}`, borderTop: 'none', borderRadius: `0 0 ${BORDERS.radius.lg} ${BORDERS.radius.lg}`, padding: SPACING[3], display: 'flex', flexDirection: 'column', gap: SPACING[3] }}>
                                <motion.button whileTap={{ scale: 0.97 }} onClick={handleStart}
                                  style={{ width: '100%', minHeight: '52px', background: COLORS_GAME.verde, border: 'none', borderRadius: BORDERS.radius.lg, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.black, color: 'white', letterSpacing: '0.1em', cursor: 'pointer', boxShadow: `0 2px 16px ${COLORS_GAME.verde}50` }}>
                                  ▶ PROBAR
                                </motion.button>

                                {hasCatalog ? (
                                  /* ── Prueba con catálogo: nivel de pistas ── */
                                  <>
                                    <div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: SPACING[2] }}>
                                        <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textSecondary }}>
                                          Nivel de pistas
                                        </span>
                                        <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.black, color: '#FFD700' }}>
                                          {nivel === 0 ? 'Nivel 1' : `${nivel} / 20`}
                                        </span>
                                      </div>
                                      <input
                                        type="range"
                                        min={0}
                                        max={20}
                                        step={1}
                                        value={nivel}
                                        onChange={e => setPistasLevels(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                                        style={{ width: '100%', accentColor: '#FFD700', cursor: 'pointer', marginBottom: SPACING[2] }}
                                      />
                                      {summary && (
                                        <div style={{
                                          padding: `${SPACING[2]} ${SPACING[3]}`,
                                          background: 'rgba(255,215,0,0.05)',
                                          border: '1px solid rgba(255,215,0,0.15)',
                                          borderRadius: BORDERS.radius.lg,
                                          fontFamily: TYPOGRAPHY.fontFamilyMono,
                                          fontSize: TYPOGRAPHY.size.xs,
                                          color: 'rgba(255,215,0,0.7)',
                                          lineHeight: 1.6,
                                        }}>
                                          {summary}
                                        </div>
                                      )}
                                    </div>
                                    <AuraBox probeType={key} auraNumber={char.auraNumber} />
                                  </>
                                ) : (
                                  /* ── Prueba sin catálogo: sliders manuales ── */
                                  ProbeCfg && (
                                    <ProbeCfg
                                      cfg={configs[key]}
                                      set={patch => setConfigs(prev => ({ ...prev, [key]: patch }))}
                                      auraNumber={char.auraNumber}
                                    />
                                  )
                                )}

                                <button
                                  onClick={() => {
                                    if (hasCatalog) {
                                      setPistasLevels(prev => ({ ...prev, [key]: 0 }));
                                    } else {
                                      setConfigs(prev => ({ ...prev, [key]: { ...DEFAULT_CONFIGS[key] } }));
                                    }
                                  }}
                                  style={{ background: 'transparent', border: 'none', color: COLORS_UI.textMuted, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, cursor: 'pointer', textDecoration: 'underline', padding: 0, alignSelf: 'flex-start' }}>
                                  Restablecer por defecto
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Botón PROBAR sticky */}
        <div style={{ position: 'sticky', bottom: 0, background: COLORS_UI.bg, borderTop: `1px solid ${COLORS_UI.border}`, padding: SPACING[4] }}>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleStart}
            style={{ width: '100%', minHeight: '60px', background: COLORS_GAME.verde, border: 'none', borderRadius: BORDERS.radius.xl, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: 'white', letterSpacing: '0.14em', cursor: 'pointer', boxShadow: `0 4px 24px ${COLORS_GAME.verde}60` }}>
            ▶ PROBAR
          </motion.button>
        </div>
      </div>
    );
  }

  // ── RUNNING ──────────────────────────────────────────────────────────────────
  if (phase === 'running') {
    const effectiveCfg = CATALOG_PROBES.has(probeType)
      ? applyProbeConfig(resolveConfigFromPistas(probeType, pistasLevels[probeType] ?? 0), char, probeType, 0)
      : configs[probeType];

    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: COLORS_UI.bg, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${SPACING[3]} ${SPACING[4]}`, borderBottom: `1px solid ${COLORS_UI.border}` }}>
          <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, letterSpacing: '0.08em' }}>
            {PROBE_LABELS[probeType].toUpperCase()}
          </span>
          <button onClick={handleAbort}
            style={{ background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, color: COLORS_UI.textSecondary, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, padding: `${SPACING[1]} ${SPACING[3]}`, cursor: 'pointer' }}>
            Abandonar
          </button>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {ActiveProbe && (
            <ActiveProbe key={probeKey} config={effectiveCfg} character={char} onComplete={handleComplete} />
          )}
        </div>
      </div>
    );
  }

  // ── RESULT ───────────────────────────────────────────────────────────────────
  if (phase === 'result' && lastResult) {
    const isPass = lastResult.result !== 'fail';
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: COLORS_UI.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: SPACING[6], padding: SPACING[6] }}>
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: SPACING[3] }}
        >
          <div style={{ fontSize: '64px', lineHeight: 1 }}>{isPass ? '✅' : '❌'}</div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size['2xl'], fontWeight: TYPOGRAPHY.weight.black, color: isPass ? '#3BA84F' : COLORS_GAME.rojo, letterSpacing: '0.1em' }}>
            {isPass ? (lastResult.result === 'perfect' ? 'PERFECTO' : 'SUPERADO') : 'FALLADO'}
          </div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textMuted }}>
            {PROBE_LABELS[probeType]}
            {lastResult.auraTriggered && <span style={{ color: '#FFD700', marginLeft: '8px' }}>✨ Aura #{char.auraNumber}</span>}
          </div>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[3], width: '100%' }}>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleRetry}
            style={{ width: '100%', minHeight: '56px', background: COLORS_GAME.verde, border: 'none', borderRadius: BORDERS.radius.xl, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: 'white', letterSpacing: '0.12em', cursor: 'pointer', boxShadow: `0 4px 24px ${COLORS_GAME.verde}60` }}>
            REINTENTAR
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setPhase('config')}
            style={{ width: '100%', minHeight: '48px', background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.xl, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.text, letterSpacing: '0.06em', cursor: 'pointer' }}>
            Cambiar configuración
          </motion.button>
          <button onClick={() => setScreen('home')}
            style={{ background: 'transparent', border: 'none', color: COLORS_UI.textMuted, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, cursor: 'pointer', textDecoration: 'underline' }}>
            Volver al menú
          </button>
        </div>
      </div>
    );
  }

  return null;
}
