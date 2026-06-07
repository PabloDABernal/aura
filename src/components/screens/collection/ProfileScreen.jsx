import { motion } from 'framer-motion';
import useStore from '../../../store/index.js';
import { getCollectorLevel, getSlotsForLevel, LEVEL_NAMES, LEVEL_THRESHOLDS } from '../../../store/metaSlice.js';
import { getTheme } from '../../../styles/colorThemes.js';
import { COLORS_UI, TYPOGRAPHY, SPACING, BORDERS, COLORS_GAME } from '../../../styles/tokens.js';

const COLOR_LIST = ['rojo', 'morado', 'negro', 'verde', 'naranja'];

export default function ProfileScreen() {
  const setScreen          = useStore(s => s.setScreen);
  const meta               = useStore(s => s.meta);
  const auth               = useStore(s => s.auth);
  const setAuth            = useStore(s => s.setAuth);
  const collection         = useStore(s => s.collection);
  const dispatchCollection = useStore(s => s.dispatchCollection);
  const dispatchMeta       = useStore(s => s.dispatchMeta);

  const points    = meta?.collectionPoints ?? 0;
  const level     = getCollectorLevel(points);
  const levelName = LEVEL_NAMES[level - 1] ?? 'Novato';
  const slots     = getSlotsForLevel(level);
  const user      = auth?.user;

  // Progress to next level
  const nextLevel    = Math.min(20, level + 1);
  const curThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[nextLevel - 1] ?? LEVEL_THRESHOLDS[19];
  const ptsInLevel   = points - curThreshold;
  const ptsNeeded    = nextThreshold - curThreshold;
  const pct          = level >= 20 ? 100 : Math.min(100, (ptsInLevel / ptsNeeded) * 100);

  const UNLOCK_COST = 20;
  const canUnlock   = points >= UNLOCK_COST;

  const handleUnlockSlot = (colorId) => {
    if (!canUnlock) return;
    dispatchCollection({ type: 'UNLOCK_SLOT', colorId });
    dispatchMeta({ type: 'GAIN_POINTS', amount: -UNLOCK_COST });
  };

  const handleLogout = () => {
    setAuth({ user: null, playLocal: false });
    setScreen('login');
  };

  // Achievements count
  const achievementsUnlocked = Object.values(meta?.achievements ?? {}).filter(a => a.unlocked).length;

  return (
    <div style={{ minHeight: '100vh', background: COLORS_UI.bg, display: 'flex', flexDirection: 'column', maxWidth: 460, margin: '0 auto', padding: SPACING[4], gap: SPACING[3] }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text }}>👤 PERFIL</div>
        <button onClick={() => setScreen('main-menu')} style={{ background: 'none', border: 'none', color: COLORS_UI.textMuted, cursor: 'pointer', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm }}>← Menú</button>
      </div>

      {/* Avatar + nivel */}
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[3], background: COLORS_UI.bgCard, borderRadius: BORDERS.radius.lg, padding: SPACING[3] }}>
        <div style={{ width: 60, height: 60, background: `${COLORS_GAME.morado}33`, border: `2px solid ${COLORS_GAME.morado}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {user?.photoURL
            ? <img src={user.photoURL} style={{ width: 60, height: 60, borderRadius: '50%' }} alt="" />
            : <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontWeight: TYPOGRAPHY.weight.black, fontSize: TYPOGRAPHY.size.lg, color: COLORS_GAME.morado }}>
                {(user?.displayName ?? 'JL').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </span>
          }
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text, fontSize: TYPOGRAPHY.size.md }}>
            {user?.displayName ?? 'Jugador Local'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[2], marginTop: 2 }}>
            <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontWeight: TYPOGRAPHY.weight.black, fontSize: TYPOGRAPHY.size.xl, color: '#FFD700' }}>Nv.{level}</span>
            <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textSecondary }}>{levelName}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontWeight: TYPOGRAPHY.weight.black, fontSize: TYPOGRAPHY.size.lg, color: '#FFD700' }}>{points}</div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>puntos</div>
        </div>
      </div>

      {/* Barra de progreso al siguiente nivel */}
      <div style={{ background: COLORS_UI.bgCard, borderRadius: BORDERS.radius.lg, padding: SPACING[3] }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: SPACING[2] }}>
          <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textSecondary }}>
            {level < 20 ? `Progreso a Nivel ${nextLevel} — ${levelName} → ${LEVEL_NAMES[nextLevel - 1]}` : 'Nivel máximo alcanzado'}
          </span>
          <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: '#FFD700', fontWeight: TYPOGRAPHY.weight.bold }}>
            {level < 20 ? `${ptsInLevel}/${ptsNeeded}` : '✓'}
          </span>
        </div>
        <div style={{ height: 10, background: '#222230', borderRadius: 5, overflow: 'hidden' }}>
          <motion.div
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ height: '100%', background: 'linear-gradient(90deg, #FFD700, #FFA500)', borderRadius: 5 }}
          />
        </div>
        {level < 20 && (
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, marginTop: SPACING[1] }}>
            {ptsNeeded - ptsInLevel} puntos para el siguiente nivel
          </div>
        )}
      </div>

      {/* Slots disponibles por nivel */}
      <div style={{ background: COLORS_UI.bgCard, borderRadius: BORDERS.radius.lg, padding: SPACING[3] }}>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.textSecondary, marginBottom: SPACING[2], letterSpacing: '0.08em' }}>
          SLOTS DE SET EN RUN
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[3] }}>
          <div style={{ display: 'flex', gap: SPACING[1] }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ width: 24, height: 24, borderRadius: 4, background: i < slots ? '#FFD700' : COLORS_UI.bgElevated, border: `1px solid ${i < slots ? '#FFD700' : COLORS_UI.border}` }} />
            ))}
          </div>
          <div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontWeight: TYPOGRAPHY.weight.black, fontSize: TYPOGRAPHY.size.lg, color: '#FFD700' }}>{slots}<span style={{ color: COLORS_UI.textMuted, fontSize: TYPOGRAPHY.size.sm }}>/8</span></div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
              {slots < 8 ? `Siguiente a Nv.${[4,8,12,16,20].find(l => getSlotsForLevel(l) > slots) ?? 20}` : 'Máximo'}
            </div>
          </div>
        </div>
      </div>

      {/* Stats rápidas */}
      <div style={{ display: 'flex', gap: SPACING[2] }}>
        {[
          ['🏃 Runs',    meta?.globalStats?.totalRuns ?? 0],
          ['🏆 Victorias', meta?.globalStats?.totalWins ?? 0],
          ['🏅 Logros',  achievementsUnlocked],
        ].map(([label, val]) => (
          <div key={label} style={{ flex: 1, background: COLORS_UI.bgCard, borderRadius: BORDERS.radius.md, padding: SPACING[2], textAlign: 'center' }}>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontWeight: TYPOGRAPHY.weight.black, fontSize: TYPOGRAPHY.size.lg, color: COLORS_UI.text }}>{val}</div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Botones navegación */}
      <div style={{ display: 'flex', gap: SPACING[2] }}>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setScreen('achievements')}
          style={{ flex: 1, padding: SPACING[3], background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, color: COLORS_UI.text, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, cursor: 'pointer' }}>
          🏆 Ver logros
        </motion.button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setScreen('stats')}
          style={{ flex: 1, padding: SPACING[3], background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, color: COLORS_UI.text, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, cursor: 'pointer' }}>
          📊 Ver stats
        </motion.button>
      </div>

      {/* Desbloquear slots de colección por color */}
      {canUnlock && (
        <div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.textSecondary, marginBottom: SPACING[1] }}>
            DESBLOQUEAR SLOT DE SET ({UNLOCK_COST} pts)
          </div>
          <div style={{ display: 'flex', gap: SPACING[1] }}>
            {COLOR_LIST.map(c => {
              const theme = getTheme(c);
              return (
                <motion.button key={c} whileTap={{ scale: 0.95 }} onClick={() => handleUnlockSlot(c)}
                  style={{ flex: 1, padding: SPACING[2], background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: BORDERS.radius.sm, color: theme.text, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, cursor: 'pointer', textAlign: 'center' }}>
                  {c[0].toUpperCase()}<br/><span style={{ fontSize: '9px' }}>+1</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {user && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleLogout}
          style={{ width: '100%', padding: `${SPACING[3]} 0`, background: 'none', border: `1px solid ${COLORS_UI.danger}`, borderRadius: BORDERS.radius.lg, color: COLORS_UI.danger, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, cursor: 'pointer' }}>
          Cerrar sesión
        </motion.button>
      )}
    </div>
  );
}
