import { useState } from 'react';
import { motion } from 'framer-motion';
import useStore from '../../../store/index.js';
import { getCollectorLevel, getSlotsForLevel } from '../../../store/metaSlice.js';
import { leaderAura } from '../../../engine/character/auraCalculator.js';
import { split } from '../../../engine/character/attributeSplit.js';
import { getTheme } from '../../../styles/colorThemes.js';
import { COLORS_UI, TYPOGRAPHY, SPACING, BORDERS, COLORS_GAME } from '../../../styles/tokens.js';

export default function SetSelectionScreen() {
  const setScreen    = useStore(s => s.setScreen);
  const setRunConfig = useStore(s => s.setRunConfig);
  const collection   = useStore(s => s.collection);
  const meta         = useStore(s => s.meta);
  const getDataCtx   = useStore(s => s.getDataCtx);
  const { sets: allSets, characters: allChars } = getDataCtx();

  const collectorLevel = getCollectorLevel(meta?.collectionPoints ?? 0);
  const maxSlots       = getSlotsForLevel(collectorLevel);

  const [selected,    setSelected]    = useState([]);
  const [slotsWarning, setSlotsWarning] = useState(false);

  const toggle = (setId) => {
    setSelected(prev => {
      if (prev.includes(setId)) return prev.filter(id => id !== setId);
      if (prev.length >= maxSlots) {
        setSlotsWarning(true);
        setTimeout(() => setSlotsWarning(false), 2500);
        return prev;
      }
      setSlotsWarning(false);
      return [...prev, setId];
    });
  };

  const canContinue = selected.length >= 2;

  const handleContinue = () => {
    setRunConfig({ selectedSets: selected, selectedLeaders: {} });
    setScreen('leader-selection');
  };

  return (
    <div style={{
      minHeight: '100vh', background: COLORS_UI.bg, display: 'flex',
      flexDirection: 'column', maxWidth: 460, margin: '0 auto',
      padding: SPACING[4], gap: SPACING[3],
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size['2xl'], fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text, letterSpacing: '0.1em' }}>
          ELIGE TUS SETS
        </div>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textSecondary, marginTop: SPACING[1] }}>
          {selected.length}/{maxSlots} seleccionados · mínimo 2
        </div>
        {slotsWarning && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_GAME.naranja, marginTop: SPACING[1], background: `${COLORS_GAME.naranja}15`, borderRadius: BORDERS.radius.sm, padding: `${SPACING[1]} ${SPACING[2]}` }}>
            🔒 Desbloquea más slots subiendo de nivel
          </motion.div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
        {Object.values(allSets).filter(set => !set.status || set.status === 'confirmed').map(set => {
          const theme   = getTheme(set.colorId);
          const isOn    = selected.includes(set.id);
          const leaders = (set.leaders ?? []).map(id => allChars[id]).filter(Boolean);
          const guests  = (set.guests  ?? []).map(id => allChars[id]).filter(Boolean);
          return (
            <motion.div
              key={set.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggle(set.id)}
              style={{
                background:   isOn ? theme.bg : COLORS_UI.bgCard,
                border:       `2px solid ${isOn ? theme.border : COLORS_UI.border}`,
                borderRadius: BORDERS.radius.lg,
                padding:      SPACING[3],
                cursor:       'pointer',
                boxShadow:    isOn ? `0 0 16px ${theme.glow}` : 'none',
                transition:   'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[2], marginBottom: SPACING[2] }}>
                <span style={{ fontSize: 24 }}>{set.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontWeight: TYPOGRAPHY.weight.black, color: isOn ? theme.text : COLORS_UI.text, fontSize: TYPOGRAPHY.size.lg }}>
                    {set.name}
                  </div>
                  <div style={{ display: 'flex', gap: SPACING[1], marginTop: 2 }}>
                    <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, background: theme.border + '33', color: theme.text, borderRadius: BORDERS.radius.sm, padding: '1px 6px' }}>
                      {set.category}
                    </span>
                    <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
                      {set.leaders.length + set.guests.length} personajes
                    </span>
                  </div>
                </div>
                {isOn && <span style={{ fontSize: 20 }}>✓</span>}
              </div>

              <div style={{ display: 'flex', gap: SPACING[1], flexWrap: 'wrap' }}>
                {leaders.map(c => {
                  const lAura  = leaderAura(c);
                  const lAttrs = split(lAura, c.colorId);
                  return (
                    <div key={c.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', background: theme.border + '22', borderRadius: BORDERS.radius.sm, padding: '3px 7px' }}>
                      <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: theme.text, fontWeight: TYPOGRAPHY.weight.bold }}>
                        {c.basics.emoji} {c.basics.name}
                      </span>
                      <div style={{ display: 'flex', gap: 3, marginTop: 1 }}>
                        {[
                          { label: `P:${lAttrs.presencia}`, color: COLORS_GAME.rojo },
                          { label: `I:${lAttrs.influencia}`, color: COLORS_GAME.morado },
                          { label: `T:${lAttrs.temple}`,     color: COLORS_GAME.verde },
                        ].map(({ label, color }) => (
                          <span key={label} style={{ fontFamily: TYPOGRAPHY.fontFamilyMono ?? TYPOGRAPHY.fontFamily, fontSize: '8px', color, background: color + '22', borderRadius: 2, padding: '0 3px' }}>
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {guests.map(c => (
                  <span key={c.id} style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, background: 'rgba(255,255,255,0.04)', borderRadius: BORDERS.radius.sm, padding: '2px 7px' }}>
                    {c.basics.name}
                  </span>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        disabled={!canContinue}
        onClick={handleContinue}
        style={{
          width: '100%', padding: `${SPACING[4]} 0`,
          background: canContinue ? COLORS_GAME.verde : COLORS_UI.bgElevated,
          border: 'none', borderRadius: BORDERS.radius.xl,
          color: canContinue ? 'white' : COLORS_UI.textMuted,
          fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg,
          fontWeight: TYPOGRAPHY.weight.black, letterSpacing: '0.1em',
          cursor: canContinue ? 'pointer' : 'default',
          boxShadow: canContinue ? `0 6px 24px ${COLORS_GAME.verde}66` : 'none',
          transition: 'all 0.15s',
        }}
      >
        CONTINUAR →
      </motion.button>
    </div>
  );
}
