import { useState }                               from 'react';
import { motion }                                  from 'framer-motion';
import { signInWithPopup, signInAnonymously,
         GoogleAuthProvider }                      from 'firebase/auth';
import { auth as firebaseAuth }                    from '../../firebase.js';
import useStore                                    from '../../store/index.js';
import { COLORS_UI, TYPOGRAPHY, SPACING, BORDERS,
         COLORS_GAME }                             from '../../styles/tokens.js';

export default function LoginScreen() {
  const setScreen   = useStore(s => s.setScreen);
  const setAuth     = useStore(s => s.setAuth);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const authAvailable = firebaseAuth !== null;

  const handleGoogle = async () => {
    if (!authAvailable) return;
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(firebaseAuth, provider);
      // onAuthStateChanged en App.jsx maneja la navegación
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión con Google');
      setLoading(false);
    }
  };

  const handleAnonymous = async () => {
    setLoading(true);
    setError('');
    if (!authAvailable) {
      setAuth({ user: null, playLocal: true });
      setScreen('home');
      return;
    }
    try {
      const cred = await signInAnonymously(firebaseAuth);
      setAuth({
        user: {
          uid:         cred.user.uid,
          displayName: null,
          email:       null,
          isAnonymous: true,
        },
        playLocal: false,
      });
      setScreen('home');
    } catch {
      // Fallback: modo local sin auth
      setAuth({ user: null, playLocal: true });
      setScreen('home');
    }
  };

  return (
    <div style={{
      minHeight: '100dvh', background: COLORS_UI.bg,
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
        <div style={{
          fontFamily: TYPOGRAPHY.fontFamily,
          fontSize: 'clamp(48px,12vw,72px)',
          fontWeight: TYPOGRAPHY.weight.black,
          color: COLORS_UI.text, letterSpacing: '0.15em',
        }}>
          AURA
        </div>
        <div style={{
          fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm,
          color: COLORS_UI.textMuted, letterSpacing: '0.2em', marginTop: SPACING[1],
        }}>
          EL JUEGO DEL COLECCIONISTA
        </div>
      </motion.div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2], width: '100%', maxWidth: 340 }}>

        {/* Google */}
        <motion.button
          whileTap={authAvailable && !loading ? { scale: 0.97 } : {}}
          onClick={authAvailable && !loading ? handleGoogle : undefined}
          disabled={!authAvailable || loading}
          title={!authAvailable ? 'Firebase no configurado' : undefined}
          style={{
            width: '100%', padding: `${SPACING[3]} 0`,
            background: authAvailable ? COLORS_UI.bgElevated : 'rgba(255,255,255,0.03)',
            border: `1px solid ${authAvailable ? COLORS_UI.border : 'rgba(255,255,255,0.08)'}`,
            borderRadius: BORDERS.radius.xl,
            color: authAvailable ? COLORS_UI.text : COLORS_UI.textMuted,
            fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md,
            fontWeight: TYPOGRAPHY.weight.bold,
            cursor: authAvailable && !loading ? 'pointer' : 'not-allowed',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          }}
        >
          <span>{loading ? '...' : '🔑 Continuar con Google'}</span>
          {!authAvailable && (
            <span style={{ fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
              Firebase no configurado
            </span>
          )}
        </motion.button>

        {/* Anónimo / Sin cuenta */}
        <motion.button
          whileTap={!loading ? { scale: 0.97 } : {}}
          onClick={!loading ? handleAnonymous : undefined}
          disabled={loading}
          style={{
            width: '100%', padding: `${SPACING[4]} 0`,
            background: COLORS_GAME.rojo, border: 'none',
            borderRadius: BORDERS.radius.xl, color: 'white',
            fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg,
            fontWeight: TYPOGRAPHY.weight.black, letterSpacing: '0.1em',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: `0 6px 24px ${COLORS_GAME.rojo}66`,
            opacity: loading ? 0.7 : 1,
          }}
        >
          ⚡ JUGAR SIN CUENTA
        </motion.button>

        {error && (
          <div style={{
            fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs,
            color: COLORS_GAME.rojo, textAlign: 'center', padding: `0 ${SPACING[2]}`,
          }}>
            {error}
          </div>
        )}

        <div style={{
          fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs,
          color: COLORS_UI.textMuted, textAlign: 'center',
        }}>
          {authAvailable
            ? 'Google: progreso sincronizado en la nube · Sin cuenta: solo local'
            : 'El progreso se guarda localmente en este dispositivo'}
        </div>
      </div>
    </div>
  );
}
