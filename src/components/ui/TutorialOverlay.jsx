import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COLORS_UI, TYPOGRAPHY, SPACING, BORDERS, COLORS_GAME } from '../../styles/tokens.js';

const STEPS = [
  { text: 'Este es tu HQ. Tus personajes esperan aquí.', area: 'HQ' },
  { text: 'Mueve un personaje al Foso para poder Confrontar al rival.', area: 'Foso' },
  { text: 'Pulsa Confrontar y para el cronómetro en las centésimas correctas. ¡Parar antes da más bonus!', area: 'Cronómetro' },
  { text: 'Mueve un personaje al Lugar para Intervenir y reducir su resonancia.', area: 'Lugar' },
  { text: 'Gana cuando el Aura del rival llegue a 0 o la resonancia del lugar llegue a 0.', area: 'General' },
];

export default function TutorialOverlay({ onDone }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        key="tutorial"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 900, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: SPACING[4] }}
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          style={{ background: COLORS_UI.bgElevated, borderRadius: BORDERS.radius.xl, border: `1px solid ${COLORS_UI.border}`, padding: SPACING[4], maxWidth: 440, width: '100%', display: 'flex', flexDirection: 'column', gap: SPACING[3] }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.textMuted }}>
              📖 Paso {step + 1} / {STEPS.length}
            </span>
            <button onClick={onDone} style={{ background: 'none', border: 'none', color: COLORS_UI.textMuted, cursor: 'pointer', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs }}>
              Saltar tutorial
            </button>
          </div>

          <div style={{ display: 'flex', gap: SPACING[2], alignItems: 'center' }}>
            <span style={{ background: COLORS_GAME.rojo + '33', color: COLORS_GAME.rojo, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, borderRadius: BORDERS.radius.sm, padding: '2px 8px' }}>
              {current.area}
            </span>
          </div>

          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, color: COLORS_UI.text, lineHeight: 1.5 }}>
            {current.text}
          </div>

          <div style={{ display: 'flex', gap: SPACING[2] }}>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                style={{ flex: 1, padding: `${SPACING[2]} 0`, background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, color: COLORS_UI.textSecondary, fontFamily: TYPOGRAPHY.fontFamily, fontWeight: TYPOGRAPHY.weight.bold, cursor: 'pointer' }}>
                ← Anterior
              </button>
            )}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => isLast ? onDone() : setStep(s => s + 1)}
              style={{ flex: 2, padding: `${SPACING[3]} 0`, background: isLast ? COLORS_GAME.verde : COLORS_GAME.rojo, border: 'none', borderRadius: BORDERS.radius.lg, color: 'white', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.black, cursor: 'pointer', boxShadow: `0 4px 16px ${isLast ? COLORS_GAME.verde : COLORS_GAME.rojo}66` }}
            >
              {isLast ? '¡Entendido! ⚡' : 'Siguiente →'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
