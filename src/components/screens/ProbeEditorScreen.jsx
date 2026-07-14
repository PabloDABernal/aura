/**
 * ProbeEditorScreen — Editor de configuraciones de prueba (GDD §8.1 §11.4).
 * Acceso desde TestBenchScreen cuando collectorLevel >= 15.
 * Funciones: sliders por prueba, preview de dificultad, guardar/cargar/compartir/importar configs.
 */
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../store/index.js';
import { DEFAULT_CONFIGS, PROBE_FAMILIES, PROBE_LABELS } from '../../data/probeEditorData.js';
import { CONFIG_COMPONENTS } from '../probes/ProbeConfigPanels.jsx';
import { PROBE_MAP } from '../probes/probeRegistry.js';
import { computeDifficultyScore } from '../../data/probeWeights.js';
import {
  COLORS_UI, COLORS_GAME,
  TYPOGRAPHY, SPACING, BORDERS,
} from '../../styles/tokens.js';

const MAX_SAVED = 5;
const MOCK_CHAR = { auraNumber: 42, auraAbility: { name: 'AURA TEST' }, ability: null };

function WeightBar({ score }) {
  const color = score <= 3 ? COLORS_GAME.verde : score <= 6 ? '#F59E0B' : '#E03B3B';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[1] }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, letterSpacing: '0.08em' }}>
          DIFICULTAD ESTIMADA
        </span>
        <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color }}>
          {score}/10
        </span>
      </div>
      <div style={{ display: 'flex', gap: 2, height: 6, borderRadius: 3, overflow: 'hidden' }}>
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} style={{
            flex: 1,
            background: i < score ? color : COLORS_UI.border,
            transition: 'background 0.15s',
          }} />
        ))}
      </div>
    </div>
  );
}

