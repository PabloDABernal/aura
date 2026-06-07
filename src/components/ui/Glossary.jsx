import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COLORS_UI, TYPOGRAPHY, SPACING, BORDERS, COLORS_GAME } from '../../styles/tokens.js';

const TABS = ['Keywords', 'Atributos', 'Vibra', 'Lugares', 'Ecos'];

const CONTENT = {
  Keywords: [
    { name: 'Viral', desc: 'Activa: suma Presencia × nº aliados en zona al daño. Color: Rojo.' },
    { name: 'Tendencia', desc: 'Pasiva: al Descansar, gana +X Temple. Color: Verde.' },
    { name: 'Inspirador', desc: 'Pasiva: cuando entra un aliado a tu zona, gana +X Aura. Color: Verde.' },
    { name: 'Polémico', desc: 'Activa: al Intervenir, +influencia por aliado en el lugar. Color: Morado.' },
    { name: 'Desenmascarado', desc: 'Pasiva: reduce daño entrante en Presencia/2. Color: Rojo.' },
    { name: 'Emboscada', desc: 'Activa: turno extra inmediatamente tras esta acción. Color: Rojo.' },
    { name: 'Omnipresente', desc: 'Pasiva: puede actuar desde cualquier zona incluyendo HQ. Color: Negro.' },
  ],
  Atributos: [
    { name: 'Presencia', desc: 'Daño al Confrontar y margen del cronómetro en Confrontar. Barra roja.' },
    { name: 'Influencia', desc: 'Daño al Intervenir y margen del cronómetro en Intervenir. Barra morada.' },
    { name: 'Temple', desc: 'Aguante del personaje. El daño resta Temple primero antes de afectar P o I. Barra verde.' },
    { name: 'Aura total', desc: 'Presencia + Influencia + Temple. Llegar a 0 = KO.' },
  ],
  Vibra: [
    { name: 'Flow', desc: 'Diferencia exacta = 0. Daño × 2 + bonus tiempo + personaje gana Aura.' },
    { name: 'Vibra', desc: 'Diferencia dentro del margen. Daño × 1 + bonus tiempo + personaje gana Aura.' },
    { name: 'Fallo', desc: 'Diferencia > margen pero ≤ margen+20. Sin daño, sin efecto.' },
    { name: 'Pifia', desc: 'Diferencia > margen+20. El personaje pierde 1 Aura.' },
    { name: 'Timeout', desc: 'Llega a 10 segundos sin parar. Sin efecto.' },
    { name: 'Bonus de tiempo', desc: '0.xx→+5, 1.xx→+4, 2.xx→+3, 3.xx→+2, 4.xx→+1, 5+→0 Aura extra.' },
    { name: 'Margen', desc: 'max(atributo, 2) centésimas a cada lado del objetivo. Crece dinámicamente.' },
  ],
  Lugares: [
    { name: 'Básico', desc: 'Punto exacto en 7s. Resonancia = doble del Aura del rival.' },
    { name: 'Cronometrado', desc: 'Temporizador propio. Si llega a 0, el rival sube resonancia.' },
    { name: 'Bastión', desc: 'El rival tiene escudo que debes bajar primero.' },
    { name: 'Carrera', desc: 'Ambos bajan resonancia. El primero en llegar a 0 gana.' },
    { name: 'Espejo', desc: 'Cada intervención exitosa del jugador sube un poco la resonancia rival.' },
    { name: 'Eco', desc: 'Al conquistarlo activas un Eco aleatorio.' },
  ],
  Ecos: [
    { name: 'Normal', desc: 'Los más comunes. Se obtienen en combates básicos.' },
    { name: 'Infrecuente', desc: 'Efectos más potentes, a veces con penalización. Élite y Conquista.' },
    { name: 'Raro', desc: 'Muy poderosos. Solo en Jefes de Área y Fusionado.' },
    { name: 'Doble Filo', desc: 'Ventaja + penalización. Riesgo/recompensa. Especialmente difíciles.' },
    { name: 'Especial', desc: 'Se desbloquean completando runs bajo condiciones específicas.' },
  ],
};

export default function Glossary({ onClose }) {
  const [tab, setTab] = useState(0);
  const items = CONTENT[TABS[tab]] ?? [];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: SPACING[4] }}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        onClick={e => e.stopPropagation()}
        style={{ background: COLORS_UI.bgElevated, borderRadius: BORDERS.radius.xl, border: `1px solid ${COLORS_UI.border}`, width: '100%', maxWidth: 440, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <div style={{ padding: `${SPACING[3]} ${SPACING[4]}`, borderBottom: `1px solid ${COLORS_UI.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text }}>📖 GLOSARIO</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: COLORS_UI.textMuted, cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>

        <div style={{ display: 'flex', padding: `${SPACING[2]} ${SPACING[3]}`, gap: 4, borderBottom: `1px solid ${COLORS_UI.border}` }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              style={{ flex: 1, padding: '4px 0', background: tab===i ? COLORS_UI.bgCard : 'none', border: `1px solid ${tab===i ? COLORS_UI.border : 'transparent'}`, borderRadius: BORDERS.radius.sm, color: tab===i ? COLORS_UI.text : COLORS_UI.textMuted, fontFamily: TYPOGRAPHY.fontFamily, fontSize: '10px', cursor: 'pointer' }}>
              {t}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: SPACING[3], display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
          {items.map(item => (
            <div key={item.name} style={{ background: COLORS_UI.bgCard, borderRadius: BORDERS.radius.md, padding: SPACING[2] }}>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.text, marginBottom: 2 }}>{item.name}</div>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textSecondary }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
