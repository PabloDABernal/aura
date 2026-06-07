import { useState } from 'react';
import { motion } from 'framer-motion';
import useStore from '../../../store/index.js';
import { leaderAura } from '../../../engine/character/auraCalculator.js';
import { split } from '../../../engine/character/attributeSplit.js';
import { getTheme } from '../../../styles/colorThemes.js';
import { COLORS_UI, TYPOGRAPHY, SPACING, BORDERS, COLORS_GAME } from '../../../styles/tokens.js';

export default function LeaderSelectionScreen() {
  const setScreen    = useStore(s => s.setScreen);
  const runConfig    = useStore(s => s.runConfig);
  const setRunConfig = useStore(s => s.setRunConfig);
  const collection   = useStore(s => s.collection);
  const getDataCtx   = useStore(s => s.getDataCtx);
  const { sets: allSets, characters: allChars } = getDataCtx();

  const selectedSets = runConfig?.selectedSets ?? [];
  const [leaders, setLeaders] = useState(runConfig?.selectedLeaders ?? {});

  const canContinue = selectedSets.every(setId => !!leaders[setId]);

  const pickLeader = (setId, charId) => {
    setLeaders(prev => ({ ...prev, [setId]: charId }));
  };

  const handleContinue = () => {
    setRunConfig({ ...runConfig, selectedLeaders: leaders });
    setScreen('deck-review');
  };

  return (
    <div style={{
      minHeight: '100vh', background: COLORS_UI.bg, display: 'flex',
      flexDirection: 'column', maxWidth: 460, margin: '0 auto',
      padding: SPACING[4], gap: SPACING[3],
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size['2xl'], fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text, letterSpacing: '0.1em' }}>
          ELIGE LÍDERES
        </div>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textSecondary, marginTop: SPACING[1] }}>
          1 líder por Set
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[3] }}>
        {selectedSets.map(setId => {
          const set   = allSets[setId];
          if (!set) return null;
          const theme = getTheme(set.colorId);
          return (
            <div key={setId}>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontWeight: TYPOGRAPHY.weight.bold, color: theme.text, marginBottom: SPACING[2], display: 'flex', alignItems: 'center', gap: SPACING[1] }}>
                {set.icon} {set.name}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
                {(set.leaders ?? []).map(charId => {
                  const charDef = allChars[charId];
                  if (!charDef?.leader) return null;
                  const aura    = leaderAura(charDef);
                  const attrs   = split(aura, charDef.colorId);
                  const isOn    = leaders[setId] === charId;
                  const hasAct  = !!charDef.leader.activeAbility;
                  const hasPas  = !!charDef.leader.passiveAbility;
                  return (
                    <motion.div
                      key={charId}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => pickLeader(setId, charId)}
                      style={{
                        background:   isOn ? theme.bg : COLORS_UI.bgCard,
                        border:       `2px solid ${isOn ? theme.border : COLORS_UI.border}`,
                        borderRadius: BORDERS.radius.lg,
                        padding:      SPACING[3],
                        cursor:       'pointer',
                        boxShadow:    isOn ? `0 0 16px ${theme.glow}` : 'none',
                        display:      'flex', gap: SPACING[3], alignItems: 'center',
                        transition:   'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: 32 }}>{charDef.basics.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontWeight: TYPOGRAPHY.weight.black, color: isOn ? theme.text : COLORS_UI.text, fontSize: TYPOGRAPHY.size.md }}>
                          {charDef.basics.name}
                        </div>
                        <div style={{ display: 'flex', gap: SPACING[1], marginTop: 4, flexWrap: 'wrap' }}>
                          {[
                            { label: `P:${attrs.presencia}`, color: COLORS_GAME.rojo },
                            { label: `I:${attrs.influencia}`, color: COLORS_GAME.morado },
                            { label: `T:${attrs.temple}`,     color: COLORS_GAME.verde },
                          ].map(({ label, color }) => (
                            <span key={label} style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '9px', background: color + '22', color, borderRadius: 3, padding: '1px 5px', fontWeight: 'bold' }}>
                              {label}
                            </span>
                          ))}
                          <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '9px', color: COLORS_UI.textMuted, padding: '1px 0' }}>{aura}A</span>
                        </div>
                        {(hasAct || hasPas) && (
                          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textSecondary, marginTop: 2 }}>
                            {hasAct && <span>⚡ {charDef.leader.activeAbility.keywordIds[0]} </span>}
                            {hasPas && <span>🛡️ {charDef.leader.passiveAbility.keywordIds[0]}</span>}
                          </div>
                        )}
                      </div>
                      {isOn && <span style={{ fontSize: 20, color: theme.text }}>✓</span>}
                    </motion.div>
                  );
                })}
              </div>
            </div>
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
          marginTop: 'auto',
        }}
      >
        VER BARAJA →
      </motion.button>
    </div>
  );
}