function SavedChips({ saved, onLoad, onDelete }) {
  if (!saved.length) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[1] }}>
      <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '10px', color: COLORS_UI.textMuted, letterSpacing: '0.08em' }}>
        GUARDADAS ({saved.length}/{MAX_SAVED})
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING[1] }}>
        {saved.map(entry => (
          <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: '2px', background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.md }}>
            <button onClick={() => onLoad(entry.config)}
              style={{ background: 'none', border: 'none', color: COLORS_UI.textSecondary, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, padding: `2px ${SPACING[2]}`, cursor: 'pointer' }}>
              {entry.name}
            </button>
            <button onClick={() => onDelete(entry.id)}
              style={{ background: 'none', border: 'none', color: COLORS_UI.textMuted, fontSize: '10px', padding: '2px 4px 2px 0', cursor: 'pointer', lineHeight: 1 }}>
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProbeEditorScreen() {
  const { setScreen, meta, dispatchMeta } = useStore(s => ({
    setScreen:   s.setScreen,
    meta:        s.meta,
    dispatchMeta: s.dispatchMeta,
  }));

  const savedProbeConfigs = meta?.savedProbeConfigs ?? {};

  const [phase,       setPhase]       = useState('config');
  const [probeType,   setProbeType]   = useState('bingo');
  const [configs,     setConfigs]     = useState({ ...DEFAULT_CONFIGS });
  const [probeKey,    setProbeKey]    = useState(0);
  const [lastResult,  setLastResult]  = useState(null);

  // Save modal: false | 'name' | 'delete'
  const [saveModal,    setSaveModal]    = useState(false);
  const [saveName,     setSaveName]     = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Share modal
  const [shareModal,   setShareModal]   = useState(false);
  const [shareString,  setShareString]  = useState('');
  const [copied,       setCopied]       = useState(false);

  // Import
  const [importText,   setImportText]   = useState('');
  const [importMsg,    setImportMsg]    = useState(null); // { ok: bool, text: string }

  const cfg   = configs[probeType];
  const score = computeDifficultyScore(probeType, cfg);
  const saved = savedProbeConfigs[probeType] ?? [];

  const setTypeCfg = patch => setConfigs(prev => ({ ...prev, [probeType]: patch }));

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleStart    = () => { setLastResult(null); setPhase('running'); };
  const handleAbort    = () => { setLastResult(null); setPhase('config'); setProbeKey(k => k + 1); };
  const handleComplete = res => { setLastResult(res); setPhase('result'); };
  const handleRetry    = () => { setLastResult(null); setProbeKey(k => k + 1); setPhase('running'); };

  const openSaveModal = () => {
    setSaveName('');
    setSaveModal(saved.length >= MAX_SAVED ? 'delete' : 'name');
    setDeleteTarget(null);
  };

  const confirmSave = (nameToUse) => {
    if (!nameToUse.trim()) return;
    dispatchMeta({
      type: 'SAVE_PROBE_CONFIG',
      probeType,
      entry: {
        id:        crypto.randomUUID(),
        name:      nameToUse.trim().slice(0, 20),
        config:    { ...cfg },
        createdAt: Date.now(),
      },
    });
    setSaveModal(false);
  };

  const confirmDeleteThenSave = () => {
    if (!deleteTarget) return;
    dispatchMeta({ type: 'DELETE_PROBE_CONFIG', probeType, id: deleteTarget });
    // After deletion, open name modal
    setSaveModal('name');
    setDeleteTarget(null);
  };

  const handleShare = () => {
    const str = btoa(JSON.stringify({ t: probeType, c: cfg }));
    setShareString(str);
    setCopied(false);
    setShareModal(true);
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(shareString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleImport = () => {
    setImportMsg(null);
    try {
      const decoded = JSON.parse(atob(importText.trim()));
      if (!decoded.t || !decoded.c || typeof decoded.c !== 'object') throw new Error();
      const defaults = DEFAULT_CONFIGS[decoded.t];
      if (!defaults) throw new Error('Tipo de prueba desconocido');
      // Clamp: merge with defaults to ensure all keys present
      const clamped = { ...defaults, ...decoded.c };
      setProbeType(decoded.t);
      setConfigs(prev => ({ ...prev, [decoded.t]: clamped }));
      const ts = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
      confirmSave(`Importada ${ts}`);
      setImportText('');
      setImportMsg({ ok: true, text: `Cargada: ${PROBE_LABELS[decoded.t] ?? decoded.t}` });
    } catch {
      setImportMsg({ ok: false, text: 'Código inválido. Verifica que copiaste la config completa.' });
    }
  };

  const handleLoadSaved = (savedCfg) => {
    setTypeCfg({ ...savedCfg });
  };

  const handleDeleteSaved = (id) => {
    dispatchMeta({ type: 'DELETE_PROBE_CONFIG', probeType, id });
  };

  const ActiveProbe  = PROBE_MAP[probeType];
  const ActiveConfig = CONFIG_COMPONENTS[probeType];

  // ── CONFIG phase ──────────────────────────────────────────────────────────────
  if (phase === 'config') {
    return (
      <div style={{ minHeight: '100dvh', background: COLORS_UI.bg, maxWidth: '460px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[3], padding: `${SPACING[4]} ${SPACING[4]} ${SPACING[3]}`, borderBottom: `1px solid ${COLORS_UI.border}`, position: 'sticky', top: 0, background: COLORS_UI.bg, zIndex: 10 }}>
          <button onClick={() => setScreen('test-bench')} style={{ background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, color: COLORS_UI.text, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, padding: `${SPACING[2]} ${SPACING[3]}`, cursor: 'pointer' }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text }}>Editor de Pruebas</div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, marginTop: '1px' }}>Guarda y comparte configuraciones</div>
          </div>
          <div style={{ padding: `1px ${SPACING[2]}`, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: BORDERS.radius.full, fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '10px', color: '#A78BFA' }}>
            Lv.15+
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: SPACING[4], display: 'flex', flexDirection: 'column', gap: SPACING[5], paddingBottom: '120px' }}>

          {/* Probe selector */}
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
                    const active    = probeType === key;
                    const ProbeCfg  = CONFIG_COMPONENTS[key];
                    const keySaved  = savedProbeConfigs[key] ?? [];
                    const keyCfg    = configs[key];
                    const keyScore  = active ? score : computeDifficultyScore(key, keyCfg);
                    return (
                      <div key={key}>
                        <motion.button whileTap={{ scale: 0.98 }} onClick={() => setProbeType(key)}
                          style={{ width: '100%', padding: `${SPACING[2]} ${SPACING[3]}`, background: active ? COLORS_UI.bgElevated : COLORS_UI.bgCard, border: active ? `1.5px solid #A78BFA` : `1px solid ${COLORS_UI.border}`, borderRadius: active ? `${BORDERS.radius.lg} ${BORDERS.radius.lg} 0 0` : BORDERS.radius.lg, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[2] }}>
                            <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: active ? TYPOGRAPHY.weight.bold : TYPOGRAPHY.weight.regular, color: active ? COLORS_UI.text : COLORS_UI.textSecondary }}>
                              {PROBE_LABELS[key]}
                            </span>
                            {keySaved.length > 0 && (
                              <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '9px', color: '#A78BFA', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: BORDERS.radius.full, padding: '1px 5px' }}>
                                {keySaved.length}
                              </span>
                            )}
                          </div>
                          <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '11px', color: active ? '#A78BFA' : COLORS_UI.textMuted }}>
                            {active ? '▲' : '▼'}
                          </span>
                        </motion.button>

                        <AnimatePresence initial={false}>
                          {active && (
                            <motion.div
                              key="editor-panel"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.22, ease: 'easeInOut' }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div style={{ background: COLORS_UI.bgCard, border: '1.5px solid #A78BFA', borderTop: 'none', borderRadius: `0 0 ${BORDERS.radius.lg} ${BORDERS.radius.lg}`, padding: SPACING[3], display: 'flex', flexDirection: 'column', gap: SPACING[3] }}>

                                {/* Weight preview */}
                                <WeightBar score={score} />

                                {/* Saved configs chips */}
                                <SavedChips
                                  saved={saved}
                                  onLoad={handleLoadSaved}
                                  onDelete={handleDeleteSaved}
                                />

                                {/* Config sliders */}
                                {ProbeCfg && <ProbeCfg cfg={cfg} set={setTypeCfg} />}

                                {/* Action row */}
                                <div style={{ display: 'flex', gap: SPACING[2] }}>
                                  <motion.button whileTap={{ scale: 0.97 }} onClick={openSaveModal}
                                    style={{ flex: 1, minHeight: '40px', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.4)', borderRadius: BORDERS.radius.lg, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color: '#A78BFA', cursor: 'pointer' }}>
                                    💾 Guardar
                                  </motion.button>
                                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleShare}
                                    style={{ flex: 1, minHeight: '40px', background: 'rgba(96,165,250,0.10)', border: '1px solid rgba(96,165,250,0.35)', borderRadius: BORDERS.radius.lg, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color: '#60A5FA', cursor: 'pointer' }}>
                                    ↗ Compartir
                                  </motion.button>
                                </div>

                                {/* Reset */}
                                <button onClick={() => setTypeCfg({ ...DEFAULT_CONFIGS[probeType] })}
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

          {/* Import section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, letterSpacing: '0.08em' }}>
              IMPORTAR CONFIG
            </div>
            <div style={{ display: 'flex', gap: SPACING[2] }}>
              <input
                value={importText}
                onChange={e => { setImportText(e.target.value); setImportMsg(null); }}
                placeholder="Pega el código aquí..."
                style={{ flex: 1, background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.md, color: COLORS_UI.text, fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, padding: `${SPACING[2]} ${SPACING[3]}`, outline: 'none' }}
              />
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleImport} disabled={!importText.trim()}
                style={{ padding: `${SPACING[2]} ${SPACING[3]}`, background: importText.trim() ? 'rgba(96,165,250,0.12)' : COLORS_UI.bgElevated, border: `1px solid ${importText.trim() ? 'rgba(96,165,250,0.4)' : COLORS_UI.border}`, borderRadius: BORDERS.radius.md, color: importText.trim() ? '#60A5FA' : COLORS_UI.textMuted, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, cursor: importText.trim() ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}>
                Importar
              </motion.button>
            </div>
            {importMsg && (
              <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: importMsg.ok ? COLORS_GAME.verde : '#E03B3B' }}>
                {importMsg.text}
              </span>
            )}
          </div>
        </div>

        {/* Sticky bottom: PROBAR */}
        <div style={{ position: 'sticky', bottom: 0, background: COLORS_UI.bg, borderTop: `1px solid ${COLORS_UI.border}`, padding: SPACING[4] }}>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, textAlign: 'center', marginBottom: SPACING[2] }}>
            {PROBE_LABELS[probeType].toUpperCase()} — dificultad {score}/10
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleStart}
            style={{ width: '100%', minHeight: '60px', background: COLORS_GAME.verde, border: 'none', borderRadius: BORDERS.radius.xl, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: 'white', letterSpacing: '0.14em', cursor: 'pointer', boxShadow: `0 4px 24px ${COLORS_GAME.verde}60` }}>
            ▶ PROBAR
          </motion.button>
        </div>

        {/* ── SAVE MODAL: name input ── */}
        <AnimatePresence>
          {saveModal === 'name' && (
            <motion.div key="save-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSaveModal(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: SPACING[4] }}>
              <motion.div
                initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.88, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                onClick={e => e.stopPropagation()}
                style={{ background: COLORS_UI.bgElevated, borderRadius: BORDERS.radius.xl, padding: SPACING[5], maxWidth: '320px', width: '100%', display: 'flex', flexDirection: 'column', gap: SPACING[4], border: '1px solid rgba(167,139,250,0.3)' }}>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text }}>
                  Guardar configuración
                </div>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
                  {PROBE_LABELS[probeType]} · Dificultad {score}/10
                </div>
                <input
                  autoFocus
                  maxLength={20}
                  value={saveName}
                  onChange={e => setSaveName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && confirmSave(saveName)}
                  placeholder="Nombre (máx. 20 caracteres)"
                  style={{ background: COLORS_UI.bg, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.md, color: COLORS_UI.text, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, padding: `${SPACING[2]} ${SPACING[3]}`, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: SPACING[2] }}>
                  <button onClick={() => setSaveModal(false)}
                    style={{ flex: 1, minHeight: '44px', background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, color: COLORS_UI.text, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  <button onClick={() => confirmSave(saveName)} disabled={!saveName.trim()}
                    style={{ flex: 1, minHeight: '44px', background: saveName.trim() ? 'rgba(167,139,250,0.2)' : COLORS_UI.bgCard, border: `1px solid ${saveName.trim() ? 'rgba(167,139,250,0.5)' : COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, color: saveName.trim() ? '#A78BFA' : COLORS_UI.textMuted, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, cursor: saveName.trim() ? 'pointer' : 'not-allowed' }}>
                    Guardar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SAVE MODAL: delete to make room ── */}
        <AnimatePresence>
          {saveModal === 'delete' && (
            <motion.div key="delete-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSaveModal(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: SPACING[4] }}>
              <motion.div
                initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.88, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                onClick={e => e.stopPropagation()}
                style={{ background: COLORS_UI.bgElevated, borderRadius: BORDERS.radius.xl, padding: SPACING[5], maxWidth: '320px', width: '100%', display: 'flex', flexDirection: 'column', gap: SPACING[3], border: '1px solid rgba(224,59,59,0.25)' }}>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text }}>
                  Límite alcanzado
                </div>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
                  Tienes {MAX_SAVED} configs guardadas para esta prueba. Elimina una para continuar.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[1] }}>
                  {saved.map(entry => (
                    <button key={entry.id} onClick={() => setDeleteTarget(entry.id)}
                      style={{ padding: `${SPACING[2]} ${SPACING[3]}`, background: deleteTarget === entry.id ? 'rgba(224,59,59,0.15)' : COLORS_UI.bgCard, border: `1px solid ${deleteTarget === entry.id ? 'rgba(224,59,59,0.5)' : COLORS_UI.border}`, borderRadius: BORDERS.radius.md, color: deleteTarget === entry.id ? '#E03B3B' : COLORS_UI.textSecondary, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{entry.name}</span>
                      <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '10px', color: COLORS_UI.textMuted }}>
                        {new Date(entry.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                      </span>
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: SPACING[2] }}>
                  <button onClick={() => setSaveModal(false)}
                    style={{ flex: 1, minHeight: '40px', background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, color: COLORS_UI.text, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  <button onClick={confirmDeleteThenSave} disabled={!deleteTarget}
                    style={{ flex: 1, minHeight: '40px', background: deleteTarget ? 'rgba(224,59,59,0.15)' : COLORS_UI.bgCard, border: `1px solid ${deleteTarget ? 'rgba(224,59,59,0.4)' : COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, color: deleteTarget ? '#E03B3B' : COLORS_UI.textMuted, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, cursor: deleteTarget ? 'pointer' : 'not-allowed' }}>
                    Eliminar y continuar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SHARE MODAL ── */}
        <AnimatePresence>
          {shareModal && (
            <motion.div key="share-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShareModal(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: SPACING[4] }}>
              <motion.div
                initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.88, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                onClick={e => e.stopPropagation()}
                style={{ background: COLORS_UI.bgElevated, borderRadius: BORDERS.radius.xl, padding: SPACING[5], maxWidth: '340px', width: '100%', display: 'flex', flexDirection: 'column', gap: SPACING[4], border: '1px solid rgba(96,165,250,0.25)' }}>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text }}>
                  Compartir config
                </div>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
                  {PROBE_LABELS[probeType]} · Dificultad {score}/10
                </div>
                {/* Preview */}
                <div style={{ background: COLORS_UI.bg, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.md, padding: SPACING[3] }}>
                  <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, marginBottom: SPACING[1] }}>
                    PREVIEW (8 chars)
                  </div>
                  <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.bold, color: '#60A5FA', letterSpacing: '0.12em' }}>
                    {shareString.slice(0, 8)}…
                  </div>
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleCopy}
                  style={{ minHeight: '48px', background: copied ? 'rgba(59,168,79,0.15)' : 'rgba(96,165,250,0.12)', border: `1px solid ${copied ? 'rgba(59,168,79,0.5)' : 'rgba(96,165,250,0.4)'}`, borderRadius: BORDERS.radius.lg, color: copied ? COLORS_GAME.verde : '#60A5FA', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, cursor: 'pointer' }}>
                  {copied ? '✓ Copiado' : 'Copiar config completa'}
                </motion.button>
                <button onClick={() => setShareModal(false)}
                  style={{ background: 'transparent', border: 'none', color: COLORS_UI.textMuted, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, cursor: 'pointer', textDecoration: 'underline' }}>
                  Cerrar
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── RUNNING phase ─────────────────────────────────────────────────────────────
  if (phase === 'running') {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: COLORS_UI.bg, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${SPACING[3]} ${SPACING[4]}`, borderBottom: `1px solid ${COLORS_UI.border}` }}>
          <div>
            <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, letterSpacing: '0.08em' }}>
              {PROBE_LABELS[probeType].toUpperCase()}
            </span>
            <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '10px', color: COLORS_UI.textMuted, marginLeft: SPACING[2] }}>
              · dif {score}/10
            </span>
          </div>
          <button onClick={handleAbort}
            style={{ background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, color: COLORS_UI.textSecondary, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, padding: `${SPACING[1]} ${SPACING[3]}`, cursor: 'pointer' }}>
            Abandonar
          </button>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {ActiveProbe && (
            <ActiveProbe key={probeKey} config={cfg} character={MOCK_CHAR} onComplete={handleComplete} />
          )}
        </div>
      </div>
    );
  }

  // ── RESULT phase ──────────────────────────────────────────────────────────────
  if (phase === 'result' && lastResult) {
    const isPass = lastResult.result !== 'fail';
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: COLORS_UI.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: SPACING[6], padding: SPACING[6] }}>
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: SPACING[3] }}>
          <div style={{ fontSize: '64px', lineHeight: 1 }}>{isPass ? '✅' : '❌'}</div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size['2xl'], fontWeight: TYPOGRAPHY.weight.black, color: isPass ? '#3BA84F' : COLORS_GAME.rojo, letterSpacing: '0.1em' }}>
            {isPass ? (lastResult.result === 'perfect' ? 'PERFECTO' : 'SUPERADO') : 'FALLADO'}
          </div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textMuted }}>
            {PROBE_LABELS[probeType]}
            {lastResult.auraTriggered && <span style={{ color: '#FFD700', marginLeft: '8px' }}>✨ Aura #42</span>}
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
