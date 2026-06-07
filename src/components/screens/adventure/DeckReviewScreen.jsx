import { useMemo } from 'react';
import { motion } from 'framer-motion';
import useStore from '../../../store/index.js';
import { guestAura, leaderAura } from '../../../engine/character/auraCalculator.js';
import { split } from '../../../engine/character/attributeSplit.js';
import { generateRun } from '../../../engine/run/runGenerator.js';
import { getTheme } from '../../../styles/colorThemes.js';
import { COLORS_UI, TYPOGRAPHY, SPACING, BORDERS, COLORS_GAME } from '../../../styles/tokens.js';

export default function DeckReviewScreen() {
  const setScreen  = useStore(s => s.setScreen);
  const initRun    = useStore(s => s.initRun);
  const runConfig  = useStore(s => s.runConfig);
  const collection = useStore(s => s.collection);
  const getDataCtx = useStore(s => s.getDataCtx);

  const { selectedSets = [], selectedLeaders = {} } = runConfig ?? {};
  const leaderIds   = selectedSets.map(id => selectedLeaders[id]).filter(Boolean);

  const dataCtx = useMemo(() => getDataCtx(), [collection]);

  const allGuests = selectedSets.flatMap(setId =>
    (dataCtx.sets[setId]?.guests ?? []).map(charId => ({ charId, setId }))
  );

  const handleStart = () => {
    const run = generateRun(selectedSets, leaderIds, dataCtx);
    initRun(run);
    setScreen('map');
  };

  return (
    <div style={{
      minHeight: '100vh', background: COLORS_UI.bg, display: 'flex',
      flexDirection: 'column', maxWidth: 460, margin: '0 auto',
      padding: SPACING[4], gap: SPACING[3],
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size['2xl'], fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text, letterSpacing: '0.1em' }}>
          TU BARAJA
        </div>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textSecondary, marginTop: SPACING[1] }}>
          {allGuests.length} cartas · {leaderIds.length} líderes
        </div>
      </div>

      {/* Líderes */}
      <div>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.textSecondary, marginBottom: SPACING[1] }}>
          LÍDERES
        </div>
        <div style={{ display: 'flex', gap: SPACING[2], flexWrap: 'wrap' }}>
          {leaderIds.map(charId => {
            const def   = dataCtx.characters[charId];
            const theme = getTheme(def?.colorId);
            const aura  = def ? leaderAura(def) : 0;
            const attrs = def ? split(aura, def.colorId) : {};
            return (
              <div key={charId} style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: BORDERS.radius.md, padding: SPACING[2], minWidth: 80, textAlign: 'center' }}>
                <div style={{ fontSize: 22 }}>{def?.basics?.emoji ?? '⭐'}</div>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, color: theme.text }}>{def?.basics?.name}</div>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '9px', color: COLORS_UI.textMuted, marginTop: 2 }}>
                  P{attrs.presencia} I{attrs.influencia} T{attrs.temple}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invitados */}
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.textSecondary, marginBottom: SPACING[1] }}>
          INVITADOS ({allGuests.length})
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SPACING[1] }}>
          {allGuests.map(({ charId, setId }, idx) => {
            const def   = dataCtx.characters[charId];
            const set   = dataCtx.sets[setId];
            const theme = getTheme(set?.colorId);
            const aura  = def ? guestAura(def) : 0;
            const attrs = def ? split(aura, def.colorId) : {};
            return (
              <div key={`${charId}-${idx}`} style={{ display: 'flex', flexDirection: 'column', gap: 2, background: COLORS_UI.bgCard, border: `1px solid ${theme.border}22`, borderRadius: BORDERS.radius.md, padding: SPACING[2] }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[1] }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{def?.basics?.emoji ?? '⭐'}</span>
                  <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{def?.basics?.name}</span>
                </div>
                <div style={{ display: 'flex', gap: 3, fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '8px' }}>
                  <span style={{ color: COLORS_GAME.rojo, background: COLORS_GAME.rojo + '22', borderRadius: 2, padding: '0 3px' }}>P{attrs.presencia}</span>
                  <span style={{ color: COLORS_GAME.morado, background: COLORS_GAME.morado + '22', borderRadius: 2, padding: '0 3px' }}>I{attrs.influencia}</span>
                  <span style={{ color: COLORS_GAME.verde, background: COLORS_GAME.verde + '22', borderRadius: 2, padding: '0 3px' }}>T{attrs.temple}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: SPACING[2] }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setScreen('leader-selection')}
          style={{ flex: 1, padding: `${SPACING[3]} 0`, background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, color: COLORS_UI.textSecondary, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, cursor: 'pointer' }}
        >
          ← Atrás
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleStart}
          style={{ flex: 2, padding: `${SPACING[3]} 0`, background: COLORS_GAME.rojo, border: 'none', borderRadius: BORDERS.radius.lg, color: 'white', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.black, letterSpacing: '0.1em', cursor: 'pointer', boxShadow: `0 6px 24px ${COLORS_GAME.rojo}66` }}
        >
          ¡AL MAPA! 🗺️
        </motion.button>
      </div>
    </div>
  );
}
