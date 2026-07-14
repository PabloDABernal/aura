/**
 * IntroScreen — secuencia narrativa de bienvenida (primera vez).
 * Se muestra una vez. Se puede saltar. Al terminar: character-creator.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../store/index.js';
import {
  COLORS_GAME, TYPOGRAPHY, SPACING, BORDERS,
} from '../../styles/tokens.js';

const SLIDES = [
  "Todo lo que ha existido deja una huella en el tiempo.",
  "Real o soñado. Recordado o imaginado. Toda resonancia perdura.",
  "Tú eres un Sincronista. Tu don: capturar esas resonancias y darles forma.",
  "Sincronízalas con el tiempo. Llévalas a su forma perfecta.",
];

export default function IntroScreen() {
  const { setScreen, dispatchMeta } = useStore();
  const [slide, setSlide] = useState(0);

  const isLast = slide === SLIDES.length - 1;

  const finish = () => {
    dispatchMeta({ type: 'SET_HAS_SEEN_INTRO' });
    setScreen('character-creator');
  };

  const handleAdvance = () => {
    if (isLast) finish();
    else setSlide(s => s + 1);
  };

  return (
    <div
      onClick={handleAdvance}
      style={{
        minHeight: '100dvh',
        background: '#040407',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING[8],
        position: 'relative',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {/* Saltar */}
      <button
        onClick={e => { e.stopPropagation(); finish(); }}
        style={{
          position: 'absolute', top: SPACING[5], right: SPACING[5],
          background: 'transparent', border: 'none',
          color: 'rgba(255,255,255,0.22)',
          fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs,
          cursor: 'pointer', letterSpacing: '0.08em',
          padding: `${SPACING[1]} ${SPACING[2]}`,
        }}
      >
        Saltar
      </button>

      {/* Dots */}
      <div style={{ position: 'absolute', top: SPACING[6], left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '7px' }}>
        {SLIDES.map((_, i) => (
          <div key={i} style={{ width: '5px', height: '5px', borderRadius: '3px', background: i <= slide ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.14)', transition: 'background 0.35s' }} />
        ))}
      </div>

      {/* Texto principal */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -18 }}
          transition={{ duration: 0.55, ease: [0.25, 0, 0, 1] }}
          style={{ maxWidth: '320px', textAlign: 'center' }}
        >
          <div style={{
            fontFamily: TYPOGRAPHY.fontFamily,
            fontSize: TYPOGRAPHY.size.xl,
            fontWeight: TYPOGRAPHY.weight.bold,
            color: 'rgba(255,255,255,0.86)',
            lineHeight: 1.6,
            letterSpacing: '0.01em',
          }}>
            {SLIDES[slide]}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Bottom */}
      <div style={{ position: 'absolute', bottom: SPACING[10], left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: SPACING[3] }}>
        {isLast ? (
          <motion.button
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            onClick={e => { e.stopPropagation(); finish(); }}
            style={{
              padding: `${SPACING[3]} ${SPACING[8]}`,
              background: COLORS_GAME.verde,
              border: 'none',
              borderRadius: BORDERS.radius.xl,
              fontFamily: TYPOGRAPHY.fontFamily,
              fontSize: TYPOGRAPHY.size.lg,
              fontWeight: TYPOGRAPHY.weight.black,
              color: 'white',
              cursor: 'pointer',
              letterSpacing: '0.12em',
              boxShadow: `0 4px 20px ${COLORS_GAME.verde}66`,
            }}
          >
            COMENZAR
          </motion.button>
        ) : (
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>
            toca para continuar
          </div>
        )}
      </div>
    </div>
  );
}
