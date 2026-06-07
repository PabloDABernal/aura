import { useState } from 'react';
import { motion } from 'framer-motion';
import useStore from '../../../store/index.js';
import { getTheme } from '../../../styles/colorThemes.js';
import { COLORS_UI, TYPOGRAPHY, SPACING, BORDERS } from '../../../styles/tokens.js';

const STATUS_BADGE = { draft: { label: 'Borrador', color: '#777' }, confirmed: { label: 'Confirmado', color: '#3BA84F' }, archived: { label: 'Archivado', color: '#AA3333' } };
const COLORS_LIST = ['rojo', 'morado', 'negro', 'verde', 'naranja'];

export default function SetsScreen() {
  const setScreen            = useStore(s => s.setScreen);
  const collection           = useStore(s => s.collection);
  const dispatchCollection   = useStore(s => s.dispatchCollection);
  const setCurrentEditSetId  = useStore(s => s.setCurrentEditSetId);

  const [filterColor, setFilterColor] = useState(null);

  const allSets = Object.values(collection?.sets ?? {});
  const filtered = filterColor ? allSets.filter(s => s.colorId === filterColor) : allSets;

  const handleNewSet = (colorId) => {
    const id = `set-${Date.now()}`;
    dispatchCollection({ type: 'CREATE_SET', set: { id, name: 'Nuevo Set', colorId, category: collection.categories[colorId]?.[0] ?? '', characters: [] } });
    setCurrentEditSetId(id);
    setScreen('set-editor');
  };

  return (
    <div style={{ minHeight: '100vh', background: COLORS_UI.bg, display: 'flex', flexDirection: 'column', maxWidth: 460, margin: '0 auto', padding: SPACING[4], gap: SPACING[3] }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text }}>MIS SETS</div>
        <button onClick={() => setScreen('collection-menu')} style={{ background: 'none', border: 'none', color: COLORS_UI.textMuted, cursor: 'pointer', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm }}>← Volver</button>
      </div>

      {/* Filtro por color */}
      <div style={{ display: 'flex', gap: SPACING[1], flexWrap: 'wrap' }}>
        {[null, ...COLORS_LIST].map(c => {
          const theme = c ? getTheme(c) : null;
          const active = filterColor === c;
          return (
            <button key={c ?? 'all'} onClick={() => setFilterColor(c)}
              style={{ padding: '4px 12px', background: active ? (theme?.border ?? COLORS_UI.text) + '33' : COLORS_UI.bgCard, border: `1px solid ${active ? (theme?.border ?? COLORS_UI.text) : COLORS_UI.border}`, borderRadius: BORDERS.radius.sm, color: active ? (theme?.text ?? COLORS_UI.text) : COLORS_UI.textSecondary, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, cursor: 'pointer' }}>
              {c ?? 'Todos'}
            </button>
          );
        })}
      </div>

      {/* Lista de sets */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', fontFamily: TYPOGRAPHY.fontFamily, color: COLORS_UI.textMuted, padding: SPACING[6] }}>
          Sin sets. Crea uno nuevo abajo.
        </div>
      )}
      {filtered.map(set => {
        const theme  = getTheme(set.colorId);
        const status = STATUS_BADGE[set.status] ?? STATUS_BADGE.draft;
        return (
          <motion.div key={set.id} whileTap={{ scale: 0.98 }}
            onClick={() => { setCurrentEditSetId(set.id); setScreen('set-editor'); }}
            style={{ background: COLORS_UI.bgCard, border: `2px solid ${theme.border}33`, borderRadius: BORDERS.radius.lg, padding: SPACING[3], cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontWeight: TYPOGRAPHY.weight.bold, color: theme.text }}>{set.name}</div>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>{set.category} · {(set.characters ?? []).length} personajes</div>
            </div>
            <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, background: status.color + '22', color: status.color, borderRadius: BORDERS.radius.sm, padding: '2px 6px' }}>
              {status.label}
            </span>
          </motion.div>
        );
      })}

      {/* Botones crear por color */}
      <div>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.textSecondary, marginBottom: SPACING[1] }}>NUEVO SET</div>
        <div style={{ display: 'flex', gap: SPACING[1] }}>
          {COLORS_LIST.map(c => {
            const theme = getTheme(c);
            const slots = collection?.slots?.[c] ?? 1;
            const used  = allSets.filter(s => s.colorId === c && s.status !== 'archived').length;
            const canAdd = used < slots;
            return (
              <motion.button key={c} whileTap={{ scale: 0.95 }} disabled={!canAdd} onClick={() => canAdd && handleNewSet(c)}
                style={{ flex: 1, padding: SPACING[2], background: canAdd ? theme.bg : COLORS_UI.bgElevated, border: `1px solid ${canAdd ? theme.border : COLORS_UI.border}`, borderRadius: BORDERS.radius.md, color: canAdd ? theme.text : COLORS_UI.textMuted, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, cursor: canAdd ? 'pointer' : 'default', textAlign: 'center' }}>
                + {c}<br/><span style={{ fontSize: '9px' }}>{used}/{slots}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
