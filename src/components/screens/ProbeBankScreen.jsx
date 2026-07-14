/**
 * ProbeBankScreen — vista informativa de las 20 pruebas del banco.
 * GDD v3.0 Sección 4. Solo lectura, sin editor.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../store/index.js';
import { COLORS_UI, TYPOGRAPHY, SPACING, BORDERS } from '../../styles/tokens.js';

const PROBE_DATA = [
  // 4.1 Cronómetro Clásico
  { id: 'bingo',            name: 'Bingo a Tiempo',       family: 'precision',   icon: '🎯', unlock: 1,  desc: 'Aparecen N objetivos simultáneos. Para en cada uno antes de que se acabe el tiempo.', params: 'Objetivos: 3→8 · Tiempo: 60s→30s · Margen: ±10→±3 cs' },
  { id: 'xopportunities',   name: 'X Oportunidades',      family: 'precision',   icon: '🎯', unlock: 1,  desc: 'N objetivos en una línea de tiempo. Captura al menos 1 antes del final.', params: 'Números: 3→6 · Aciertos req.: 1→2 · Margen: ±8→±2 cs' },
  { id: 'suma100',          name: 'Suma 100',              family: 'calculo',     icon: '🔢', unlock: 1,  desc: 'Cada parada suma el segundo actual. Llega exactamente a 100 sin pasarte.', params: 'Tiempo: 90s→45s · Resets: 3→0' },
  { id: 'cadena',           name: 'Cadena',                family: 'precision',   icon: '🎯', unlock: 1,  desc: '5 sub-objetivos seguidos. Cada acierto activa el siguiente con menos tiempo.', params: 'Eslabones: 3→5 · Tiempo/eslabón: 15s→8s · Margen: ±10→±3 cs' },
  { id: 'memoria',          name: 'Memoria',               family: 'memoria',     icon: '🧠', unlock: 1,  desc: 'Para una vez. Espera. Vuelve a parar en el mismo valor.', params: 'Delay: 3s→6s · Margen: ±10→±3 cs' },
  { id: 'ciego',            name: 'Ciego',                 family: 'memoria',     icon: '🧠', unlock: 1,  desc: 'La pantalla se oscurece. Solo ticks auditivos. Para en el objetivo.', params: 'Visible inicial: 3s→1s · Margen: ±10→±3 cs' },
  { id: 'pendulo',          name: 'Péndulo',               family: 'percepcion',  icon: '👁', unlock: 1,  desc: 'El cronómetro va y vuelve. Para cuando el valor pasa por el objetivo en cualquier dirección.', params: 'Pasadas máx: 3→6 · Margen: ±10→±3 cs' },
  // 4.2 Predicción y Duración
  { id: 'espejo',           name: 'Espejo',                family: 'percepcion',  icon: '👁', unlock: 4,  desc: 'El cronómetro corre hacia atrás. Lee el tiempo invertido y para en el objetivo.', params: 'Inicio: 5.00→15.00 · Margen: ±10→±3 cs' },
  { id: 'parpadeo',         name: 'Parpadeo',              family: 'percepcion',  icon: '👁', unlock: 4,  desc: 'El cronómetro solo se ve en destellos breves. Para en el objetivo durante un destello.', params: 'Visible: 0.5s→0.15s · Oculto: 1.5s→2.5s · Margen: ±10→±3 cs' },
  { id: 'rebote',           name: 'Rebote',                family: 'percepcion',  icon: '👁', unlock: 4,  desc: 'Tu clic detiene el cronómetro con un delay. Compensa la latencia.', params: 'Delay: 0.5s fijo→aleatorio · Margen: ±10→±3 cs' },
  { id: 'cuentainterna',    name: 'Cuenta Interna',        family: 'memoria',     icon: '🧠', unlock: 4,  desc: 'Cuenta X segundos sin referencia visual ni auditiva constante.', params: 'Objetivo: 3s→10s · Margen: ±0.50s→±0.10s · Intentos: 3→1' },
  { id: 'cadenciafantasma', name: 'Cadencia Fantasma',     family: 'percepcion',  icon: '👁', unlock: 4,  desc: 'Un objeto invisible viaja a velocidad constante. Clica cuando crees que llega a la meta.', params: 'Duración: 4s→10s · Margen: ±0.40s→±0.10s' },
  { id: 'cargaenergia',     name: 'Carga de Energía',      family: 'percepcion',  icon: '👁', unlock: 4,  desc: 'Mantén pulsado exactamente X segundos. La barra es deliberadamente engañosa.', params: 'Objetivo: 3s→10s · Curva: lineal→oscilante · Margen: ±0.50s→±0.10s' },
  // 4.3 Ritmo y Sincronización
  { id: 'ecovisual',        name: 'Eco Visual',            family: 'ritmo',       icon: '🎵', unlock: 7,  desc: '3 luces parpadean en secuencia. Apréndelo. Reprodúcelo exacto.', params: 'Luces: 3→5 · Ciclos muestra: 3→1 · Intervalo: 1.0s→0.5s · Margen: ±200ms→±70ms' },
  { id: 'poliritmo',        name: 'Poliritmo',             family: 'ritmo',       icon: '🎵', unlock: 7,  desc: 'Dos patrones sonoros simultáneos. Clica exactamente cuando coinciden.', params: 'Intervalos: 0.8s+1.2s → 0.5s+0.9s · Margen: ±250ms→±100ms' },
  { id: 'sincroniafase',    name: 'Sincronía de Fase',     family: 'ritmo',       icon: '🎵', unlock: 7,  desc: 'Un punto gira. La velocidad varía. Clica al pasar por el punto fijo.', params: 'Revoluciones: 2→5 · Margen: ±15°→±5°' },
  // 4.5 Acumulación y Control
  { id: 'equilibrio',       name: 'Equilibrio',            family: 'calculo',     icon: '🔢', unlock: 1,  desc: 'Empieza en 50. Mantente entre 40 y 60 durante 30 segundos. Impar resta, par suma.', params: 'Rango: 40-60→48-52 · Duración: 30s→20s' },
  { id: 'banca',            name: 'Banca',                 family: 'calculo',     icon: '🔢', unlock: 1,  desc: '5 paradas silenciosas. Al final, la suma debe estar entre 90 y 110.', params: 'Paradas: 5→3 · Rango: 80-120→98-102 · Descartes: ∞→0' },
  { id: 'doblenada',        name: 'Doble o Nada',          family: 'calculo',     icon: '🔢', unlock: 1,  desc: 'Suma paradas voluntarias. Pásate de 10.00 y pierdes todo. Objetivo: acercarte a 9.99.', params: 'Paradas máx: 3→2 · Límite: 8.00→10.00 · Margen: ±0.50→±0.05' },
  // 4.6 Azar y Estrategia
  { id: 'pacto',            name: 'Pacto',                 family: 'azar',        icon: '🎲', unlock: 7,  desc: 'Propón un rango de tiempo. El cronómetro para solo. ¿Caerá dentro?', params: 'Monedas: 5→2 · Coste/rango: 1/2.00s→1/0.75s · Intentos: 3→1' },
];

const FAMILY_INFO = {
  precision:  { label: 'Precisión',       color: '#60A5FA' },
  calculo:    { label: 'Cálculo',         color: '#A78BFA' },
  memoria:    { label: 'Memoria',         color: '#34D399' },
  percepcion: { label: 'Percepción',      color: '#F97316' },
  ritmo:      { label: 'Ritmo',           color: '#EC4899' },
  azar:       { label: 'Azar',            color: '#FBBF24' },
};

export default function ProbeBankScreen() {
  const meta = useStore(s => s.meta);
  const level = meta?.collectionLevel ?? 1;
  const [expanded, setExpanded] = useState(null);

  return (
    <div style={{ padding: `${SPACING[4]} ${SPACING[4]} ${SPACING[4]}` }}>

      {/* Header */}
      <div style={{ marginBottom: SPACING[4] }}>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: '#F0F0F5', letterSpacing: '0.06em' }}>
          Banco de Pruebas
        </div>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, marginTop: SPACING[1] }}>
          {PROBE_DATA.filter(p => p.unlock <= level).length} / 20 desbloqueadas · Nivel {level}
        </div>
      </div>

      {/* Probe list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
        {PROBE_DATA.map(probe => {
          const unlocked = probe.unlock <= level;
          const isOpen = expanded === probe.id;
          const fam = FAMILY_INFO[probe.family] ?? { label: probe.family, color: COLORS_UI.textMuted };

          return (
            <div key={probe.id}>
              <motion.button
                whileTap={unlocked ? { scale: 0.98 } : {}}
                onClick={() => unlocked && setExpanded(isOpen ? null : probe.id)}
                style={{
                  width: '100%', textAlign: 'left', cursor: unlocked ? 'pointer' : 'default',
                  background: isOpen ? COLORS_UI.bgElevated : COLORS_UI.bgCard,
                  border: isOpen ? `1px solid ${fam.color}44` : `1px solid ${COLORS_UI.border}`,
                  borderRadius: isOpen ? `${BORDERS.radius.lg} ${BORDERS.radius.lg} 0 0` : BORDERS.radius.lg,
                  padding: SPACING[3],
                  display: 'flex', alignItems: 'center', gap: SPACING[3],
                  opacity: unlocked ? 1 : 0.45,
                }}
              >
                {/* Family icon */}
                <div style={{ fontSize: '20px', flexShrink: 0, filter: unlocked ? 'none' : 'grayscale(1)' }}>
                  {unlocked ? probe.icon : '🔒'}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[2] }}>
                    <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color: unlocked ? '#F0F0F5' : COLORS_UI.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {probe.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: SPACING[2], marginTop: '2px', alignItems: 'center' }}>
                    <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '9px', fontWeight: TYPOGRAPHY.weight.bold, color: unlocked ? fam.color : COLORS_UI.textMuted, letterSpacing: '0.06em', padding: '1px 5px', background: unlocked ? `${fam.color}18` : 'transparent', borderRadius: BORDERS.radius.sm }}>
                      {probe.icon} {fam.label.toUpperCase()}
                    </span>
                    {!unlocked && (
                      <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '9px', color: COLORS_UI.textMuted, letterSpacing: '0.05em' }}>
                        Nivel {probe.unlock}+
                      </span>
                    )}
                  </div>
                </div>

                {/* Chevron */}
                {unlocked && (
                  <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}
                    style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '10px', color: COLORS_UI.textMuted, flexShrink: 0 }}>
                    ▼
                  </motion.span>
                )}
              </motion.button>

              {/* Expanded detail */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    key="detail"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ background: COLORS_UI.bgElevated, border: `1px solid ${fam.color}44`, borderTop: 'none', borderRadius: `0 0 ${BORDERS.radius.lg} ${BORDERS.radius.lg}`, padding: SPACING[3], display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
                      <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textSecondary, lineHeight: 1.5 }}>
                        {probe.desc}
                      </div>
                      <div style={{ background: COLORS_UI.bg, borderRadius: BORDERS.radius.md, padding: SPACING[2], border: `1px solid ${COLORS_UI.border}` }}>
                        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '9px', color: COLORS_UI.textMuted, letterSpacing: '0.07em', marginBottom: '2px' }}>PARÁMETROS POR GRADO</div>
                        <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '10px', color: COLORS_UI.textSecondary, lineHeight: 1.6 }}>
                          {probe.params}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
