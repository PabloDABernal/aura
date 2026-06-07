import { useState } from 'react';
import { motion } from 'framer-motion';
import useStore from '../../../store/index.js';
import { ACHIEVEMENTS } from '../../../data/achievements.js';
import { COLORS_UI, TYPOGRAPHY, SPACING, BORDERS } from '../../../styles/tokens.js';

const CATEGORIES = [
  { key: 'run',        label: 'Run',        icon: '🏃', ids: ['run_duo','run_trio','run_quartet','run_quintet'] },
  { key: 'vibra',      label: 'Vibra',      icon: '⏱️', ids: ['en_el_flow','manos_limpias','relampago','perfeccionista','sin_red'] },
  { key: 'coleccion',  label: 'Colección',  icon: '📦', ids: ['primer_set','coleccionista','el_archivo','abraza_caos'] },
  { key: 'corrupcion', label: 'Corrupción', icon: '☠️', ids: ['purificador','sin_piedad','col_completo','psa_10'] },
];

function formatDate(ms) {
  if (!ms) return '';
  return new Date(ms).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AchievementsScreen() {
  const setScreen = useStore(s => s.setScreen);
  const meta      = useStore(s => s.meta);
  const [filter, setFilter] = useState('all');

  const unlockedCount = Object.values(meta?.achievements ?? {}).filter(a => a.unlocked).length;
  const totalCount    = Object.keys(ACHIEVEMENTS).length;

  return (
    <div style={{ minHeight: '100vh', background: COLORS_UI.bg, display: 'flex', flexDirection: 'column', maxWidth: 460, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: COLORS_UI.bg, borderBottom: `1px solid ${COLORS_UI.border}`, padding: `${SPACING[3]} ${SPACING[4]}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING[2] }}>
          <div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text }}>🏆 LOGROS</div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
              {unlockedCount}/{totalCount} desbloqueados
            </div>
          </div>
          <button onClick={() => setScreen('main-menu')} style={{ background: 'none', border: 'none', color: COLORS_UI.textMuted, cursor: 'pointer', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm }}>← Menú</button>
        </div>

        {/* Progress bar global */}
        <div style={{ height: 4, background: '#222230', borderRadius: 2, overflow: 'hidden' }}>
          <motion.div
            animate={{ width: `${(unlockedCount / totalCount) * 100}%` }}
            transition={{ duration: 0.8 }}
            style={{ height: '100%', background: 'linear-gradient(90deg, #FFD700, #FFA500)', borderRadius: 2 }}
          />
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: SPACING[1], marginTop: SPACING[2] }}>
          {[['all','Todos'],['done','Desbloqueados'],['pending','Pendientes']].map(([v,l]) => (
            <button key={v} onClick={() => setFilter(v)}
              style={{ flex: 1, padding: `${SPACING[1]} 0`, background: filter===v ? COLORS_UI.bgElevated : 'none', border: `1px solid ${filter===v ? COLORS_UI.border : 'transparent'}`, borderRadius: BORDERS.radius.sm, color: filter===v ? COLORS_UI.text : COLORS_UI.textMuted, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, cursor: 'pointer' }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Lista por categoría */}
      <div style={{ padding: `${SPACING[3]} ${SPACING[4]}`, display: 'flex', flexDirection: 'column', gap: SPACING[4] }}>
        {CATEGORIES.map(cat => {
          const catAchs = cat.ids
            .map(id => ACHIEVEMENTS[id])
            .filter(Boolean)
            .filter(a => {
              const done = !!meta?.achievements?.[a.id]?.unlocked;
              if (filter === 'done')    return done;
              if (filter === 'pending') return !done;
              return true;
            });

          if (catAchs.length === 0) return null;

          return (
            <div key={cat.key}>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.textSecondary, marginBottom: SPACING[2], letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: SPACING[1] }}>
                {cat.icon} {cat.label.toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
                {catAchs.map(ach => {
                  const achMeta = meta?.achievements?.[ach.id];
                  const done    = !!achMeta?.unlocked;
                  return (
                    <motion.div key={ach.id} whileTap={{ scale: 0.99 }}
                      style={{ background: COLORS_UI.bgCard, border: `1px solid ${done ? '#FFD70066' : COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, padding: SPACING[3], display: 'flex', gap: SPACING[3], alignItems: 'flex-start', opacity: done ? 1 : 0.65, position: 'relative', overflow: 'hidden' }}>
                      {done && (
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 2, background: 'linear-gradient(90deg, #FFD700, transparent)' }} />
                      )}
                      <div style={{ width: 44, height: 44, borderRadius: BORDERS.radius.md, background: done ? '#FFD70022' : COLORS_UI.bgElevated, border: `1px solid ${done ? '#FFD70066' : COLORS_UI.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                        {ach.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontWeight: TYPOGRAPHY.weight.bold, color: done ? '#FFD700' : COLORS_UI.text, fontSize: TYPOGRAPHY.size.sm }}>{ach.name}</div>
                        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textSecondary, marginTop: 2, lineHeight: 1.4 }}>{ach.desc}</div>
                        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, marginTop: 4 }}>
                          🎁 {ach.reward}
                        </div>
                        {done && achMeta?.unlockedAt && (
                          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '10px', color: '#FFD700', marginTop: 4 }}>
                            ✓ Desbloqueado el {formatDate(achMeta.unlockedAt)}
                          </div>
                        )}
                      </div>
                      {done && (
                        <div style={{ fontSize: 18, flexShrink: 0 }}>✅</div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
