/**
 * HomeScreen — contenedor con 4 tabs.
 * GDD v3.0 + D1 (economía) + D2 (collector) + D3 (coronas, récords).
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../store/index.js';
import ImageCropModal from '../ui/ImageCropModal.jsx';
import {
  COLORS_UI, COLORS_GAME,
  TYPOGRAPHY, SPACING, BORDERS, SHADOWS,
} from '../../styles/tokens.js';
import { XP_FOR_LEVEL, REACTIVATE_COST } from '../../data/economyConfig.js';
import { getTodayStr, getDailyCondition }  from '../../engine/run/dailyChallenge.js';
import { startDrone, stopDrone } from '../../engine/audio/audioEngine.js';
import TestBenchScreen from './TestBenchScreen.jsx';
import SettingsScreen  from './SettingsScreen.jsx';

// ── Grade styling ──────────────────────────────────────────────────────────────
function getGradeStyle(grade) {
  if (grade >= 10) return { border: '2px solid #FFD700', boxShadow: '0 0 20px rgba(255,215,0,0.35), 0 0 8px rgba(255,215,0,0.2)' };
  if (grade >= 7)  return { border: '1.5px solid rgba(255,215,0,0.55)', boxShadow: '0 0 10px rgba(255,215,0,0.15)' };
  if (grade >= 4)  return { border: '1px solid rgba(96,165,250,0.45)', boxShadow: 'none' };
  return { border: `1px solid ${COLORS_UI.border}`, boxShadow: SHADOWS.sm };
}

function gradeStars(grade) {
  const filled = Math.ceil((grade ?? 1) / 2);
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}

// ── EmptyState ────────────────────────────────────────────────────────────────
function EmptyState({ onCreateChar }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: SPACING[5], textAlign: 'center' }}>
      <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '48px', filter: 'drop-shadow(0 0 20px #FFD70044)' }}>⚡</div>
      <div>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg, color: COLORS_UI.textSecondary }}>Aún no has capturado ninguna resonancia.</div>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textMuted, maxWidth: '260px', marginTop: SPACING[2] }}>El tiempo está lleno de ellas, esperando.</div>
      </div>
      <motion.button whileTap={{ scale: 0.97 }} onClick={onCreateChar}
        style={{ padding: `${SPACING[3]} ${SPACING[6]}`, background: COLORS_GAME.verde, border: 'none', borderRadius: BORDERS.radius.xl, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.bold, color: 'white', cursor: 'pointer', letterSpacing: '0.08em', boxShadow: `0 4px 20px ${COLORS_GAME.verde}60` }}>
        + CREAR PERSONAJE
      </motion.button>
    </div>
  );
}

// ── Carta de personaje ────────────────────────────────────────────────────────
function CharCard({ char, onClick, gradeBadge }) {
  const initials  = (char.name ?? '?').slice(0, 2).toUpperCase();
  const { border, boxShadow } = getGradeStyle(char.grade ?? 1);
  const starColor = char.grade >= 8 ? '#FFD700' : char.grade >= 4 ? '#60A5FA' : COLORS_UI.textMuted;
  const crowns    = Math.min(char.stats?.crowns ?? 0, 10);

  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={() => onClick(char)}
      style={{ background: COLORS_UI.bgCard, border, borderRadius: BORDERS.radius.xl, padding: `${SPACING[3]} ${SPACING[2]} ${SPACING[2]}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: SPACING[1], minWidth: '96px', position: 'relative', boxShadow }}
    >
      {/* Aura number */}
      <div style={{ position: 'absolute', top: '4px', right: '6px', fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '9px', fontWeight: TYPOGRAPHY.weight.black, color: char.grade >= 7 ? '#FFD70066' : '#FFFFFF18', letterSpacing: '0.05em' }}>
        #{String(char.auraNumber).padStart(2, '0')}
      </div>

      {/* Grade badge */}
      <AnimatePresence>
        {gradeBadge && (
          <motion.div key="grade-badge"
            initial={{ opacity: 0, y: -8, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.8 }}
            style={{ position: 'absolute', top: '-16px', left: '50%', transform: 'translateX(-50%)', background: '#60A5FA', borderRadius: BORDERS.radius.full, padding: `2px ${SPACING[2]}`, whiteSpace: 'nowrap', fontFamily: TYPOGRAPHY.fontFamily, fontSize: '9px', fontWeight: TYPOGRAPHY.weight.bold, color: 'white', letterSpacing: '0.06em', zIndex: 10 }}>
            ↑ G{gradeBadge} SINCRONÍA
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar */}
      {char.image ? (
        <img src={char.image} alt={char.name} style={{ width: '64px', height: '64px', borderRadius: BORDERS.radius.lg, objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '64px', height: '64px', borderRadius: BORDERS.radius.lg, background: 'linear-gradient(135deg,#22222E,#1A1A2E)', border: `1px solid ${COLORS_UI.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.textSecondary }}>
          {initials}
        </div>
      )}

      <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.text, textAlign: 'center', maxWidth: '88px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: SPACING[1] }}>
        {char.name}
      </div>

      <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '10px', color: starColor, letterSpacing: '0.04em' }}>
        {gradeStars(char.grade ?? 1)}
      </div>

      {/* Crowns row */}
      {crowns > 0 && (
        <div style={{ display: 'flex', gap: '1px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '80px' }}>
          {Array.from({ length: crowns }, (_, i) => (
            <span key={i} style={{ fontSize: '8px', filter: 'drop-shadow(0 0 2px #FFD700)' }}>👑</span>
          ))}
        </div>
      )}

      {/* Residuos badge */}
      {(char.temporalResidues ?? 0) > 0 && (
        <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: '5px', height: '5px', borderRadius: '1px', background: i < (char.temporalResidues ?? 0) ? '#60A5FA' : 'transparent', border: `1px solid ${i < (char.temporalResidues ?? 0) ? 'rgba(96,165,250,0.6)' : COLORS_UI.border}` }} />
          ))}
          <span style={{ fontSize: '8px', color: '#60A5FA', marginLeft: '1px' }}>⏳</span>
        </div>
      )}
    </motion.button>
  );
}

// ── Modal personaje activo ────────────────────────────────────────────────────
function CharModal({ char, onClose, onPlay, onArchive }) {
  const { updateCharacter } = useStore();
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [editImg,  setEditImg]  = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const [cropSrc,  setCropSrc]  = useState(null);
  const fileInputRef = useRef(null);

  if (!char) return null;
  const initials = (char.name ?? '?').slice(0, 2).toUpperCase();
  const { border, boxShadow } = getGradeStyle(char.grade ?? 1);
  const crowns = Math.min(char.stats?.crowns ?? 0, 10);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setCropSrc(ev.target.result); setEditImg(false); };
    reader.readAsDataURL(file);
  };

  const handleUrlLoad = (url) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    const img = new window.Image();
    img.onload  = () => { setUrlError(''); setCropSrc(trimmed); setEditImg(false); };
    img.onerror = () => setUrlError('No se pudo cargar. Copia la dirección directa de la imagen.');
    img.src = trimmed;
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text?.trim()) { setUrlInput(text.trim()); handleUrlLoad(text.trim()); }
    } catch { /* sin permiso */ }
  };

  return (
    <>
    <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}>
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '460px', margin: '0 auto', background: COLORS_UI.bgElevated, borderRadius: `${BORDERS.radius.xl} ${BORDERS.radius.xl} 0 0`, padding: SPACING[5], display: 'flex', flexDirection: 'column', gap: SPACING[4], paddingBottom: SPACING[8] }}>
        <div style={{ width: '40px', height: '4px', background: COLORS_UI.border, borderRadius: BORDERS.radius.full, margin: '0 auto' }} />

        <div style={{ display: 'flex', gap: SPACING[4], alignItems: 'center' }}>
          {/* Avatar con botón editar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {char.image ? (
              <img src={char.image} alt={char.name} style={{ width: '72px', height: '72px', borderRadius: BORDERS.radius.lg, objectFit: 'cover', objectPosition: 'top', border, boxShadow }} />
            ) : (
              <div style={{ width: '72px', height: '72px', borderRadius: BORDERS.radius.lg, background: 'linear-gradient(135deg,#22222E,#1A1A2E)', border, boxShadow, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.textSecondary, fontFamily: TYPOGRAPHY.fontFamily }}>
                {initials}
              </div>
            )}
            <button onClick={() => setEditImg(v => !v)}
              style={{ position: 'absolute', bottom: '-6px', right: '-6px', width: '22px', height: '22px', borderRadius: '50%', background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', padding: 0 }}>
              ✏️
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text }}>{char.name}</div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.sm, color: char.grade >= 8 ? '#FFD700' : char.grade >= 4 ? '#60A5FA' : COLORS_UI.textSecondary, marginTop: '2px' }}>
              Grado {char.grade ?? 1} · #{String(char.auraNumber).padStart(2, '0')}
            </div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '10px', color: COLORS_UI.textMuted, marginTop: '2px' }}>
              {gradeStars(char.grade ?? 1)} · {char.stats?.runsCompleted ?? 0} sincronizaciones
            </div>
            {/* Crowns row */}
            {crowns > 0 && (
              <div style={{ display: 'flex', gap: '2px', marginTop: '4px', flexWrap: 'wrap' }}>
                {Array.from({ length: crowns }, (_, i) => (
                  <span key={i} style={{ fontSize: '12px', filter: 'drop-shadow(0 0 3px #FFD700)' }}>👑</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel editar imagen */}
        {editImg && (
          <div style={{ background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, padding: SPACING[3], display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, letterSpacing: '0.08em' }}>CAMBIAR FOTO</div>
            <div style={{ display: 'flex', gap: SPACING[2] }}>
              <button onClick={() => fileInputRef.current?.click()}
                style={{ flex: 1, minHeight: '36px', background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, color: COLORS_UI.textSecondary, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, cursor: 'pointer' }}>
                📁 Desde archivo
              </button>
            </div>
            <div style={{ display: 'flex', gap: SPACING[2] }}>
              <input value={urlInput} onChange={e => { setUrlInput(e.target.value); setUrlError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') handleUrlLoad(urlInput); }}
                placeholder="https://…/imagen.jpg"
                style={{ flex: 1, padding: SPACING[2], background: COLORS_UI.bgElevated, border: `1px solid ${urlError ? 'rgba(224,59,59,0.5)' : COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, color: COLORS_UI.text, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, outline: 'none', minWidth: 0 }} />
              <button onClick={handlePaste}
                style={{ padding: `${SPACING[1]} ${SPACING[2]}`, background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, color: COLORS_UI.textSecondary, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Pegar
              </button>
              <button onClick={() => handleUrlLoad(urlInput)}
                style={{ padding: `${SPACING[1]} ${SPACING[2]}`, background: COLORS_GAME.verde, border: 'none', borderRadius: BORDERS.radius.lg, color: 'white', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: TYPOGRAPHY.weight.bold }}>
                OK
              </button>
            </div>
            {urlError && <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '10px', color: '#E03B3B', lineHeight: 1.4 }}>{urlError}</div>}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'flex', gap: SPACING[4], fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
          <span>Racha máx: {char.stats?.maxRunStreak ?? 0}</span>
          <span>·</span>
          <span>Resonancias ✦: {char.stats?.totalPerfectSyncs ?? 0}</span>
        </div>

        {/* Habilidad Pasiva */}
        {(char.passiveAbility ?? (char.ability?.type === 'passive' ? char.ability : null)) && (() => {
          const ab = char.passiveAbility ?? char.ability;
          return (
            <div style={{ background: COLORS_UI.bgCard, borderRadius: BORDERS.radius.lg, padding: SPACING[3], border: `1px solid ${COLORS_UI.border}` }}>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '9px', color: '#60A5FA', letterSpacing: '0.08em', marginBottom: SPACING[1] }}>🛡 HABILIDAD PASIVA</div>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.text }}>{ab.name}</div>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textSecondary, marginTop: '2px' }}>{ab.description}</div>
            </div>
          );
        })()}

        {/* Habilidad Activa */}
        {(char.activeAbility ?? (char.ability?.type === 'active' ? char.ability : null)) && (() => {
          const ab = char.activeAbility ?? char.ability;
          return (
            <div style={{ background: COLORS_UI.bgCard, borderRadius: BORDERS.radius.lg, padding: SPACING[3], border: '1px solid rgba(167,139,250,0.25)' }}>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '9px', color: '#A78BFA', letterSpacing: '0.08em', marginBottom: SPACING[1] }}>⚡ HABILIDAD ACTIVA</div>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.text }}>{ab.name}</div>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textSecondary, marginTop: '2px' }}>{ab.description}</div>
            </div>
          );
        })()}

        {/* Habilidad Aura */}
        {char.auraAbility && (
          <div style={{ background: 'rgba(255,215,0,0.05)', borderRadius: BORDERS.radius.lg, padding: SPACING[3], border: '1px solid rgba(255,215,0,0.2)' }}>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '9px', color: '#FFD700', letterSpacing: '0.08em', marginBottom: SPACING[1] }}>
              ✨ HABILIDAD AURA · #{String(char.auraNumber).padStart(2, '0')}
            </div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.bold, color: '#FFD700' }}>{char.auraAbility.name}</div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: 'rgba(255,215,0,0.7)', marginTop: '2px' }}>{char.auraAbility.description}</div>
          </div>
        )}

        <motion.button whileTap={{ scale: 0.97 }} onClick={onPlay}
          style={{ width: '100%', minHeight: '56px', background: COLORS_GAME.verde, border: 'none', borderRadius: BORDERS.radius.xl, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: 'white', letterSpacing: '0.14em', cursor: 'pointer', boxShadow: `0 4px 24px ${COLORS_GAME.verde}60` }}>
          JUGAR
        </motion.button>

        {confirmArchive ? (
          <div style={{ display: 'flex', gap: SPACING[2] }}>
            <button onClick={() => setConfirmArchive(false)}
              style={{ flex: 1, minHeight: '44px', background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, color: COLORS_UI.textSecondary, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, cursor: 'pointer' }}>
              Cancelar
            </button>
            <button onClick={onArchive}
              style={{ flex: 1, minHeight: '44px', background: 'rgba(224,59,59,0.15)', border: '1px solid rgba(224,59,59,0.4)', borderRadius: BORDERS.radius.lg, color: '#E03B3B', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, cursor: 'pointer' }}>
              Archivar
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmArchive(true)}
            style={{ background: 'transparent', border: 'none', color: COLORS_UI.textMuted, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, cursor: 'pointer', textDecoration: 'underline' }}>
            Archivar personaje
          </button>
        )}
      </motion.div>
    </motion.div>

    {/* Cropper de imagen */}
    {cropSrc && (
      <ImageCropModal
        imageSrc={cropSrc}
        onConfirm={(result) => { updateCharacter(char.id, { image: result }); setCropSrc(null); }}
        onCancel={() => { setCropSrc(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
      />
    )}
    </>
  );
}

// ── Modal eliminar archivado ──────────────────────────────────────────────────
function DeleteArchivedModal({ char, onCancel, onConfirm }) {
  if (!char) return null;
  return (
    <motion.div key="delete-overlay"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onCancel}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: SPACING[4] }}>
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.88, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={e => e.stopPropagation()}
        style={{ background: COLORS_UI.bgElevated, borderRadius: BORDERS.radius.xl, padding: SPACING[5], maxWidth: '340px', width: '100%', display: 'flex', flexDirection: 'column', gap: SPACING[4], border: '1px solid rgba(224,59,59,0.3)' }}>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text, textAlign: 'center' }}>
          ¿Eliminar a {char.name} permanentemente?
        </div>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textSecondary, textAlign: 'center', lineHeight: '1.5' }}>
          Esta acción no se puede deshacer.
        </div>
        <div style={{ display: 'flex', gap: SPACING[2] }}>
          <button onClick={onCancel}
            style={{ flex: 1, minHeight: '48px', background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, color: COLORS_UI.text, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={onConfirm}
            style={{ flex: 1, minHeight: '48px', background: 'rgba(224,59,59,0.2)', border: '1px solid rgba(224,59,59,0.5)', borderRadius: BORDERS.radius.lg, color: '#E03B3B', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, cursor: 'pointer' }}>
            Eliminar para siempre
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Tab nav config ─────────────────────────────────────────────────────────────
const TABS = [
  { id: 'run',      icon: '⚡', label: 'Sincronía' },
  { id: 'chars',    icon: '👥', label: 'Personajes' },
  { id: 'bank',     icon: '📋', label: 'Banco' },
  { id: 'settings', icon: '⚙️', label: 'Ajustes' },
];

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function HomeScreen() {
  const {
    characters, setScreen, startRun, archiveCharacter, deleteCharacter, reactivateCharacter,
    lastRunResult, clearLastRunResult,
    lereles, auraFragments,
    meta, dispatchMeta,
    pushToCloud,
  } = useStore();

  const [tab,          setTab]          = useState('run');
  const [selectedChar, setSelectedChar] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [gradeBadge,   setGradeBadge]   = useState(null);
  const [levelUpMsg,   setLevelUpMsg]   = useState(null);

  const collectorLevel = meta?.collectorLevel ?? 1;
  const collectorXP    = meta?.collectorXP    ?? 0;

  // Ambient drone: start on HomeScreen mount, stop on unmount
  useEffect(() => {
    startDrone(0.06);
    return () => stopDrone();
  }, []); // eslint-disable-line

  // Lazy sync: push state on mount (covers post-run, post-character-edit, etc.)
  useEffect(() => { pushToCloud(); }, []); // eslint-disable-line

  const handleTabChange = (id) => { setTab(id); pushToCloud(); };
  const xpCurrent      = collectorXP - XP_FOR_LEVEL(collectorLevel);
  const xpNeeded       = XP_FOR_LEVEL(collectorLevel + 1) - XP_FOR_LEVEL(collectorLevel);
  const xpPct          = xpNeeded > 0 ? Math.min(100, (xpCurrent / xpNeeded) * 100) : 100;

  const active   = Object.values(characters).filter(c => c.status === 'active'   && !c._isSystemChar);
  const archived = Object.values(characters).filter(c => c.status === 'archived' && !c._isSystemChar);

  const todayStr      = getTodayStr();
  const dailyDone     = (meta?.dailyChallengeState?.date === todayStr);
  const dailyCondition = getDailyCondition(todayStr);

  // Grade-up badge
  useEffect(() => {
    if (!lastRunResult?.gradeUp) return;
    const badge = { charId: lastRunResult.characterId, newGrade: lastRunResult.newGrade };
    setGradeBadge(badge);
    clearLastRunResult();
    const t = setTimeout(() => setGradeBadge(null), 3000);
    return () => clearTimeout(t);
  }, [lastRunResult, clearLastRunResult]);

  // Level-up notification
  useEffect(() => {
    if (!meta?.leveledUp) return;
    setLevelUpMsg(`¡Don del Sincronista ${meta.leveledUp}!`);
    dispatchMeta({ type: 'CLEAR_LEVEL_UP' });
    const t = setTimeout(() => setLevelUpMsg(null), 3500);
    return () => clearTimeout(t);
  }, [meta?.leveledUp, dispatchMeta]); // eslint-disable-line

  const handlePlay = () => {
    if (!selectedChar) return;
    startRun(selectedChar.id);
    setSelectedChar(null);
    setScreen('run');
  };

  const handleArchive = () => {
    if (!selectedChar) return;
    archiveCharacter(selectedChar.id);
    setSelectedChar(null);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteCharacter(deleteTarget.id);
    setDeleteTarget(null);
  };

  // ── Tab: Run ─────────────────────────────────────────────────────────────────
  const renderRunTab = () => {
    // Notification chips
    const notifs = [];
    active.filter(c => (c.temporalResidues ?? 0) >= 3).forEach(c => {
      notifs.push({ key: `res-${c.id}`, color: '#60A5FA', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.3)', label: `⏳ Residuos listos: ${c.name}` });
    });
    if (!dailyDone) {
      notifs.push({ key: 'daily', color: '#A78BFA', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.3)', label: '☀ Desafío Diario disponible', onClick: () => setScreen('daily-challenge') });
    }
    archived.filter(c => (lereles ?? 0) >= REACTIVATE_COST).slice(0, 1).forEach(c => {
      notifs.push({ key: `react-${c.id}`, color: COLORS_GAME.verde, bg: 'rgba(59,168,79,0.08)', border: 'rgba(59,168,79,0.3)', label: `↺ Puedes reactivar a ${c.name}`, onClick: () => setTab('chars') });
    });

    return (
    <div style={{ padding: SPACING[4] }}>
      {/* Notifications */}
      {notifs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2], marginBottom: SPACING[3] }}>
          {notifs.map(n => (
            <motion.div key={n.key} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              onClick={n.onClick}
              style={{ padding: `${SPACING[2]} ${SPACING[3]}`, background: n.bg, border: `1px solid ${n.border}`, borderRadius: BORDERS.radius.lg, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: n.color, cursor: n.onClick ? 'pointer' : 'default', letterSpacing: '0.03em' }}>
              {n.label}
            </motion.div>
          ))}
        </div>
      )}

      {/* Mode buttons row 1: Práctica + Diario */}
      <div style={{ display: 'flex', gap: SPACING[2], marginBottom: SPACING[2] }}>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setScreen('practice')}
          style={{ flex: 1, padding: SPACING[3], background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.25)', borderRadius: BORDERS.radius.xl, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: SPACING[2], fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color: '#60A5FA', letterSpacing: '0.04em' }}>
          🎯 Práctica
        </motion.button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setScreen('daily-challenge')}
          style={{ flex: 1, padding: SPACING[3], background: dailyDone ? COLORS_UI.bgCard : 'rgba(167,139,250,0.08)', border: `1px solid ${dailyDone ? COLORS_UI.border : 'rgba(167,139,250,0.3)'}`, borderRadius: BORDERS.radius.xl, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: SPACING[2], fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color: dailyDone ? COLORS_UI.textMuted : '#A78BFA', letterSpacing: '0.04em' }}>
          {dailyDone ? '✓ Diario' : '☀ Diario'}
        </motion.button>
      </div>

      {/* Mode buttons row 2: Modo Infinito + Sincronía Perfecta (conditional) */}
      {(collectorLevel >= 10 || collectorLevel >= 25) && (
        <div style={{ display: 'flex', gap: SPACING[2], marginBottom: SPACING[4] }}>
          {collectorLevel >= 10 && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setScreen('infinite-run')}
              style={{ flex: 1, padding: SPACING[3], background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: BORDERS.radius.xl, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: SPACING[2], fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color: '#FFD700', letterSpacing: '0.04em' }}>
              ∞ Infinito
            </motion.button>
          )}
          {collectorLevel >= 25 && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setScreen('perfect-sync')}
              style={{ flex: 1, padding: SPACING[3], background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.25)', borderRadius: BORDERS.radius.xl, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: SPACING[2], fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color: '#FFD700', letterSpacing: '0.06em' }}>
              ✦ Sincronía
            </motion.button>
          )}
        </div>
      )}

      {/* When only Sincronía is unlocked (level 25 but not shown in row above since level >= 25 implies >= 10) */}
      {collectorLevel < 10 && collectorLevel >= 25 && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setScreen('perfect-sync')}
          style={{ width: '100%', padding: SPACING[3], background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.25)', borderRadius: BORDERS.radius.xl, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: SPACING[2], fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color: '#FFD700', letterSpacing: '0.06em', marginBottom: SPACING[4] }}>
          ✦ Sincronía Perfecta
        </motion.button>
      )}

      {/* Add bottom margin when no row2 buttons */}
      {collectorLevel < 10 && <div style={{ marginBottom: SPACING[3] }} />}

      {active.length === 0 ? (
        <EmptyState onCreateChar={() => setScreen('character-creator')} />
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING[3] }}>
          {active.map(char => (
            <CharCard key={char.id} char={char} onClick={setSelectedChar}
              gradeBadge={gradeBadge?.charId === char.id ? gradeBadge.newGrade : null} />
          ))}
        </div>
      )}
    </div>
  );
  };

  // ── Tab: Personajes ───────────────────────────────────────────────────────────
  const renderCharsTab = () => (
    <div style={{ padding: SPACING[4] }}>
      <div style={{ display: 'flex', gap: SPACING[2], marginBottom: SPACING[4] }}>
        <motion.button whileTap={{ scale: 0.98 }} onClick={() => setScreen('character-creator')}
          style={{ flex: 1, padding: SPACING[3], background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.xl, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: SPACING[2], cursor: 'pointer', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.textSecondary, letterSpacing: '0.06em' }}>
          + Crear personaje
        </motion.button>
        <motion.button whileTap={{ scale: 0.98 }} onClick={() => setScreen('aura-collection')}
          style={{ padding: `${SPACING[3]} ${SPACING[3]}`, background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: BORDERS.radius.xl, cursor: 'pointer', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: '#FFD700', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
          ⚡ Colección
        </motion.button>
      </div>

      {active.length === 0 && archived.length === 0 ? (
        <EmptyState onCreateChar={() => setScreen('character-creator')} />
      ) : (
        <>
          {active.length > 0 && (
            <div>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, letterSpacing: '0.08em', marginBottom: SPACING[3] }}>
                ACTIVOS ({active.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING[3] }}>
                {active.map(char => (
                  <CharCard key={char.id} char={char} onClick={setSelectedChar}
                    gradeBadge={gradeBadge?.charId === char.id ? gradeBadge.newGrade : null} />
                ))}
              </div>
            </div>
          )}

          {archived.length > 0 && (
            <div style={{ marginTop: active.length > 0 ? SPACING[6] : 0 }}>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, letterSpacing: '0.08em', marginBottom: SPACING[3] }}>
                ARCHIVADOS ({archived.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
                {archived.map(char => {
                  const canReactivate = (lereles ?? 0) >= REACTIVATE_COST;
                  return (
                    <div key={char.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${SPACING[2]} ${SPACING[3]}`, background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, opacity: 0.7 }}>
                      <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
                        #{String(char.auraNumber).padStart(2, '0')} {char.name} · Grado {char.grade ?? 1}
                      </span>
                      <div style={{ display: 'flex', gap: SPACING[1], flexShrink: 0 }}>
                        <motion.button whileTap={{ scale: 0.94 }}
                          onClick={() => reactivateCharacter(char.id)}
                          disabled={!canReactivate}
                          title={canReactivate ? `Reactivar por ${REACTIVATE_COST} lereles` : `Necesitas ${REACTIVATE_COST} lereles`}
                          style={{ background: canReactivate ? 'rgba(96,165,250,0.12)' : 'transparent', border: `1px solid ${canReactivate ? 'rgba(96,165,250,0.4)' : COLORS_UI.border}`, borderRadius: BORDERS.radius.md, color: canReactivate ? '#60A5FA' : COLORS_UI.textMuted, fontFamily: TYPOGRAPHY.fontFamily, fontSize: '10px', fontWeight: TYPOGRAPHY.weight.bold, padding: `2px ${SPACING[2]}`, cursor: canReactivate ? 'pointer' : 'not-allowed' }}>
                          {REACTIVATE_COST}L ↺
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.94 }} onClick={() => setDeleteTarget(char)}
                          style={{ background: 'rgba(224,59,59,0.12)', border: '1px solid rgba(224,59,59,0.3)', borderRadius: BORDERS.radius.md, color: '#E03B3B', fontFamily: TYPOGRAPHY.fontFamily, fontSize: '10px', fontWeight: TYPOGRAPHY.weight.bold, padding: `2px ${SPACING[2]}`, cursor: 'pointer' }}>
                          Eliminar
                        </motion.button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  // ── Bank tab ─────────────────────────────────────────────────────────────────
  const renderBankTab = () => (
    <div>
      {collectorLevel < 15 && (
        <div style={{ margin: SPACING[4], padding: SPACING[3], background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.15)', borderRadius: BORDERS.radius.lg }}>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: 'rgba(255,215,0,0.7)', textAlign: 'center' }}>
            Editor disponible desde Don del Sincronista 15
          </div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, textAlign: 'center', marginTop: '4px' }}>
            Don del Sincronista actual: {collectorLevel}
          </div>
        </div>
      )}
      <TestBenchScreen />
    </div>
  );

  return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(180deg, #0E0E12 0%, #13121F 60%, #0E0E12 100%)', display: 'flex', flexDirection: 'column', maxWidth: '460px', margin: '0 auto', position: 'relative' }}>

      {/* Header */}
      <div style={{ padding: `${SPACING[5]} ${SPACING[4]} ${SPACING[2]}`, borderBottom: `1px solid ${COLORS_UI.border}`, position: 'sticky', top: 0, background: 'rgba(14,14,18,0.97)', zIndex: 40, backdropFilter: 'blur(8px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING[2] }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: SPACING[1] }}>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size['2xl'], fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text, letterSpacing: '0.12em' }}>AURA</div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, color: '#FFD700', filter: 'drop-shadow(0 0 6px #FFD70099)', lineHeight: 1 }}>⚡</div>
          </div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
            {active.length}/100
          </div>
        </div>

        {/* Currency + Collector XP bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[3] }}>
          {/* Lereles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '9px', color: 'rgba(255,215,0,0.5)', letterSpacing: '0.04em' }}>L</span>
            <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: '#FFD700', fontWeight: TYPOGRAPHY.weight.bold }}>{lereles ?? 0}</span>
          </div>
          {/* Fragments */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '9px', color: 'rgba(167,139,250,0.5)' }}>◆</span>
            <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: '#A78BFA', fontWeight: TYPOGRAPHY.weight.bold }}>{auraFragments ?? 0}</span>
          </div>
          {/* Collector XP progress */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '9px', color: COLORS_UI.textMuted }}>Nv {collectorLevel}</span>
              <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '9px', color: COLORS_UI.textMuted }}>{xpCurrent}/{xpNeeded}</span>
            </div>
            <div style={{ height: '3px', borderRadius: '2px', background: COLORS_UI.border, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: '2px', background: '#60A5FA', width: `${xpPct}%`, transition: 'width 0.4s ease' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '72px' }}>
        {tab === 'run'      && renderRunTab()}
        {tab === 'chars'    && renderCharsTab()}
        {tab === 'bank'     && renderBankTab()}
        {tab === 'settings' && <SettingsScreen onResetDone={() => setTab('chars')} />}
      </div>

      {/* Bottom tab nav */}
      <nav style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '460px', height: '64px', background: 'rgba(14,14,18,0.97)', borderTop: `1px solid ${COLORS_UI.border}`, display: 'flex', zIndex: 50, backdropFilter: 'blur(8px)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => handleTabChange(t.id)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: tab === t.id ? '#FFD700' : COLORS_UI.textMuted, transition: 'color 0.15s' }}>
            <span style={{ fontSize: '18px', filter: tab === t.id ? 'drop-shadow(0 0 4px #FFD70066)' : 'none', transition: 'filter 0.15s' }}>{t.icon}</span>
            <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '9px', fontWeight: tab === t.id ? TYPOGRAPHY.weight.bold : 'normal', letterSpacing: '0.06em' }}>{t.label.toUpperCase()}</span>
          </button>
        ))}
      </nav>

      {/* FAB */}
      {tab === 'run' && active.length > 0 && (
        <motion.button whileTap={{ scale: 0.94 }} onClick={() => setScreen('character-creator')}
          style={{ position: 'fixed', bottom: '76px', right: SPACING[4], width: '56px', height: '56px', borderRadius: BORDERS.radius.full, background: COLORS_GAME.verde, border: 'none', color: 'white', fontSize: '24px', fontWeight: TYPOGRAPHY.weight.bold, cursor: 'pointer', boxShadow: `0 4px 20px ${COLORS_GAME.verde}80`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 49 }}>
          +
        </motion.button>
      )}

      {/* Level-up toast */}
      <AnimatePresence>
        {levelUpMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.9 }}
            style={{ position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.4)', borderRadius: BORDERS.radius.xl, padding: `${SPACING[2]} ${SPACING[4]}`, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color: '#60A5FA', whiteSpace: 'nowrap', zIndex: 200, pointerEvents: 'none' }}>
            ↑ {levelUpMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modales */}
      <AnimatePresence>
        {selectedChar && (
          <CharModal char={selectedChar} onClose={() => setSelectedChar(null)} onPlay={handlePlay} onArchive={handleArchive} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <DeleteArchivedModal char={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm} />
        )}
      </AnimatePresence>
    </div>
  );
}
