import { useState } from 'react';
import { motion } from 'framer-motion';
import useStore from '../../../store/index.js';
import { ECO_LIBRARY, ECO_BY_RARITY } from '../../../data/ecoLibrary.js';
import { COLORS_UI, TYPOGRAPHY, SPACING, BORDERS, COLORS_GAME } from '../../../styles/tokens.js';

const RARITY_COLOR = { normal: '#aaa', infrecuente: '#4A90D9', raro: '#FFD700', especial: '#ff6b6b' };

function pickEcos(rarity, count, excludeIds) {
  const ex = new Set(excludeIds);
  const pool = (ECO_BY_RARITY[rarity] ?? []).filter(e => !ex.has(e.id));
  return [...pool].sort(() => Math.random() - 0.5).slice(0, count);
}

function buildPool(nodeType, ownedIds) {
  if (nodeType === 'fusionado')
    return pickEcos('raro', 3, ownedIds);
  if (nodeType === 'boss')
    return [...pickEcos('infrecuente', 2, ownedIds), ...pickEcos('raro', 1, ownedIds)].sort(() => Math.random() - 0.5);
  if (nodeType === 'elite' || nodeType === 'conquista')
    return [...pickEcos('normal', 2, ownedIds), ...pickEcos('infrecuente', 1, ownedIds)].sort(() => Math.random() - 0.5);
  return pickEcos('normal', 3, ownedIds);
}

function EcoCard({ eco, selected, onClick }) {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        background: selected ? COLORS_UI.bgElevated : COLORS_UI.bgCard,
        border: `2px solid ${selected ? COLORS_GAME.verde : (RARITY_COLOR[eco.rarity] ?? '#aaa')}`,
        borderRadius: BORDERS.radius.lg, padding: SPACING[3], cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text }}>{eco.name}</span>
        <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: RARITY_COLOR[eco.rarity], textTransform: 'uppercase', fontWeight: TYPOGRAPHY.weight.bold }}>{eco.rarity}</span>
      </div>
      <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textSecondary }}>{eco.desc}</div>
      {eco.doubleFilo && (
        <div style={{ marginTop: 6, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_GAME.rojo, background: COLORS_GAME.rojo + '22', borderRadius: BORDERS.radius.sm, padding: '2px 6px', display: 'inline-block' }}>
          ⚠️ DOBLE FILO: {eco.penalty}
        </div>
      )}
    </motion.div>
  );
}

export default function EcoSelectionScreen() {
  const setScreen    = useStore(s => s.setScreen);
  const run          = useStore(s => s.run);
  const combat       = useStore(s => s.combat);
  const addRunEco    = useStore(s => s.addRunEco);
  const removeRunEco = useStore(s => s.removeRunEco);

  const ownedIds = run?.activeEcos ?? [];
  const nodeType = combat?.nodeType ?? 'combat_basic';
  const isFull   = ownedIds.length >= 10;

  const [ecoOptions]          = useState(() => buildPool(nodeType, ownedIds));
  const [phase, setPhase]     = useState(isFull ? 'discard' : 'pick');
  const [discardTarget, setDiscardTarget] = useState(null);

  const navigateNext = () => {
    const done = run?.areas?.every(a => a.nodes.every(n => n.completed));
    setScreen(done ? 'run-end' : 'map');
  };

  const handlePickEco = (eco) => {
    addRunEco(eco.id);
    setPhase('done');
  };

  const handleConfirmDiscard = () => {
    if (!discardTarget) return;
    removeRunEco(discardTarget);
    setDiscardTarget(null);
    setPhase('pick');
  };

  return (
    <div style={{
      minHeight: '100vh', background: COLORS_UI.bg,
      display: 'flex', flexDirection: 'column',
      maxWidth: 460, margin: '0 auto', padding: SPACING[4], gap: SPACING[3],
    }}>
      <div style={{ textAlign: 'center', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size['2xl'], fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text, letterSpacing: '0.05em' }}>
        🌿 ECOS
      </div>
      <div style={{ textAlign: 'center', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textMuted }}>
        {ownedIds.length}/10 slots
      </div>

      {/* ── DISCARD: must remove 1 before picking ────────────────────────── */}
      {phase === 'discard' && (
        <>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_GAME.rojo, textAlign: 'center' }}>
            Tienes 10 ecos. Descarta 1 para elegir uno nuevo.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2], overflowY: 'auto' }}>
            {ownedIds.map(id => {
              const eco = ECO_LIBRARY[id];
              if (!eco) return null;
              return (
                <EcoCard
                  key={id}
                  eco={eco}
                  selected={discardTarget === id}
                  onClick={() => setDiscardTarget(prev => prev === id ? null : id)}
                />
              );
            })}
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={!discardTarget}
            onClick={handleConfirmDiscard}
            style={{
              marginTop: 'auto', width: '100%', padding: `${SPACING[4]} 0`,
              background: discardTarget ? COLORS_GAME.rojo : COLORS_UI.bgElevated,
              border: 'none', borderRadius: BORDERS.radius.xl,
              color: discardTarget ? 'white' : COLORS_UI.textMuted,
              fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg,
              fontWeight: TYPOGRAPHY.weight.black, letterSpacing: '0.1em',
              cursor: discardTarget ? 'pointer' : 'not-allowed',
            }}
          >
            DESCARTAR SELECCIONADO →
          </motion.button>
        </>
      )}

      {/* ── PICK: choose 1 of 3 ──────────────────────────────────────────── */}
      {phase === 'pick' && (
        <>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.text, textAlign: 'center' }}>
            Elige un Eco
          </div>
          {ecoOptions.length === 0 ? (
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textMuted, textAlign: 'center' }}>
              No quedan ecos disponibles de esta rareza.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
              {ecoOptions.map(eco => (
                <EcoCard key={eco.id} eco={eco} selected={false} onClick={() => handlePickEco(eco)} />
              ))}
            </div>
          )}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={navigateNext}
            style={{
              marginTop: 'auto', width: '100%', padding: `${SPACING[3]} 0`,
              background: 'transparent', border: `1px solid ${COLORS_UI.border}`,
              borderRadius: BORDERS.radius.xl, color: COLORS_UI.textMuted,
              fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md,
              fontWeight: TYPOGRAPHY.weight.bold, cursor: 'pointer',
            }}
          >
            Saltar →
          </motion.button>
        </>
      )}

      {/* ── DONE ─────────────────────────────────────────────────────────── */}
      {phase === 'done' && (
        <>
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}
          >
            <div style={{ fontSize: 48 }}>✨</div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.text, marginTop: SPACING[2] }}>
              Eco añadido
            </div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textMuted, marginTop: SPACING[1] }}>
              {(run?.activeEcos?.length ?? 0)}/10 slots
            </div>
          </motion.div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={navigateNext}
            style={{
              width: '100%', padding: `${SPACING[4]} 0`,
              background: COLORS_GAME.verde, border: 'none',
              borderRadius: BORDERS.radius.xl, color: 'white',
              fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg,
              fontWeight: TYPOGRAPHY.weight.black, letterSpacing: '0.1em',
              cursor: 'pointer', boxShadow: `0 6px 24px ${COLORS_GAME.verde}66`,
            }}
          >
            AL MAPA →
          </motion.button>
        </>
      )}
    </div>
  );
}
