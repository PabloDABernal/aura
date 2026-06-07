import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../store/index.js';
import { ACHIEVEMENTS } from '../../data/achievements.js';
import { COLORS_UI, TYPOGRAPHY, SPACING, BORDERS } from '../../styles/tokens.js';

export default function AchievementToast() {
  const toast = useStore(s => s.achievementToast);
  const ach   = toast ? (ACHIEVEMENTS[toast] ?? null) : null;

  return (
    <AnimatePresence>
      {ach && (
        <motion.div
          key={ach.id}
          initial={{ x: 200, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 200, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          style={{
            position:     'fixed',
            top:          SPACING[4],
            right:        SPACING[3],
            zIndex:       9999,
            background:   '#1a1500',
            border:       '1px solid #FFD700',
            borderRadius: BORDERS.radius.lg,
            padding:      `${SPACING[2]} ${SPACING[3]}`,
            maxWidth:     260,
            boxShadow:    '0 4px 24px rgba(255,215,0,0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[2] }}>
            <span style={{ fontSize: 24 }}>{ach.icon}</span>
            <div>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: '#FFD700', fontWeight: TYPOGRAPHY.weight.bold }}>
                ¡Logro desbloqueado!
              </div>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text }}>
                {ach.name}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
