import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../../store/index.js';
import { getRandomEcos } from '../../../data/ecoLibrary.js';
import { CHARACTERS } from '../../../data/phase1Data.js';
import { COLORS_UI, TYPOGRAPHY, SPACING, BORDERS, COLORS_GAME } from '../../../styles/tokens.js';

const RARITY_COLORS = {
  normal:      '#aaa',
  infrecuente: '#4A90D9',
  raro:        '#FFD700',
  especial:    '#ff6b6b',
};

export default function RewardScreen() {
  const setScreen  = useStore(s => s.setScreen);
  const run        = useStore(s => s.run);
  const updateRun  = useStore(s => s.updateRun);
  const collection = useStore(s => s.collection);

  const chars = useMemo(() => ({ ...CHARACTERS, ...(collection?.characters ?? {}) }), [collection]);

  // Detect just-completed node
  const area     = run?.areas?.[run.currentAreaIndex ?? 0];
  const nodes    = area?.nodes ?? [];
  const nodePtr  = area?.currentNodeIndex ?? 0;
  const lastNode = nodes[Math.max(0, nodePtr - 1)];
  const nodeType = lastNode?.type ?? 'combat_basic';
  const isBoss   = nodeType === 'boss' || nodeType === 'fusionado';
  const isElite  = nodeType === 'elite';

  const bonusLereles  = isBoss ? 10 : 0;
  const lerelesGained = (run?.deck?.length ?? 0) * 2 + bonusLereles;
  const koLeaderIds   = run?.koLeaderIds ?? [];

  const ecoRarity = isBoss ? 'raro' : isElite ? 'infrecuente' : 'normal';
  const [ecoOptions] = useState(() => getRandomEcos(ecoRarity, 3));

  // phases: lereles → ecos → ko (optional) → done
  const [phase, setPhase] = useState('lereles');

  const advanceFromEcos = () => {
    if (koLeaderIds.length > 0) setPhase('ko');
    else setPhase('done');
  };

  const handleChooseEco = (eco) => {
    const newEcos = [...(run?.activeEcos ?? [])];
    if (newEcos.length < 10) newEcos.push(eco.id);
    updateRun({ activeEcos: newEcos, lereles: (run?.lereles ?? 0) + lerelesGained });
    advanceFromEcos();
  };

  const handleSkipEco = () => {
    updateRun({ lereles: (run?.lereles ?? 0) + lerelesGained });
    advanceFromEcos();
  };

  const handleRevive = (charId) => {
    if ((run?.lereles ?? 0) < 5) return;
    const newKo = koLeaderIds.filter(id => id !== charId);
    updateRun({ lereles: (run?.lereles ?? 0) - 5, koLeaderIds: newKo });
  };

  const handleContinue = () => {
    if (phase === 'lereles') { setPhase('ecos'); return; }
    if (phase === 'ko')      { setPhase('done'); return; }
    if (phase === 'done') {
      const isRunComplete = run?.areas?.every(a => a.nodes.every(n => n.completed));
      setScreen(isRunComplete ? 'run-end' : 'map');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: COLORS_UI.bg,
      display: 'flex', flexDirection: 'column',
      maxWidth: 460, margin: '0 auto',
      padding: SPACING[4], gap: SPACING[3],
    }}>

      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        {isBoss ? (
          <motion.div
            animate={{ scale: [1, 1.08, 1], textShadow: ['0 0 12px #FFD70088', '0 0 32px #FFD700cc', '0 0 12px #FFD70088'] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size['3xl'], fontWeight: TYPOGRAPHY.weight.black, color: '#FFD700', letterSpacing: '0.12em' }}
          >
            🏆 BOSS DERROTADO
          </motion.div>
        ) : (
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size['2xl'], fontWeight: TYPOGRAPHY.weight.black, color: COLORS_GAME.verde, letterSpacing: '0.1em' }}>
            ✓ VICTORIA
          </div>
        )}
        {lastNode && (
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, marginTop: SPACING[1] }}>
            {nodeType === 'fusionado' ? '💀 Fusionado eliminado' :
             nodeType === 'boss'      ? '👑 Boss eliminado' :
             nodeType === 'elite'     ? '⚔️⚔️ Élite derrotado' :
             nodeType === 'conquista' ? '🏰 Conquista completada' : 'Corrupto derrotado'}
          </div>
        )}
      </div>

      {/* Phase: lereles */}
      {phase === 'lereles' && (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textSecondary }}>
            Lereles ganados
          </div>
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.3 }}
            style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: 'clamp(48px,12vw,72px)', fontWeight: TYPOGRAPHY.weight.black, color: '#FFD700' }}
          >
            +{lerelesGained}
          </motion.div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
            {run?.deck?.length ?? 0} cartas × 2{isBoss ? ' +10 bonus boss' : ''}
          </div>
        </motion.div>
      )}

      {/* Phase: ecos */}
      {phase === 'ecos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.text }}>
              Elige un Eco
            </div>
            <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, background: RARITY_COLORS[ecoRarity] + '22', color: RARITY_COLORS[ecoRarity], borderRadius: BORDERS.radius.sm, padding: '2px 8px', fontWeight: TYPOGRAPHY.weight.bold, textTransform: 'uppercase' }}>
              {ecoRarity}
            </span>
          </div>
          {ecoOptions.map(eco => (
            <motion.div
              key={eco.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleChooseEco(eco)}
              style={{
                background: COLORS_UI.bgCard, border: `2px solid ${RARITY_COLORS[eco.rarity] ?? '#aaa'}`,
                borderRadius: BORDERS.radius.lg, padding: SPACING[3], cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text }}>{eco.name}</span>
                <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: RARITY_COLORS[eco.rarity], textTransform: 'uppercase', fontWeight: TYPOGRAPHY.weight.bold }}>
                  {eco.rarity}
                </span>
              </div>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textSecondary }}>
                {eco.desc}
              </div>
              {eco.doubleFilo && (
                <div style={{ marginTop: 6, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_GAME.rojo, background: COLORS_GAME.rojo + '22', borderRadius: BORDERS.radius.sm, padding: '2px 6px', display: 'inline-block' }}>
                  ⚠️ DOBLE FILO: {eco.penalty}
                </div>
              )}
            </motion.div>
          ))}
          <button
            onClick={handleSkipEco}
            style={{ background: 'none', border: 'none', color: COLORS_UI.textMuted, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, cursor: 'pointer', textDecoration: 'underline', padding: `${SPACING[1]} 0` }}
          >
            Continuar sin eco →
          </button>
        </div>
      )}

      {/* Phase: KO leaders */}
      {phase === 'ko' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_GAME.rojo }}>
            💀 Líderes caídos
          </div>
          {(run?.koLeaderIds ?? []).map(charId => {
            const def = chars[charId];
            const canRevive = (run?.lereles ?? 0) >= 5;
            return (
              <div key={charId} style={{ display: 'flex', alignItems: 'center', gap: SPACING[3], background: COLORS_UI.bgCard, border: `1px solid ${COLORS_GAME.rojo}44`, borderRadius: BORDERS.radius.lg, padding: SPACING[3] }}>
                <span style={{ fontSize: 28, opacity: 0.4 }}>{def?.basics?.emoji ?? '👤'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.textMuted }}>{def?.basics?.name ?? charId}</div>
                  <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>Fuera de combate</div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  disabled={!canRevive}
                  onClick={() => handleRevive(charId)}
                  style={{
                    padding: `${SPACING[1]} ${SPACING[2]}`, background: canRevive ? COLORS_GAME.verde + '22' : COLORS_UI.bgElevated,
                    border: `1px solid ${canRevive ? COLORS_GAME.verde : COLORS_UI.border}`,
                    borderRadius: BORDERS.radius.md, color: canRevive ? COLORS_GAME.verde : COLORS_UI.textMuted,
                    fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, cursor: canRevive ? 'pointer' : 'default',
                    fontWeight: TYPOGRAPHY.weight.bold,
                  }}
                >
                  💊 −5L
                </motion.button>
              </div>
            );
          })}
          {(run?.koLeaderIds ?? []).length === 0 && (
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_GAME.verde, textAlign: 'center' }}>
              Todos reanimados ✓
            </div>
          )}
        </div>
      )}

      {/* Phase: done */}
      {phase === 'done' && (
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48 }}>{isBoss ? '👑' : '✨'}</div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.text, marginTop: SPACING[2] }}>
            {isBoss ? 'Área completada' : 'Listo'}
          </div>
        </motion.div>
      )}

      {/* CTA button */}
      {phase !== 'ecos' && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleContinue}
          style={{
            marginTop: 'auto', width: '100%', padding: `${SPACING[4]} 0`,
            background: phase === 'done' ? (isBoss ? '#FFD700' : COLORS_GAME.verde) : COLORS_GAME.verde,
            border: 'none', borderRadius: BORDERS.radius.xl,
            color: phase === 'done' && isBoss ? '#000' : 'white',
            fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg,
            fontWeight: TYPOGRAPHY.weight.black, letterSpacing: '0.1em', cursor: 'pointer',
            boxShadow: `0 6px 24px ${COLORS_GAME.verde}66`,
          }}
        >
          {phase === 'lereles' ? 'ELEGIR ECO →' :
           phase === 'ko'      ? 'CONTINUAR →' :
           phase === 'done'    ? (isBoss ? 'NUEVA ÁREA →' : 'CONTINUAR →') : 'CONTINUAR →'}
        </motion.button>
      )}
    </div>
  );
}
