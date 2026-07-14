/**
 * InfiniteRunScreen — Modo Infinito directo. GDD v4.0 §10.2.
 * Requiere collectorLevel >= 10.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import useStore from '../../store/index.js';
import {
  COLORS_UI, COLORS_GAME,
  TYPOGRAPHY, SPACING, BORDERS,
} from '../../styles/tokens.js';

function gradeStars(grade) {
  const filled = Math.ceil((grade ?? 1) / 2);
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}

export default function InfiniteRunScreen() {
  const { characters, setScreen, startInfiniteDirectRun } = useStore();

  const [selCharId, setSelCharId] = useState(null);

  const activeChars = Object.values(characters).filter(c => c.status === 'active' && !c._isSystemChar);
  const selChar     = selCharId ? characters[selCharId] : null;
  const bestScore   = selChar?.stats?.bestInfiniteScore ?? 0;

  const handleStart = () => {
    if (!selCharId) return;
    startInfiniteDirectRun(selCharId);
    setScreen('run');
  };

  return (
    <div style={{ minHeight: '100dvh', background: '#0E0E12', display: 'flex', flexDirection: 'column', maxWidth: '460px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ padding: `${SPACING[5]} ${SPACING[4]} ${SPACING[3]}`, borderBottom: '1px solid rgba(255,215,0,0.15)', background: 'rgba(14,14,18,0.98)', display: 'flex', alignItems: 'center', gap: SPACING[3] }}>
        <motion.button whileTap={{ scale: 0.94 }} onClick={() => setScreen('home')}
          style={{ background: 'transparent', border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, color: COLORS_UI.textMuted, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, padding: `${SPACING[1]} ${SPACING[3]}`, cursor: 'pointer' }}>
          ←
        </motion.button>
        <div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: '#FFD700', letterSpacing: '0.08em' }}>
            ∞ Modo Infinito
          </div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
            Grado de Sincronía 10 · concentración normal · sin límite
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: SPACING[4], display: 'flex', flexDirection: 'column', gap: SPACING[5], paddingBottom: '100px' }}>

        {/* Reglas */}
        <div style={{ background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.15)', borderRadius: BORDERS.radius.xl, padding: SPACING[4], display: 'flex', flexDirection: 'column', gap: SPACING[3] }}>
          {[
            { icon: '★', label: 'Todas las pruebas a Grado 10' },
            { icon: '∞', label: 'Sin límite de pruebas — el récord es cuántas aguantas' },
            { icon: '⚡', label: 'Velocidad +5% cada 5 pruebas superadas' },
            { icon: '−', label: 'Margen −1cs cada 10 pruebas (mínimo 1cs)' },
            { icon: '◆', label: `+100 L al terminar si superaste al menos 1 prueba` },
          ].map(({ icon, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: SPACING[3] }}>
              <div style={{ width: '28px', height: '28px', borderRadius: BORDERS.radius.md, background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.black, color: '#FFD700' }}>
                {icon}
              </div>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textSecondary }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Selector de personaje */}
        <div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, letterSpacing: '0.08em', marginBottom: SPACING[2] }}>
            ELIGE PERSONAJE
          </div>
          {activeChars.length === 0 ? (
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textMuted, textAlign: 'center', padding: SPACING[4] }}>
              No hay personajes activos
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
              {activeChars.map(c => {
                const sel      = selCharId === c.id;
                const initials = (c.name ?? '?').slice(0, 2).toUpperCase();
                const best     = c.stats?.bestInfiniteScore ?? 0;
                return (
                  <motion.button key={c.id} whileTap={{ scale: 0.98 }} onClick={() => setSelCharId(c.id)}
                    style={{ padding: `${SPACING[3]} ${SPACING[4]}`, background: sel ? 'rgba(255,215,0,0.06)' : COLORS_UI.bgCard, border: `1px solid ${sel ? 'rgba(255,215,0,0.35)' : COLORS_UI.border}`, borderRadius: BORDERS.radius.xl, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: SPACING[3], textAlign: 'left' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: BORDERS.radius.lg, background: 'linear-gradient(135deg,#22222E,#1A1A2E)', border: `1px solid ${sel ? 'rgba(255,215,0,0.35)' : COLORS_UI.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: TYPOGRAPHY.fontFamily, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.textSecondary }}>
                      {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color: sel ? '#FFD700' : COLORS_UI.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.name}
                      </div>
                      <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '10px', color: COLORS_UI.textMuted, marginTop: '1px' }}>
                        Grado {c.grade} · {gradeStars(c.grade)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {best > 0 ? (
                        <>
                          <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color: '#FFD700' }}>
                            ∞ {best}
                          </div>
                          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '9px', color: COLORS_UI.textMuted }}>récord</div>
                        </>
                      ) : (
                        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '9px', color: COLORS_UI.textMuted }}>sin récord</div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {selChar && bestScore > 0 && (
          <div style={{ background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.xl, padding: SPACING[4], display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textMuted }}>Récord de {selChar.name}</div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: '#FFD700' }}>
              ∞ {bestScore}
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '460px', padding: `${SPACING[3]} ${SPACING[4]}`, background: 'rgba(14,14,18,0.97)', borderTop: '1px solid rgba(255,215,0,0.1)', backdropFilter: 'blur(8px)' }}>
        <motion.button whileTap={selCharId ? { scale: 0.97 } : {}}
          onClick={selCharId ? handleStart : undefined}
          disabled={!selCharId}
          style={{
            width: '100%', minHeight: '56px',
            background: selCharId ? 'linear-gradient(135deg,#92400E,#FFD700)' : COLORS_UI.bgCard,
            border: selCharId ? 'none' : `1px solid ${COLORS_UI.border}`,
            borderRadius: BORDERS.radius.xl,
            fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black,
            color: selCharId ? '#000' : COLORS_UI.textMuted,
            cursor: selCharId ? 'pointer' : 'not-allowed',
            letterSpacing: '0.1em',
            boxShadow: selCharId ? '0 4px 28px rgba(255,215,0,0.3)' : 'none',
          }}>
          ∞ INICIAR INFINITO
        </motion.button>
      </div>
    </div>
  );
}
