/**
 * AuraCollectionScreen — grid 10×10 de la colección de auras.
 * GDD v4.0 §8.3 y §8.4.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../store/index.js';
import {
  COLORS_UI, TYPOGRAPHY, SPACING, BORDERS,
} from '../../styles/tokens.js';

const CELL = {
  free: {
    background: 'rgba(255,255,255,0.03)',
    border:     '1px solid rgba(255,255,255,0.07)',
    color:      'rgba(255,255,255,0.18)',
  },
  active: {
    background: 'rgba(96,165,250,0.10)',
    border:     '1px solid rgba(96,165,250,0.35)',
    color:      '#60A5FA',
  },
  archived: {
    background: 'rgba(251,146,60,0.06)',
    border:     '1px solid rgba(251,146,60,0.18)',
    color:      'rgba(251,146,60,0.45)',
  },
  crowned: {
    background: 'rgba(255,215,0,0.12)',
    border:     '1.5px solid #FFD700',
    color:      '#FFD700',
    boxShadow:  '0 0 6px rgba(255,215,0,0.22)',
  },
};

function getCellState(n, charByNumber) {
  const char = charByNumber[n];
  if (!char) return 'free';
  if (char.grade >= 10 || (char.stats?.crowns ?? 0) >= 10) return 'crowned';
  if (char.status === 'archived') return 'archived';
  return 'active';
}

export default function AuraCollectionScreen() {
  const {
    characters, usedAuraNumbers, completedAuraRanges,
    setScreen, setCreatorPreselect,
  } = useStore();

  const [selectedCell, setSelectedCell] = useState(null);

  const charByNumber = {};
  for (const char of Object.values(characters)) {
    charByNumber[char.auraNumber] = char;
  }

  const totalUsed    = usedAuraNumbers.length;
  const rangesDone   = (completedAuraRanges ?? []).length;

  function handleCellTap(n) {
    const char = charByNumber[n];
    if (!char) {
      setCreatorPreselect(n);
      setScreen('character-creator');
    } else {
      setSelectedCell(char);
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: COLORS_UI.bg, maxWidth: '460px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ padding: `${SPACING[4]} ${SPACING[4]} ${SPACING[3]}`, borderBottom: `1px solid ${COLORS_UI.border}`, display: 'flex', alignItems: 'center', gap: SPACING[3], position: 'sticky', top: 0, background: COLORS_UI.bg, zIndex: 10 }}>
        <button onClick={() => setScreen('home')} style={{ background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, color: COLORS_UI.text, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, padding: `${SPACING[2]} ${SPACING[3]}`, cursor: 'pointer' }}>
          ←
        </button>
        <div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text, letterSpacing: '0.08em' }}>
            Colección Aura
          </div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
            {totalUsed} frecuencias capturadas de 100 · {rangesDone}/10 rangos
          </div>
        </div>
      </div>

      {/* Range progress bar */}
      <div style={{ padding: `${SPACING[2]} ${SPACING[4]}`, borderBottom: `1px solid ${COLORS_UI.border}` }}>
        <div style={{ display: 'flex', gap: '3px' }}>
          {Array.from({ length: 10 }, (_, r) => {
            const done = (completedAuraRanges ?? []).includes(r);
            return (
              <div key={r} title={`${r}0–${r}9`} style={{ flex: 1, height: '5px', borderRadius: '3px', background: done ? '#FFD700' : COLORS_UI.border, transition: 'background 0.3s', cursor: 'default' }} />
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px', fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '9px', color: COLORS_UI.textMuted }}>
          <span>00</span><span>99</span>
        </div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: SPACING[3] }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '3px' }}>
          {Array.from({ length: 100 }, (_, n) => {
            const st  = getCellState(n, charByNumber);
            const sty = CELL[st];
            return (
              <motion.button
                key={n}
                whileTap={{ scale: 0.84 }}
                onClick={() => handleCellTap(n)}
                style={{
                  aspectRatio:  '1',
                  ...sty,
                  borderRadius: BORDERS.radius.sm,
                  fontFamily:   TYPOGRAPHY.fontFamilyMono,
                  fontSize:     '9px',
                  fontWeight:   TYPOGRAPHY.weight.bold,
                  cursor:       'pointer',
                  padding:      0,
                  lineHeight:   1,
                  transition:   'background 0.12s',
                }}
              >
                {String(n).padStart(2, '0')}
              </motion.button>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING[3], marginTop: SPACING[4], padding: `0 ${SPACING[1]}` }}>
          {[
            { st: 'free',    label: 'Libre — toca para crear'    },
            { st: 'active',  label: 'Activo'                     },
            { st: 'archived',label: 'Archivado'                  },
            { st: 'crowned', label: 'Cristalizado (Grado 10)'     },
          ].map(({ st, label }) => (
            <div key={st} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '2px', ...CELL[st] }} />
              <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cell detail modal */}
      <AnimatePresence>
        {selectedCell && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedCell(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: '460px', margin: '0 auto', background: COLORS_UI.bgElevated, borderRadius: `${BORDERS.radius.xl} ${BORDERS.radius.xl} 0 0`, padding: SPACING[5], paddingBottom: SPACING[8], display: 'flex', flexDirection: 'column', gap: SPACING[3] }}
            >
              <div style={{ width: '40px', height: '4px', background: COLORS_UI.border, borderRadius: BORDERS.radius.full, margin: '0 auto' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[3] }}>
                <div style={{ width: '60px', height: '60px', borderRadius: BORDERS.radius.lg, background: 'linear-gradient(135deg,#22222E,#1A1A2E)', border: `1px solid ${COLORS_UI.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.textSecondary, flexShrink: 0, overflow: 'hidden' }}>
                  {selectedCell.image
                    ? <img src={selectedCell.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (selectedCell.name ?? '?').slice(0, 2).toUpperCase()
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text }}>{selectedCell.name}</div>
                  <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textSecondary, marginTop: '2px' }}>
                    Grado {selectedCell.grade ?? 1} · #{String(selectedCell.auraNumber).padStart(2, '0')} · {selectedCell.status === 'archived' ? 'Archivado' : 'Activo'}
                  </div>
                  {/* Crowns row */}
                  {(selectedCell.stats?.crowns ?? 0) > 0 && (
                    <div style={{ display: 'flex', gap: '2px', marginTop: '5px' }}>
                      {Array.from({ length: Math.min(selectedCell.stats.crowns, 10) }, (_, i) => (
                        <span key={i} style={{ fontSize: '11px', filter: 'drop-shadow(0 0 3px #FFD700)' }}>👑</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: SPACING[3], fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, flexWrap: 'wrap' }}>
                <span>{selectedCell.stats?.runsCompleted ?? 0} sincronizaciones</span>
                <span>·</span>
                <span>Racha máx: {selectedCell.stats?.maxRunStreak ?? 0}</span>
                <span>·</span>
                <span>{selectedCell.stats?.totalPerfectSyncs ?? 0} resonancias ✦</span>
              </div>

              <button
                onClick={() => setSelectedCell(null)}
                style={{ marginTop: SPACING[1], background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, color: COLORS_UI.textSecondary, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, padding: SPACING[3], cursor: 'pointer' }}
              >
                Cerrar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
