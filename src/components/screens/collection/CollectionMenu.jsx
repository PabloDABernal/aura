import { motion } from 'framer-motion';
import useStore from '../../../store/index.js';
import { COLORS_UI, TYPOGRAPHY, SPACING, BORDERS, COLORS_GAME } from '../../../styles/tokens.js';

export default function CollectionMenu() {
  const setScreen = useStore(s => s.setScreen);
  const meta      = useStore(s => s.meta);

  const level     = meta?.collectionLevel ?? 0;
  const points    = meta?.collectionPoints ?? 0;
  const nextLevel = (level + 1) * 10;
  const pct       = Math.min(100, ((points % 10) / 10) * 100);

  const MENU_ITEMS = [
    { icon: '📦', label: 'Mis Sets', screen: 'sets', desc: 'Gestiona tus colecciones' },
    { icon: '✨', label: 'Ecos', screen: 'achievements', desc: 'Logros y colección de Ecos' },
    { icon: '📊', label: 'Estadísticas', screen: 'stats', desc: 'Historial y datos globales' },
    { icon: '👤', label: 'Perfil', screen: 'profile', desc: 'Nivel, puntos y configuración' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: COLORS_UI.bg, display: 'flex', flexDirection: 'column', maxWidth: 460, margin: '0 auto', padding: SPACING[4], gap: SPACING[3] }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size['2xl'], fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text }}>COLECCIONISTA</div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>Nivel {level}</div>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setScreen('main-menu')}
          style={{ background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.md, color: COLORS_UI.textSecondary, padding: `${SPACING[1]} ${SPACING[2]}`, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, cursor: 'pointer' }}>
          ← Menú
        </motion.button>
      </div>

      {/* Barra de nivel */}
      <div style={{ background: COLORS_UI.bgCard, borderRadius: BORDERS.radius.lg, border: `1px solid ${COLORS_UI.border}`, padding: SPACING[3] }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: SPACING[1] }}>
          <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textSecondary }}>Puntos de Coleccionista</span>
          <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontWeight: TYPOGRAPHY.weight.bold, color: '#FFD700' }}>{points} pts</span>
        </div>
        <div style={{ height: 8, background: '#222230', borderRadius: 4, overflow: 'hidden' }}>
          <motion.div animate={{ width: `${pct}%` }} style={{ height: '100%', background: '#FFD700', borderRadius: 4 }} />
        </div>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, marginTop: SPACING[1] }}>
          Nivel {level} → {level + 1} en {nextLevel - points} puntos
        </div>
      </div>

      {/* Menú */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
        {MENU_ITEMS.map(item => (
          <motion.div key={item.screen} whileTap={{ scale: 0.98 }} onClick={() => setScreen(item.screen)}
            style={{ background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, padding: SPACING[4], cursor: 'pointer', display: 'flex', alignItems: 'center', gap: SPACING[3] }}>
            <span style={{ fontSize: 32 }}>{item.icon}</span>
            <div>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text, fontSize: TYPOGRAPHY.size.lg }}>{item.label}</div>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>{item.desc}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
