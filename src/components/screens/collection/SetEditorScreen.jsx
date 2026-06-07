import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../../store/index.js';
import { COLORS, COLOR_IDS } from '../../../data/colors.js';
import { getTheme } from '../../../styles/colorThemes.js';
import { COLORS_UI, TYPOGRAPHY, SPACING, BORDERS, COLORS_GAME } from '../../../styles/tokens.js';

const STATUS_LABEL = {
  draft:     { label: 'Borrador',   color: '#777' },
  confirmed: { label: 'Confirmado', color: '#3BA84F' },
  inUse:     { label: 'En Uso',     color: '#E0823B' },
  archived:  { label: 'Archivado',  color: '#AA3333' },
};

export default function SetEditorScreen() {
  const setScreen          = useStore(s => s.setScreen);
  const collection         = useStore(s => s.collection);
  const currentEditSetId   = useStore(s => s.currentEditSetId);
  const setCurrentEditSetId = useStore(s => s.setCurrentEditSetId);
  const dispatchCollection = useStore(s => s.dispatchCollection);
  const dispatchMeta       = useStore(s => s.dispatchMeta);

  // Encontrar el set activo
  const activeSet = currentEditSetId
    ? collection?.sets?.[currentEditSetId]
    : Object.values(collection?.sets ?? {}).find(s => s.status === 'draft') ?? null;

  const [name, setName]         = useState(activeSet?.name ?? '');
  const [colorId, setColorId]   = useState(activeSet?.colorId ?? 'rojo');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [saved, setSaved]       = useState(false);

  // Sync name when set changes
  useEffect(() => {
    if (activeSet) {
      setName(activeSet.name ?? '');
      setColorId(activeSet.colorId ?? 'rojo');
    }
  }, [activeSet?.id]);

  const theme = getTheme(colorId);

  if (!activeSet) {
    return (
      <div style={{ minHeight: '100vh', background: COLORS_UI.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: 460, margin: '0 auto', padding: SPACING[4] }}>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, color: COLORS_UI.textMuted, textAlign: 'center' }}>
          Sin Set activo. Crea uno desde Mis Sets.
          <br />
          <button onClick={() => setScreen('sets')} style={{ marginTop: SPACING[3], padding: `${SPACING[2]} ${SPACING[4]}`, background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.md, color: COLORS_UI.text, cursor: 'pointer', fontFamily: TYPOGRAPHY.fontFamily }}>
            ← Mis Sets
          </button>
        </div>
      </div>
    );
  }

  const isDraft     = activeSet.status === 'draft';
  const isConfirmed = activeSet.status === 'confirmed' || activeSet.status === 'inUse';
  const isArchived  = activeSet.status === 'archived';

  const chars   = (activeSet.characters ?? [])
    .map(id => collection?.characters?.[id])
    .filter(Boolean);
  const place   = activeSet.placeId ? collection?.places?.[activeSet.placeId] : null;

  const confirmedChars = chars.filter(c => c.status === 'confirmed');
  const canConfirm = isDraft && name.trim().length >= 2 && confirmedChars.length >= 6 && !!place;

  const handleSaveName = () => {
    if (name.trim().length >= 2) {
      dispatchCollection({ type: 'UPDATE_SET', id: activeSet.id, patch: { name: name.trim() } });
    }
  };

  const handleConfirm = () => {
    dispatchCollection({ type: 'UPDATE_SET', id: activeSet.id, patch: { name: name.trim() } });
    dispatchCollection({ type: 'CONFIRM_SET', id: activeSet.id });
    dispatchMeta({ type: 'GAIN_POINTS', amount: 5 });
    setSaved(true);
    setShowConfirmModal(false);
    setTimeout(() => {
      setCurrentEditSetId(null);
      setScreen('sets');
    }, 1200);
  };

  const handleArchive = () => {
    dispatchCollection({ type: 'ARCHIVE_SET', id: activeSet.id });
    setShowArchiveModal(false);
    setCurrentEditSetId(null);
    setScreen('sets');
  };

  const handleAddChar = () => {
    setScreen('char-editor');
  };

  const handleAddPlace = () => {
    setScreen('place-editor');
  };

  const statusInfo = STATUS_LABEL[activeSet.status] ?? STATUS_LABEL.draft;

  return (
    <div style={{ minHeight: '100vh', background: COLORS_UI.bg, display: 'flex', flexDirection: 'column', maxWidth: 460, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ padding: `${SPACING[4]} ${SPACING[4]} 0`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: theme.text }}>
          EDITOR SET
        </div>
        <div style={{ display: 'flex', gap: SPACING[2], alignItems: 'center' }}>
          <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, background: statusInfo.color + '22', color: statusInfo.color, borderRadius: BORDERS.radius.sm, padding: '2px 8px' }}>
            {statusInfo.label}
          </span>
          <button onClick={() => { setCurrentEditSetId(null); setScreen('sets'); }}
            style={{ background: 'none', border: 'none', color: COLORS_UI.textMuted, cursor: 'pointer', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm }}>
            ← Volver
          </button>
        </div>
      </div>

      <div style={{ padding: `${SPACING[3]} ${SPACING[4]}`, display: 'flex', flexDirection: 'column', gap: SPACING[3] }}>

        {/* Nombre */}
        <div style={{ background: theme.bg, border: `2px solid ${theme.border}`, borderRadius: BORDERS.radius.lg, padding: SPACING[3] }}>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, color: theme.text, marginBottom: SPACING[1] }}>NOMBRE DEL SET</div>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={handleSaveName}
            maxLength={30}
            disabled={!isDraft}
            placeholder="Nombre del Set (2-30 chars)"
            style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: `1px solid ${theme.border}`, borderRadius: BORDERS.radius.md, padding: SPACING[2], color: isDraft ? COLORS_UI.text : COLORS_UI.textSecondary, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, outline: 'none', boxSizing: 'border-box', opacity: isDraft ? 1 : 0.7 }}
          />
          {name.length > 0 && name.length < 2 && (
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.danger, marginTop: 4 }}>Mínimo 2 caracteres</div>
          )}
        </div>

        {/* Selector de color (solo en borrador) */}
        {isDraft && (
          <div style={{ background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, padding: SPACING[3] }}>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.textSecondary, marginBottom: SPACING[2] }}>COLOR DEL SET</div>
            <div style={{ display: 'flex', gap: SPACING[2] }}>
              {COLOR_IDS.map(cid => {
                const c = COLORS[cid];
                const t = getTheme(cid);
                const isActive = colorId === cid;
                return (
                  <motion.button key={cid} whileTap={{ scale: 0.92 }}
                    onClick={() => {
                      setColorId(cid);
                      dispatchCollection({ type: 'UPDATE_SET', id: activeSet.id, patch: { colorId: cid } });
                    }}
                    style={{ flex: 1, padding: `${SPACING[2]} 0`, background: isActive ? t.bg : COLORS_UI.bgElevated, border: `2px solid ${isActive ? t.border : COLORS_UI.border}`, borderRadius: BORDERS.radius.md, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer', boxShadow: isActive ? `0 0 12px ${t.glow}` : 'none', transition: 'all 0.15s' }}>
                    <span style={{ fontSize: 18 }}>{c.emoji}</span>
                    <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '10px', color: isActive ? t.text : COLORS_UI.textMuted }}>{c.label}</span>
                  </motion.button>
                );
              })}
            </div>
            {activeSet.colorId && (
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, marginTop: SPACING[2] }}>
                {COLORS[activeSet.colorId]?.description ?? ''}
              </div>
            )}
          </div>
        )}

        {/* Progreso */}
        {isDraft && (
          <div style={{ background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, padding: SPACING[3] }}>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textSecondary, marginBottom: SPACING[2] }}>
              PROGRESO HACIA CONFIRMACIÓN
            </div>
            <div style={{ display: 'flex', gap: SPACING[3], marginBottom: SPACING[2] }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, marginBottom: 4 }}>
                  <span style={{ color: COLORS_UI.textMuted }}>Personajes confirmados</span>
                  <span style={{ color: confirmedChars.length >= 6 ? COLORS_UI.success : COLORS_UI.textSecondary }}>{confirmedChars.length}/6</span>
                </div>
                <div style={{ height: 4, background: '#222230', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, (confirmedChars.length / 6) * 100)}%`, background: confirmedChars.length >= 6 ? COLORS_UI.success : theme.border, borderRadius: 2, transition: 'width 0.3s' }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[1] }}>
                <span style={{ fontSize: 16 }}>{place ? '✅' : '⬜'}</span>
                <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: place ? COLORS_UI.success : COLORS_UI.textMuted }}>Lugar</span>
              </div>
            </div>
            {!canConfirm && (
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
                {confirmedChars.length < 6 && `Faltan ${6 - confirmedChars.length} personajes. `}
                {!place && 'Falta el lugar del Set. '}
                {name.trim().length < 2 && 'Nombre demasiado corto.'}
              </div>
            )}
          </div>
        )}

        {/* Lista de personajes */}
        <div style={{ background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, padding: SPACING[3] }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING[2] }}>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.textSecondary }}>
              PERSONAJES ({chars.length})
            </div>
            {isDraft && (
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleAddChar}
                style={{ padding: `${SPACING[1]} ${SPACING[3]}`, background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: BORDERS.radius.md, color: theme.text, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, cursor: 'pointer' }}>
                + Añadir
              </motion.button>
            )}
          </div>

          {chars.length === 0 ? (
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, textAlign: 'center', padding: SPACING[3] }}>
              Sin personajes. Añade al menos 6 confirmados.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[1] }}>
              {chars.map(char => (
                <div key={char.id} style={{ display: 'flex', alignItems: 'center', gap: SPACING[2], padding: `${SPACING[1]} ${SPACING[2]}`, background: COLORS_UI.bgElevated, borderRadius: BORDERS.radius.md }}>
                  <span style={{ fontSize: 16 }}>{char.basics?.emoji ?? '⭐'}</span>
                  <span style={{ flex: 1, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.text }}>{char.basics?.name}</span>
                  <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '10px', color: char.status === 'confirmed' ? COLORS_UI.success : '#777', background: (char.status === 'confirmed' ? COLORS_UI.success : '#777') + '22', borderRadius: BORDERS.radius.sm, padding: '1px 5px' }}>
                    {char.status === 'confirmed' ? 'Confirmado' : 'Borrador'}
                  </span>
                  {char.leader !== null && (
                    <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '10px', color: COLORS_GAME.rojo, background: COLORS_GAME.rojo + '22', borderRadius: BORDERS.radius.sm, padding: '1px 5px' }}>Líder</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lugar del Set */}
        <div style={{ background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, padding: SPACING[3] }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING[2] }}>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.textSecondary }}>
              LUGAR DEL SET
            </div>
            {isDraft && !place && (
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleAddPlace}
                style={{ padding: `${SPACING[1]} ${SPACING[3]}`, background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: BORDERS.radius.md, color: theme.text, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, cursor: 'pointer' }}>
                + Crear
              </motion.button>
            )}
          </div>
          {place ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[2], padding: SPACING[2], background: COLORS_UI.bgElevated, borderRadius: BORDERS.radius.md }}>
              <span style={{ fontSize: 20 }}>{place.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.text }}>{place.name}</div>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>Tipo: {place.type} · Resonancia: {place.resonance}</div>
              </div>
              <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '10px', color: COLORS_UI.success, background: COLORS_UI.success + '22', borderRadius: BORDERS.radius.sm, padding: '1px 5px' }}>✓</span>
            </div>
          ) : (
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, textAlign: 'center', padding: SPACING[2] }}>
              Sin lugar. Crea el lugar del Set.
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2], paddingBottom: SPACING[6] }}>
          {isDraft && (
            <motion.button whileTap={{ scale: 0.97 }}
              disabled={!canConfirm}
              onClick={() => setShowConfirmModal(true)}
              style={{ width: '100%', padding: `${SPACING[4]} 0`, background: canConfirm ? '#FFD700' : COLORS_UI.bgElevated, border: 'none', borderRadius: BORDERS.radius.xl, color: canConfirm ? '#000' : COLORS_UI.textMuted, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.black, letterSpacing: '0.1em', cursor: canConfirm ? 'pointer' : 'default', boxShadow: canConfirm ? '0 6px 24px rgba(255,215,0,0.4)' : 'none', transition: 'all 0.15s' }}>
              {saved ? '✓ CONFIRMADO +5pts' : `CONFIRMAR SET${canConfirm ? ' (+5pts)' : ''}`}
            </motion.button>
          )}

          {isConfirmed && !isArchived && (
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => setShowArchiveModal(true)}
              style={{ width: '100%', padding: `${SPACING[3]} 0`, background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.xl, color: COLORS_UI.textMuted, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.bold, cursor: 'pointer' }}>
              Archivar Set
            </motion.button>
          )}
        </div>
      </div>

      {/* Modal de confirmación */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: SPACING[4] }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{ background: COLORS_UI.bgCard, border: `2px solid ${theme.border}`, borderRadius: BORDERS.radius.xl, padding: SPACING[5], maxWidth: 360, width: '100%' }}>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.black, color: theme.text, marginBottom: SPACING[2] }}>
                Confirmar "{name}"
              </div>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textSecondary, marginBottom: SPACING[3], lineHeight: 1.5 }}>
                Una vez confirmado, el nombre, color y categoría <strong style={{ color: COLORS_UI.text }}>no podrán modificarse</strong>. ¿Seguro?
              </div>
              <div style={{ display: 'flex', gap: SPACING[2] }}>
                <button onClick={() => setShowConfirmModal(false)}
                  style={{ flex: 1, padding: SPACING[3], background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, color: COLORS_UI.textMuted, fontFamily: TYPOGRAPHY.fontFamily, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleConfirm}
                  style={{ flex: 2, padding: SPACING[3], background: '#FFD700', border: 'none', borderRadius: BORDERS.radius.lg, color: '#000', fontFamily: TYPOGRAPHY.fontFamily, fontWeight: TYPOGRAPHY.weight.black, cursor: 'pointer', fontSize: TYPOGRAPHY.size.md }}>
                  Confirmar +5pts
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showArchiveModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: SPACING[4] }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{ background: COLORS_UI.bgCard, border: `2px solid #AA3333`, borderRadius: BORDERS.radius.xl, padding: SPACING[5], maxWidth: 360, width: '100%' }}>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.black, color: '#AA3333', marginBottom: SPACING[2] }}>
                Archivar Set
              </div>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textSecondary, marginBottom: SPACING[3], lineHeight: 1.5 }}>
                El Set dejará de aparecer en las runs. Los puntos ganados se conservan.
              </div>
              <div style={{ display: 'flex', gap: SPACING[2] }}>
                <button onClick={() => setShowArchiveModal(false)}
                  style={{ flex: 1, padding: SPACING[3], background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, color: COLORS_UI.textMuted, fontFamily: TYPOGRAPHY.fontFamily, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleArchive}
                  style={{ flex: 2, padding: SPACING[3], background: '#AA3333', border: 'none', borderRadius: BORDERS.radius.lg, color: 'white', fontFamily: TYPOGRAPHY.fontFamily, fontWeight: TYPOGRAPHY.weight.black, cursor: 'pointer' }}>
                  Archivar
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
