import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import useStore from '../../../store/index.js';
import { ACHIEVEMENTS, checkRunAchievements } from '../../../data/achievements.js';
import { COLORS_UI, TYPOGRAPHY, SPACING, BORDERS, COLORS_GAME } from '../../../styles/tokens.js';

export default function RunEndScreen() {
  const setScreen           = useStore(s => s.setScreen);
  const run                 = useStore(s => s.run);
  const collection          = useStore(s => s.collection);
  const meta                = useStore(s => s.meta);
  const dispatchMeta        = useStore(s => s.dispatchMeta);
  const showAchievementToast = useStore(s => s.showAchievementToast);

  const recordedRef = useRef(false);

  const isWin       = run?.victory === 'win';
  const leadersUsed = (run?.leaderIds ?? run?.selectedLeaderIds ?? []).length;
  const flowCount   = run?.totalFlows ?? 0;
  const pifiaCount  = run?.totalPifias ?? 0;
  const vibTime     = run?.vibrationTimeTotal ?? 0;
  const lereles     = run?.lereles ?? 0;
  const crownLabel  = ['', '👑', '👑👑', '👑👑👑', '👑👑👑👑'][Math.min(leadersUsed, 4)] ?? '';

  // Count completed nodes
  const nodesCompleted = (run?.areas ?? [])
    .flatMap(a => a.nodes ?? [])
    .filter(n => n.completed).length;

  // Count confirmed sets
  const setsConfirmed = Object.values(collection?.sets ?? {})
    .filter(s => s.status === 'confirmed' || s.status === 'inUse').length;

  // Record run end once on mount
  useEffect(() => {
    if (recordedRef.current || !run) return;
    recordedRef.current = true;

    const runData = {
      result:          isWin ? 'win' : 'lose',
      leaderIds:       run.leaderIds ?? run.selectedLeaderIds ?? [],
      setIds:          run.setIds ?? [],
      nodesCompleted,
      ecosUsed:        (run.activeEcos ?? []).length,
      kosReceived:     run.totalKOs ?? 0,
      activeEcos:      run.activeEcos ?? [],
      conqueredPlaceIds: run.conqueredPlaceIds ?? [],
      totalFlows:      flowCount,
      totalPifias:     pifiaCount,
      vibrationTimeMs: vibTime,
      setsConfirmed,
      defeatedFused:   run.defeatedFused ?? (isWin && nodesCompleted > 0),
    };

    // Record run (also evaluates achievements internally via RECORD_RUN_END)
    dispatchMeta({ type: 'RECORD_RUN_END', runData });

    // Fire toasts for newly unlocked achievements (newlyUnlocked set by reducer)
    // We delay slightly to let the state settle
    setTimeout(() => {
      const updatedMeta = useStore.getState().meta;
      const newIds = updatedMeta.newlyUnlocked ?? [];
      newIds.slice(0, 3).forEach((id, idx) => {
        setTimeout(() => showAchievementToast(id), idx * 3700);
      });
      if (newIds.length > 0) {
        dispatchMeta({ type: 'CLEAR_NEW_UNLOCKED' });
      }
    }, 800);

    // Also check collection-based achievements not covered by checkRunAchievements
    const currentAchs = meta.achievements ?? {};
    const collectionNewIds = [];

    if (!currentAchs.coleccionista?.unlocked && setsConfirmed >= 5) {
      collectionNewIds.push('coleccionista');
    }
    if (!currentAchs.el_archivo?.unlocked && (run.activeEcos ?? []).length >= 10 && isWin) {
      collectionNewIds.push('el_archivo');
    }

    collectionNewIds.forEach(id => {
      dispatchMeta({ type: 'UNLOCK_ACHIEVEMENT', id });
    });

    // Toast for collection achievements (offset after run-end ones)
    const runNewCount = checkRunAchievements(
      { win: isWin, leadersUsed, totalFlows: flowCount, totalPifias: pifiaCount, vibrationTimeMs: vibTime, defeatedFused: runData.defeatedFused, setsConfirmed },
      currentAchs
    ).length;
    collectionNewIds.forEach((id, idx) => {
      setTimeout(() => showAchievementToast(id), (runNewCount + idx) * 3700 + 800);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRestart = () => setScreen('set-selection');
  const handleMenu    = () => setScreen('login');

  return (
    <div style={{ minHeight: '100vh', background: COLORS_UI.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', maxWidth: 460, margin: '0 auto', padding: SPACING[6], gap: SPACING[4] }}>

      <motion.div
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12 }}
        style={{ textAlign: 'center' }}
      >
        <div style={{ fontSize: 72 }}>{isWin ? '🏆' : '💀'}</div>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: 'clamp(32px,10vw,56px)', fontWeight: TYPOGRAPHY.weight.black, color: isWin ? '#FFD700' : COLORS_GAME.rojo, letterSpacing: '0.12em', marginTop: SPACING[2] }}>
          {isWin ? 'VICTORIA' : 'DERROTA'}
        </div>
        {isWin && crownLabel && (
          <div style={{ fontSize: 28, marginTop: SPACING[1] }}>{crownLabel}</div>
        )}
      </motion.div>

      {/* Estadísticas */}
      <div style={{ background: COLORS_UI.bgCard, borderRadius: BORDERS.radius.lg, border: `1px solid ${COLORS_UI.border}`, padding: SPACING[3], width: '100%', display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
        {[
          { label: 'Flows conseguidos',   value: flowCount,                                            icon: '✨' },
          { label: 'Tiempo de Vibración', value: `${Math.floor(vibTime/60000)}:${String(Math.floor((vibTime%60000)/1000)).padStart(2,'0')}`, icon: '⏱️' },
          { label: 'Lereles al acabar',   value: lereles,                                              icon: '⭐' },
          { label: 'Líderes usados',      value: leadersUsed,                                          icon: '👥' },
          { label: 'Nodos completados',   value: nodesCompleted,                                       icon: '🗺️' },
        ].map(({ label, value, icon }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textSecondary }}>{icon} {label}</span>
            <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.text }}>{value}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2], width: '100%' }}>
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleRestart}
          style={{ width: '100%', padding: `${SPACING[4]} 0`, background: isWin ? '#FFD700' : COLORS_GAME.rojo, border: 'none', borderRadius: BORDERS.radius.xl, color: isWin ? '#000' : 'white', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.black, letterSpacing: '0.1em', cursor: 'pointer', boxShadow: `0 6px 24px ${isWin ? '#FFD700' : COLORS_GAME.rojo}66` }}>
          {isWin ? '¡OTRA RUN! 🚀' : '🔄 INTENTARLO DE NUEVO'}
        </motion.button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleMenu}
          style={{ width: '100%', padding: `${SPACING[3]} 0`, background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.xl, color: COLORS_UI.textSecondary, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, cursor: 'pointer' }}>
          Volver al menú
        </motion.button>
      </div>
    </div>
  );
}
