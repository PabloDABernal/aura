import { motion } from 'framer-motion';
import useStore from '../../store/index.js';
import { COLORS_UI, TYPOGRAPHY, SPACING, BORDERS, COLORS_GAME } from '../../styles/tokens.js';

export default function LoginScreen() {
  const setScreen = useStore(s => s.setScreen);
  const setAuth   = useStore(s => s.setAuth);
  const run       = useStore(s => s.run);

  const playLocal = () => {
    setAuth({ user: null, playLocal: true });
    setScreen('main-menu');
  };

  // Firebase no configurado — botón Google deshabilitado con nota
  return (
    <div style={{
      minHeight: '100vh', background: COLORS_UI.bg,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: SPACING[6], gap: SPACING[4],
      maxWidth: 460, margin: '0 auto',
    }}>
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        style={{ textAlign: 'center' }}
      >
        <div style={{ fontSize: 72, marginBottom: SPACING[2] }}>⚡</div>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: 'clamp(48px,12vw,72px)', fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text, letterSpacing: '0.15em' }}>
          AURA
        </div>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textMuted, letterSpacing: '0.2em', marginTop: SPACING[1] }}>
          EL JUEGO DEL COLECCIONISTA
        </div>
      </motion.div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2], width: '100%', maxWidth: 340 }}>
        {/* Google — deshabilitado sin Firebase */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled
          style={{
            width: '100%', padding: `${SPACING[3]} 0`,
            background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`,
            borderRadius: BORDERS.radius.xl, color: COLORS_UI.textMuted,
            fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md,
            fontWeight: TYPOGRAPHY.weight.bold, cursor: 'not-allowed',
          }}
        >
          🔒 Continuar con Google
          <div style={{ fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, marginTop: 2 }}>
            (Configura Firebase para activar)
          </div>
        </motion.button>

        {/* Local */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={playLocal}
          style={{
            width: '100%', padding: `${SPACING[4]} 0`,
            background: COLORS_GAME.rojo, border: 'none',
            borderRadius: BORDERS.radius.xl, color: 'white',
            fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg,
            fontWeight: TYPOGRAPHY.weight.black, letterSpacing: '0.1em',
            cursor: 'pointer', boxShadow: `0 6px 24px ${COLORS_GAME.rojo}66`,
          }}
        >
          ⚡ JUGAR SIN CUENTA
        </motion.button>

        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, textAlign: 'center' }}>
          El progreso se guarda localmente en este dispositivo
        </div>
      </div>
    </div>
  );
}
