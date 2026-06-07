import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../../store/index.js';
import { buildCombatFromNode } from '../../../engine/combat/buildCombatFromNode.js';
import { CHARACTERS } from '../../../data/phase1Data.js';
import { getTheme } from '../../../styles/colorThemes.js';
import { COLORS_UI, TYPOGRAPHY, SPACING, BORDERS, COLORS_GAME } from '../../../styles/tokens.js';

const NODE_ICONS  = { combat_basic: '⚔️', elite: '⚔️⚔️', conquista: '🏰', boss: '👑', fusionado: '💀' };
const NODE_COLORS = { combat_basic: COLORS_GAME.rojo, elite: '#E0823B', conquista: COLORS_GAME.morado, boss: '#FFD700', fusionado: '#AA3333' };

export default function MapScreen() {
  const setScreen      = useStore(s => s.setScreen);
  const run            = useStore(s => s.run);
  const setCombat      = useStore(s => s.setCombat);
  const collection     = useStore(s => s.collection);
  const [modal, setModal]     = useState(null);
  const [preview, setPreview] = useState(null); // { node } — panel previa al combate
  const [bossIntro, setBossIntro] = useState(null); // { name, color, node }

  const dataCtx = useMemo(() => ({
    characters: { ...CHARACTERS, ...(collection?.characters ?? {}) },
    places: { ...(collection?.places ?? {}) },
  }), [collection]);

  if (!run?.areas) {
    return (
      <div style={{ minHeight: '100vh', background: COLORS_UI.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: SPACING[3] }}>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, color: COLORS_UI.textMuted }}>Sin run activa.</div>
        <button onClick={() => setScreen('set-selection')} style={{ padding: `${SPACING[2]} ${SPACING[4]}`, background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.md, color: COLORS_UI.text, cursor: 'pointer', fontFamily: TYPOGRAPHY.fontFamily }}>
          Nueva partida
        </button>
      </div>
    );
  }

  const areas       = run.areas;
  const areaIdx     = run.currentAreaIndex ?? 0;
  const currentArea = areas[areaIdx];
  const nodes       = currentArea?.nodes ?? [];
  const nodePtr     = currentArea?.currentNodeIndex ?? 0;

  const startNode = (node) => {
    const combat = buildCombatFromNode(node, run, dataCtx);
    setCombat(combat);
  };

  const handleNodeTap = (node) => {
    const realIdx = nodes.indexOf(node);
    if (node.completed || realIdx > nodePtr) return;
    if (node.type === 'boss' || node.type === 'fusionado') {
      const def   = dataCtx.characters[node.corruptCharId];
      const name  = def?.basics?.name ?? node.corruptCharId;
      const color = def ? getTheme(def.colorId).border : COLORS_GAME.rojo;
      setBossIntro({ name, color, node });
    } else if (node.canBeMerchant) {
      setModal({ node });
    } else {
      setPreview({ node });
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #06060A 0%, #0D0018 100%)', display: 'flex', flexDirection: 'column', maxWidth: 460, margin: '0 auto', position: 'relative' }}>

      {/* Header */}
      <div style={{ padding: `${SPACING[3]} ${SPACING[4]}`, background: 'rgba(14,14,18,0.9)', borderBottom: `1px solid ${COLORS_UI.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontWeight: TYPOGRAPHY.weight.black, color: '#FFD700', fontSize: TYPOGRAPHY.size.lg, letterSpacing: '0.05em' }}>
            ÁREA {areaIdx + 1} <span style={{ color: COLORS_UI.textMuted, fontSize: TYPOGRAPHY.size.sm }}>/ {areas.length}</span>
          </div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textSecondary }}>
            Nodo {Math.min(nodePtr + 1, nodes.length)} / {nodes.length}
          </div>
        </div>
        <div style={{ display: 'flex', gap: SPACING[2], alignItems: 'center' }}>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontWeight: TYPOGRAPHY.weight.bold, color: '#FFD700', background: '#FFD70015', border: '1px solid #FFD70033', borderRadius: BORDERS.radius.md, padding: `${SPACING[1]} ${SPACING[2]}` }}>
            ⭐ {run.lereles ?? 0}
          </div>
          <button onClick={() => setScreen('main-menu')} style={{ background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.sm, color: COLORS_UI.textMuted, padding: '4px 8px', cursor: 'pointer', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs }}>← Menú</button>
        </div>
      </div>

      {/* Ecos activos */}
      {(run.activeEcos ?? []).length > 0 && (
        <div style={{ padding: `${SPACING[1]} ${SPACING[4]}`, display: 'flex', gap: SPACING[1], flexWrap: 'wrap', background: COLORS_UI.bgCard, borderBottom: `1px solid ${COLORS_UI.border}` }}>
          {run.activeEcos.map(id => (
            <span key={id} style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '10px', background: COLORS_UI.bgElevated, borderRadius: BORDERS.radius.sm, padding: '1px 6px', color: COLORS_UI.textSecondary }}>✨ {id}</span>
          ))}
        </div>
      )}

      {/* Nodos (de abajo a arriba) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: SPACING[4], gap: SPACING[2] }}>
        {[...nodes].reverse().map((node) => {
          const realIdx   = nodes.indexOf(node);
          const isDone    = node.completed;
          const isCurrent = realIdx === nodePtr && !isDone;
          const isFuture  = realIdx > nodePtr;
          const color     = NODE_COLORS[node.type] ?? COLORS_GAME.rojo;
          const def       = dataCtx.characters[node.corruptCharId];
          const enemyName = def?.basics?.name ?? '?';

          const placeDef = node.placeId ? dataCtx.places?.[node.placeId] : null;
          const placeLabel = placeDef?.name ?? (node.placeId ? node.placeId.replace(/-/g, ' ') : null);

          return (
            <motion.div
              key={node.index}
              whileTap={!isFuture && !isDone ? { scale: 0.97 } : {}}
              animate={isCurrent ? { boxShadow: [`0 0 0px ${color}00`, `0 0 24px ${color}88`, `0 0 0px ${color}00`] } : {}}
              transition={isCurrent ? { duration: 1.8, repeat: Infinity } : {}}
              onClick={() => handleNodeTap(node)}
              style={{
                background:   isDone ? 'rgba(255,255,255,0.03)' : isFuture ? 'rgba(255,255,255,0.02)' : `${color}0A`,
                border:       `2px solid ${isDone ? '#2a2a35' : isCurrent ? color : isFuture ? '#2a2a35' : color + '44'}`,
                borderRadius: BORDERS.radius.lg,
                padding:      SPACING[3],
                cursor:       isFuture || isDone ? 'default' : 'pointer',
                opacity:      isFuture ? 0.35 : isDone ? 0.55 : 1,
                display:      'flex', alignItems: 'center', gap: SPACING[3],
              }}
            >
              <div style={{
                width: 40, height: 40, flexShrink: 0,
                background: isDone ? '#1A1A22' : `${color}1A`,
                border: `1px solid ${isDone ? '#333' : color + '44'}`,
                borderRadius: BORDERS.radius.md,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
              }}>
                {isDone ? '✓' : (NODE_ICONS[node.type] ?? '⚔️')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontWeight: TYPOGRAPHY.weight.bold, color: isDone ? COLORS_UI.textMuted : color, fontSize: TYPOGRAPHY.size.sm, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {node.type === 'combat_basic' ? `Corrupto ${enemyName}` :
                   node.type === 'elite'         ? `⚔️⚔️ Élite — ${enemyName}` :
                   node.type === 'conquista'     ? `Conquista — ${enemyName}` :
                   node.type === 'boss'          ? `👑 BOSS — ${enemyName}` :
                   node.type === 'fusionado'     ? '💀 FUSIONADO' : node.type}
                </div>
                {placeLabel && (
                  <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    📍 {placeLabel}
                  </div>
                )}
              </div>
              {node.canBeMerchant && !isDone && !isFuture && (
                <span style={{ fontSize: TYPOGRAPHY.size.xs, color: COLORS_GAME.verde, background: COLORS_GAME.verde + '22', borderRadius: BORDERS.radius.sm, padding: '2px 6px', flexShrink: 0 }}>🛒</span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Modal combatir / mercader */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setModal(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', zIndex: 300 }}>
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: 460, margin: '0 auto', background: COLORS_UI.bgElevated, borderRadius: `${BORDERS.radius.lg} ${BORDERS.radius.lg} 0 0`, padding: SPACING[4], display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text, fontSize: TYPOGRAPHY.size.lg, textAlign: 'center' }}>
                Elige tu acción
              </div>
              <button onClick={() => { setModal(null); startNode(modal.node); setScreen('combat'); }}
                style={{ width: '100%', padding: `${SPACING[3]} 0`, background: COLORS_GAME.rojo, border: 'none', borderRadius: BORDERS.radius.lg, color: 'white', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.black, cursor: 'pointer' }}>
                ⚔️ Combatir
              </button>
              <button onClick={() => { setModal(null); setScreen('merchant'); }}
                style={{ width: '100%', padding: `${SPACING[3]} 0`, background: COLORS_GAME.verde + '22', border: `1px solid ${COLORS_GAME.verde}66`, borderRadius: BORDERS.radius.lg, color: COLORS_GAME.verde, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.bold, cursor: 'pointer' }}>
                🛒 Mercader (no hay combate esta vez)
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Node preview panel (3.4) */}
      <AnimatePresence>
        {preview && (() => {
          const n     = preview.node;
          const def   = dataCtx.characters[n.corruptCharId];
          const color = NODE_COLORS[n.type] ?? COLORS_GAME.rojo;
          const genericPlace = n.placeId ? (dataCtx.places?.[n.placeId] ?? null) : null;
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPreview(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'flex-end', zIndex: 300 }}>
              <motion.div initial={{ y: 120 }} animate={{ y: 0 }} exit={{ y: 120 }}
                onClick={e => e.stopPropagation()}
                style={{ width: '100%', maxWidth: 460, margin: '0 auto', background: COLORS_UI.bgElevated, borderRadius: `${BORDERS.radius.lg} ${BORDERS.radius.lg} 0 0`, padding: SPACING[4], display: 'flex', flexDirection: 'column', gap: SPACING[3] }}>
                {/* Enemy info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[3] }}>
                  <div style={{ width: 52, height: 52, background: color + '1A', border: `2px solid ${color}44`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                    {def?.basics?.emoji ?? '🔴'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontWeight: TYPOGRAPHY.weight.black, color, fontSize: TYPOGRAPHY.size.lg }}>
                      {def?.basics?.name ?? '?'}
                    </div>
                    <div style={{ display: 'flex', gap: SPACING[2], marginTop: 3 }}>
                      <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, background: color + '22', color, borderRadius: BORDERS.radius.sm, padding: '1px 6px', fontWeight: TYPOGRAPHY.weight.bold }}>
                        {NODE_ICONS[n.type]} {n.type === 'combat_basic' ? 'COMBATE' : n.type.toUpperCase()}
                      </span>
                      {n.attrBonus > 0 && (
                        <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, background: COLORS_GAME.naranja + '22', color: COLORS_GAME.naranja, borderRadius: BORDERS.radius.sm, padding: '1px 6px' }}>
                          +{n.attrBonus} attrs
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Place info */}
                {n.placeId && (
                  <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, background: COLORS_UI.bgCard, borderRadius: BORDERS.radius.md, padding: `${SPACING[1]} ${SPACING[2]}` }}>
                    📍 {genericPlace?.name ?? n.placeId.replace(/-/g, ' ')}
                  </div>
                )}
                <button
                  onClick={() => { setPreview(null); startNode(n); setScreen('combat'); }}
                  style={{ width: '100%', padding: `${SPACING[3]} 0`, background: color, border: 'none', borderRadius: BORDERS.radius.lg, color: '#fff', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.black, cursor: 'pointer' }}
                >
                  ⚔️ COMBATIR
                </button>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Boss intro overlay */}
      <AnimatePresence>
        {bossIntro && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: SPACING[3] }}
          >
            <motion.div initial={{ scale: 0.3 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: 'clamp(36px,10vw,56px)', fontWeight: TYPOGRAPHY.weight.black, color: bossIntro.color, letterSpacing: '0.1em', textAlign: 'center' }}>
                CORRUPTO {bossIntro.name.toUpperCase()}
              </div>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, color: COLORS_UI.textMuted, textAlign: 'center', marginTop: SPACING[1] }}>BOSS</div>
            </motion.div>
            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setBossIntro(null); startNode(bossIntro.node); setScreen('combat'); }}
              style={{ padding: `${SPACING[3]} ${SPACING[6]}`, background: bossIntro.color, border: 'none', borderRadius: BORDERS.radius.xl, color: '#000', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.black, cursor: 'pointer' }}
            >
              COMBATIR
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
